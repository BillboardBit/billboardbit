import { SimplePool, finalizeEvent } from 'nostr-tools';
import type { Event, Filter } from 'nostr-tools';
import type { BoardConfig, ZapMessage } from '../types';
import { parseZapReceipt } from './nip57';

export const DEFAULT_RELAYS = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social',
];

let poolInstance: SimplePool | null = null;

// Global deduplication cache for zap events across all subscriptions
// Using both event.id and bolt11 to catch duplicate zap receipts
const globalSeenZaps = new Map<string, number>();
const globalSeenBolt11 = new Map<string, number>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [id, timestamp] of globalSeenZaps.entries()) {
        if (now - timestamp > CACHE_EXPIRY) {
            globalSeenZaps.delete(id);
        }
    }
    for (const [bolt11, timestamp] of globalSeenBolt11.entries()) {
        if (now - timestamp > CACHE_EXPIRY) {
            globalSeenBolt11.delete(bolt11);
        }
    }
}, 60 * 60 * 1000); // Clean every hour

export function getPool(): SimplePool {
    if (!poolInstance) {
        poolInstance = new SimplePool();
    }
    return poolInstance;
}

/**
 * Publish board config to Nostr relays
 */
export async function publishBoardConfig(
    config: BoardConfig,
    privateKey: Uint8Array
): Promise<void> {
    const pool = getPool();

    const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ['d', config.boardId],
            ['title', config.displayName],
            ['ln', config.lightningAddress],
            ['min_zap', config.minZapAmount.toString()],
        ],
        content: JSON.stringify({
            displayName: config.displayName,
            minZapAmount: config.minZapAmount,
            lightningAddress: config.lightningAddress,
            createdAt: config.createdAt,
        }),
    };

    const signedEvent = finalizeEvent(event, privateKey);
    const pubs = pool.publish(DEFAULT_RELAYS, signedEvent);

    await Promise.race([
        Promise.all(pubs),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);
}

/**
 * Fetch board config from Nostr relays
 */
export async function fetchBoardConfig(
    boardId: string
): Promise<BoardConfig | null> {
    const pool = getPool();

    return new Promise((resolve) => {
        let sub: any;

        const timeout = setTimeout(() => {
            if (sub) sub.close();
            resolve(null);
        }, 5000);

        const filter: Filter = {
            kinds: [30078],
            '#d': [boardId],
        };

        sub = pool.subscribeMany(
            DEFAULT_RELAYS,
            filter,
            {
                onevent(event: Event) {
                    clearTimeout(timeout);
                    if (sub) sub.close();

                    try {
                        const content = JSON.parse(event.content);
                        const lnTag = event.tags.find(t => t[0] === 'ln');
                        const minZapTag = event.tags.find(t => t[0] === 'min_zap');

                        const config: BoardConfig = {
                            boardId,
                            displayName: content.displayName,
                            minZapAmount: parseInt(minZapTag?.[1] || '1000'),
                            lightningAddress: lnTag?.[1] || '',
                            creatorPubkey: event.pubkey,
                            createdAt: content.createdAt,
                        };
                        resolve(config);
                    } catch (err) {
                        console.error('Failed to parse board config !:', err);
                        resolve(null);
                    }
                },
                oneose() {
                    clearTimeout(timeout);
                    if (sub) sub.close();
                    resolve(null);
                }
            }
        );
    });
}

export function subscribeToZapMessages(
    boardId: string,
    recipientPubkey: string,
    onMessage: (message: ZapMessage) => void
): () => void {
    const pool = getPool();
    const seenIds = new Set<string>(); // Client-side deduplication

    const filter: Filter = {
        kinds: [9735],
        '#p': [recipientPubkey], // Zaps to the board creator
        // No 'since' - load all historical zaps
    };

    const sub = pool.subscribeMany(
        DEFAULT_RELAYS,
        filter,
        {
            onevent(event: Event) {
                const eventId = event.id;
                
                // Global deduplication - prevent processing same event across relays
                if (globalSeenZaps.has(eventId)) return;
                
                // Local deduplication for this subscription
                if (seenIds.has(eventId)) return;
                
                // Extract bolt11 invoice for duplicate detection
                const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');
                const bolt11 = bolt11Tag?.[1];
                
                // Check if we've seen this bolt11 before (same payment, different event)
                if (bolt11 && globalSeenBolt11.has(bolt11)) return;
                
                // Mark as seen immediately before any processing
                globalSeenZaps.set(eventId, Date.now());
                seenIds.add(eventId);
                if (bolt11) {
                    globalSeenBolt11.set(bolt11, Date.now());
                }

                try {
                    const zapInfo = parseZapReceipt(event);
                    if (!zapInfo) return;

                    // Filter for this board only
                    if (zapInfo.boardId !== boardId) return;

                    const message: ZapMessage = {
                        id: event.id,
                        boardId,
                        content: zapInfo.message,
                        zapAmount: zapInfo.amount,
                        sender: zapInfo.sender,
                        displayName: zapInfo.displayName,
                        timestamp: event.created_at * 1000,
                    };

                    onMessage(message);
                } catch (error) {
                    console.error('Failed to process zap receipt:', error);
                }
            },
        }
    );

    return () => {
        sub.close();
    };
}

/**
 * Monitor zap receipts in real-time for payment detection
 */
export function monitorZapReceipts(
    boardId: string,
    recipientPubkey: string,
    onNewZap: (message: ZapMessage) => void
): () => void {
    const pool = getPool();
    const seenIds = new Set<string>();

    const filter: Filter = {
        kinds: [9735],
        '#p': [recipientPubkey],
        since: Math.floor(Date.now() / 1000), // Only new zaps from now
    };

    const sub = pool.subscribeMany(
        DEFAULT_RELAYS,
        filter,
        {
            onevent(event: Event) {
                const eventId = event.id;
                
                // Global deduplication
                if (globalSeenZaps.has(eventId)) return;
                
                // Local deduplication
                if (seenIds.has(eventId)) return;
                
                // Extract bolt11 invoice for duplicate detection
                const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');
                const bolt11 = bolt11Tag?.[1];
                
                // Check if we've seen this bolt11 before (same payment, different event)
                if (bolt11 && globalSeenBolt11.has(bolt11)) return;
                
                // Mark as seen immediately before any processing
                globalSeenZaps.set(eventId, Date.now());
                seenIds.add(eventId);
                if (bolt11) {
                    globalSeenBolt11.set(bolt11, Date.now());
                }

                try {
                    const zapInfo = parseZapReceipt(event);
                    if (!zapInfo) return;

                    // Filter for this board only
                    if (zapInfo.boardId !== boardId) return;

                    const message: ZapMessage = {
                        id: event.id,
                        boardId,
                        content: zapInfo.message,
                        zapAmount: zapInfo.amount,
                        sender: zapInfo.sender,
                        displayName: zapInfo.displayName,
                        timestamp: event.created_at * 1000,
                    };

                    onNewZap(message);
                } catch (error) {
                    console.error('Failed to process zap payment:', error);
                }
            },
        }
    );

    console.log('Monitoring new zap receipts for:', recipientPubkey);
    return () => {
        console.log('Closing payment monitor, saw', seenIds.size, 'unique events');
        sub.close();
    };
}
import { NostrWebLNProvider } from '@getalby/sdk'
import type { NWCInfo } from '../types';

/**
 * Parse NWC connection string
 * Format: nostr+walletconnect://pubkey?relay=wss://...&secret=...
 */
export function parseNWCString(nwcString: string): NWCInfo | null {
    try {
        // Remove any whitespace
        const cleaned = nwcString.trim();

        // Check if it starts with correct protocol
        if (!cleaned.startsWith('nostr+walletconnect://')) {
            throw new Error('Invalid NWC string format');
        }

        // Parse as URL
        const url = new URL(cleaned);
        const pubkey = url.hostname || url.pathname.replace('//', '');
        const relay = url.searchParams.get('relay');
        const secret = url.searchParams.get('secret');

        if (!pubkey || !relay || !secret) {
            throw new Error('Missing required parameters');
        }

        return { pubkey, relay, secret };
    } catch (error) {
        console.error('Failed to parse NWC string:', error);
        return null;
    }
}

/**
 * Validate NWC connection by attempting to connect
 * Uses a timeout to avoid hanging on slow/unresponsive relays
 */
export async function validateNWC(nwcString: string, timeoutMs: number = 10000): Promise<{
    valid: boolean;
    info?: {
        alias: string;
        methods: string[];
    };
    error?: string;
}> {
    try {
        // Parse first
        const parsed = parseNWCString(nwcString);
        if (!parsed) {
            return {
                valid: false,
                error: 'Invalid NWC connection string format'
            };
        }

        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Connection timeout - relay may be slow or unavailable'));
            }, timeoutMs);
        });

        // Try to connect with timeout
        const connectPromise = (async () => {
            const nwc = new NostrWebLNProvider({
                nostrWalletConnectUrl: nwcString
            });

            await nwc.enable();

            // Try to get wallet info, but don't fail if it times out
            try {
                const info = await nwc.getInfo();

                // Check if wallet supports required methods
                const requiredMethods = ["getInfo", "makeInvoice"];
                const supportedMethods = info.methods || [];
                const hasRequired = requiredMethods.every(m =>
                    supportedMethods.includes(m)
                );

                if (!hasRequired) {
                    return {
                        valid: false,
                        error: 'Wallet does not support required methods'
                    };
                }

                return {
                    valid: true,
                    info: {
                        alias: info.alias || 'Unknown Wallet',
                        methods: supportedMethods
                    }
                };
            } catch (infoError) {
                // If getInfo fails but connection succeeded, still consider it valid
                console.warn('Could not get wallet info, but connection succeeded:', infoError);
                return {
                    valid: true,
                    info: {
                        alias: 'Unknown Wallet',
                        methods: []
                    }
                };
            }
        })();

        // Race between connection and timeout
        return await Promise.race([connectPromise, timeoutPromise]);

    } catch (error) {
        console.error('NWC validation error:', error);
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Connection failed'
        };
    }
}

/**
 * Create NWC instance (for dashboard when user provides string again)
 */
export async function createNWCInstance(nwcString: string) {
    const nwc = new NostrWebLNProvider({
        nostrWalletConnectUrl: nwcString
    });

    await nwc.enable();
    return nwc;
}
import { useState, useCallback } from 'react';
import { createNWCInstance } from '@/libs/nwc';
import type { NWCInfo } from '@/types';

interface UseNWCReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  nwcInfo: NWCInfo | null;
  connect: (nwcString: string) => Promise<void>;
  disconnect: () => void;
}

/**
 * Hook for managing NWC (Nostr Wallet Connect) connections
 */
export function useNWC(): UseNWCReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nwcInfo, setNwcInfo] = useState<NWCInfo | null>(null);

  const connect = useCallback(async (nwcString: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const nwc = await createNWCInstance(nwcString);
      const info = await nwc.getInfo();
      
      setNwcInfo({
        pubkey: info.pubkey || '',
        relay: nwcString.split('relay=')[1]?.split('&')[0] || '',
        secret: nwcString.split('secret=')[1]?.split('&')[0] || '',
      });
      
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect NWC';
      setError(errorMessage);
      setIsConnected(false);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setNwcInfo(null);
    setError(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    nwcInfo,
    connect,
    disconnect,
  };
}

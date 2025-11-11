import { validateLightningAddress } from '@/libs/lighting';
import { validateNWC } from '@/libs/nwc';
import { generateBoardId, generateEphemeralKeys, encryptNwc, decryptNwc } from '@/libs/crypto';
import { publishBoardConfig } from '@/libs/nostr';
import type { BoardConfig, StoredBoard } from '@/types';

export interface CreateBoardParams {
  displayName: string;
  minZapAmount: number;
  nwcString: string;
  password: string;
}

export interface CreateBoardResult {
  success: boolean;
  boardId?: string;
  boardConfig?: BoardConfig;
  storedBoard?: StoredBoard;
  error?: string;
}

/**
 * Service for creating a new board
 */
export class BoardCreationService {
  /**
   * Validate and create a new board
   */
  static async createBoard(params: CreateBoardParams): Promise<CreateBoardResult> {
    const { displayName, minZapAmount, nwcString, password } = params;

    try {
      // Step 1: Validate inputs
      if (!displayName.trim()) {
        return { success: false, error: 'Please enter a board name' };
      }

      if (!nwcString.trim()) {
        return { success: false, error: 'Please paste your NWC connection string' };
      }

      if (!password.trim()) {
        return { success: false, error: 'Please enter a password to encrypt your NWC string' };
      }

      // Step 2: Validate NWC connection (with 15 second timeout)
      console.log('Validating NWC connection...');
      const nwcValidation = await validateNWC(nwcString, 15000);
      if (!nwcValidation.valid) {
        const errorMsg = nwcValidation.error || 'Invalid NWC connection';
        console.error('NWC validation failed:', errorMsg);
        return { 
          success: false, 
          error: `${errorMsg}. Please check your connection string and try again.`
        };
      }
      console.log('NWC validation successful:', nwcValidation.info);

      // Step 3: Extract Lightning address from NWC
      const lightningAddress = this.extractLightningAddress(nwcString);
      
      if (!lightningAddress) {
        return { success: false, error: 'Could not extract Lightning address from NWC string' };
      }

      // Step 4: Validate Lightning address
      const validation = await validateLightningAddress(lightningAddress);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Invalid Lightning address' };
      }

      // Step 5: Generate cryptographic keys
      const { privateKey, publicKey } = generateEphemeralKeys();

      // Step 6: Generate unique board ID
      const boardId = generateBoardId();

      // Step 7: Create board configuration
      const boardConfig: BoardConfig = {
        boardId,
        displayName,
        minZapAmount,
        lightningAddress,
        creatorPubkey: publicKey,
        createdAt: Date.now(),
      };

      // Step 8: Publish board config to Nostr relays
      await publishBoardConfig(boardConfig, privateKey);

      // Step 9: Encrypt NWC string with password
      const encryptedNWC = encryptNwc(nwcString, password);

      // Step 10: Create stored board object
      const storedBoard: StoredBoard = {
        boardId,
        config: boardConfig,
        encryptedNwcString: encryptedNWC,
        createdAt: Date.now(),
      };

      return {
        success: true,
        boardId,
        boardConfig,
        storedBoard,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create board';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Extract Lightning address from NWC string
   */
  private static extractLightningAddress(nwcString: string): string | null {
    try {
      const url = new URL(nwcString.replace('nostr+walletconnect://', 'https://'));
      return url.searchParams.get('lud16') || '';
    } catch {
      return null;
    }
  }

  /**
   * Decrypt stored board with password
   */
  static decryptBoardNWC(encryptedNWC: string, password: string): string {
    return decryptNwc(encryptedNWC, password);
  }
}

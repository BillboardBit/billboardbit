import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { StoredBoard, BoardConfig } from '@/types';

/**
 * Hook for managing boards in localStorage
 */
export function useBoardManager() {
  const [boards, setBoards] = useLocalStorage<StoredBoard[]>('boards', []);

  const addBoard = useCallback(
    (board: StoredBoard) => {
      setBoards((prev) => [...prev, board]);
    },
    [setBoards]
  );

  const updateBoard = useCallback(
    (boardId: string, updates: Partial<StoredBoard>) => {
      setBoards((prev) =>
        prev.map((board) =>
          board.boardId === boardId ? { ...board, ...updates } : board
        )
      );
    },
    [setBoards]
  );

  const deleteBoard = useCallback(
    (boardId: string) => {
      setBoards((prev) => prev.filter((board) => board.boardId !== boardId));
    },
    [setBoards]
  );

  const getBoard = useCallback(
    (boardId: string): StoredBoard | undefined => {
      return boards.find((board) => board.boardId === boardId);
    },
    [boards]
  );

  const getBoardConfig = useCallback(
    (boardId: string): BoardConfig | undefined => {
      return boards.find((board) => board.boardId === boardId)?.config;
    },
    [boards]
  );

  return {
    boards,
    addBoard,
    updateBoard,
    deleteBoard,
    getBoard,
    getBoardConfig,
  };
}

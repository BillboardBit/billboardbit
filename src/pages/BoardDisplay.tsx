import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Trophy, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchBoardConfig, subscribeToZapMessages } from '@/libs/nostr';
import { getFullUrl } from '@/libs/url';
import type { BoardConfig, ZapMessage } from '@/types';

export default function BoardDisplay() {
  const { boardId } = useParams<{ boardId: string }>();
  const [boardConfig, setBoardConfig] = useState<BoardConfig | null>(null);
  const [messages, setMessages] = useState<ZapMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessageId, setNewMessageId] = useState<string | null>(null);
  
  // Use ref to track seen message IDs to prevent duplicates
  const seenMessageIds = useRef<Set<string>>(new Set());

  const paymentUrl = boardId ? getFullUrl(`/pay/${boardId}`) : '';

  // Load board configuration
  useEffect(() => {
    const loadBoard = async () => {
      if (!boardId) return;

      setLoading(true);
      try {
        const config = await fetchBoardConfig(boardId);
        if (config) {
          setBoardConfig(config);
        } else {
          const boards = JSON.parse(localStorage.getItem('boards') || '[]');
          const board = boards.find((b: any) => b.boardId === boardId);
          if (board) {
            setBoardConfig(board.config);
          } else {
            setError('Board not found');
          }
        }
      } catch (err) {
        console.error('Failed to load board:', err);
        setError('Failed to load board');
      } finally {
        setLoading(false);
      }
    };
    
    loadBoard();
  }, [boardId]);

  // Subscribe to zap messages
  useEffect(() => {
    if (!boardId || !boardConfig) return;

    const unsubscribe = subscribeToZapMessages(
      boardId,
      boardConfig.creatorPubkey,
      (message: ZapMessage) => {
        // Check ref first to prevent duplicate processing
        if (seenMessageIds.current.has(message.id)) return;
        
        // Mark as seen
        seenMessageIds.current.add(message.id);
        
        setMessages((prev) => {
          // Double-check in state as well
          const exists = prev.find((m) => m.id === message.id);
          if (exists) return prev;
          // Add new message at the beginning for instant display at top
          setNewMessageId(message.id);
          setTimeout(() => setNewMessageId(null), 3000);
          return [message, ...prev];
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [boardId, boardConfig?.creatorPubkey]);

  // Calculate total sats
  const totalSats = useMemo(() => {
    return messages.reduce((sum, msg) => sum + msg.zapAmount, 0);
  }, [messages]);

  // Sort messages by timestamp
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => b.timestamp - a.timestamp);
  }, [messages]);

  // Top 3 leaderboard
  const leaderboard = useMemo(() => {
    return [...messages]
      .sort((a, b) => b.zapAmount - a.zapAmount)
      .slice(0, 3);
  }, [messages]);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !boardConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Board not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6 md:px-8">
          <div className="flex flex-col items-start justify-between gap-3 md:gap-4 md:flex-row md:items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-1"
            >
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                {boardConfig.displayName}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Send {boardConfig.minZapAmount}+ sats to post a message
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-left md:text-right"
            >
              <div className="text-xs md:text-sm text-muted-foreground">Total Raised</div>
              <motion.div 
                className="flex items-center gap-2 text-xl md:text-2xl font-bold"
                key={totalSats}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Zap className="h-5 w-5 md:h-6 md:w-6 fill-yellow-500 text-yellow-500" />
                {totalSats.toLocaleString()} sats
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:px-8">
        {/* Mobile CTA Button - Show only on mobile */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 lg:hidden"
        >
          <Button
            onClick={() => window.open(paymentUrl, '_blank')}
            className="w-full gap-2 h-12 text-base"
            size="lg"
          >
            <Zap className="h-5 w-5" />
            Send a Message
          </Button>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Messages */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Live Messages
                  </CardTitle>
                  <motion.div
                    key={messages.length}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <Badge variant="secondary">{messages.length} messages</Badge>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-20rem)] md:h-[calc(100vh-24rem)]">
                  <div className="px-4 py-4 md:px-6">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                        <Zap className="mb-4 h-12 w-12 md:mb-6 md:h-16 md:w-16 text-muted-foreground" />
                        <p className="text-xl md:text-2xl font-semibold mb-2">No messages yet</p>
                        <p className="text-sm md:text-base text-muted-foreground px-4">
                          Be the first to send a zap!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        <AnimatePresence initial={false}>
                          {sortedMessages.map((message, index) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: -20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                              }}
                              layout
                            >
                              <Card className={`border-2 transition-all hover:border-primary/50 hover:shadow-md ${
                                message.id === newMessageId ? 'ring-2 ring-primary shadow-lg' : ''
                              }`}>
                                <CardContent className="p-4 md:p-6">
                                  <div className="flex items-start justify-between gap-3 md:gap-4">
                                    <div className="flex-1 space-y-2 md:space-y-3">
                                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                        <Badge variant="outline" className="font-mono text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1">
                                          <Zap className="mr-1 h-3 w-3 md:mr-1.5 md:h-4 md:w-4 fill-yellow-500 text-yellow-500" />
                                          {message.zapAmount.toLocaleString()} sats
                                        </Badge>
                                        <span className="text-xs md:text-sm text-muted-foreground">
                                          {formatTimeAgo(message.timestamp)}
                                        </span>
                                      </div>
                                      <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-sm md:text-base leading-relaxed font-medium wrap-break-word"
                                      >
                                        {message.content}
                                      </motion.p>
                                      {message.displayName && (
                                        <motion.p 
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.15 }}
                                          className="text-xs md:text-sm text-muted-foreground font-medium"
                                        >
                                          — {message.displayName}
                                        </motion.p>
                                      )}
                                    </div>
                                    {index < 3 && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", delay: 0.2 }}
                                      >
                                        <Trophy className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-yellow-500" />
                                      </motion.div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar - Hidden on mobile */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden space-y-6 lg:block"
          >
            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send a Message</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-white p-4">
                  <QRCodeSVG
                    value={paymentUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Scan to send a Lightning payment with your message
                </p>
                <Button
                  onClick={() => window.open(paymentUrl, '_blank')}
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Payment Page
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Supporters
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No messages yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((message, index) => (
                      <div key={message.id}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${
                              index === 0
                                ? 'bg-yellow-500 text-yellow-950'
                                : index === 1
                                  ? 'bg-gray-400 text-gray-950'
                                  : 'bg-orange-600 text-orange-50'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              {message.displayName || 'Anonymous'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {message.zapAmount.toLocaleString()} sats
                            </p>
                          </div>
                        </div>
                        {index < leaderboard.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Messages</span>
                  <span className="font-semibold">{messages.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Zap</span>
                  <span className="font-semibold">
                    {messages.length > 0
                      ? Math.round(totalSats / messages.length).toLocaleString()
                      : 0}{' '}
                    sats
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Highest Zap</span>
                  <span className="font-semibold">
                    {leaderboard[0]?.zapAmount.toLocaleString() || 0} sats
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

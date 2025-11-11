import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Container } from '@/components/Layout';
import { 
  Zap, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  AlertCircle,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { fetchBoardConfig, monitorZapReceipts } from '@/libs/nostr';
import { generateInvoice } from '@/libs/nip57';
import type { BoardConfig, ZapMessage } from '@/types';

export default function PaymentPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [boardConfig, setBoardConfig] = useState<BoardConfig | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  // Preset amount options
  const PRESET_AMOUNTS = [1000, 2100, 4200, 10000, 21000];

  const boardUrl = boardId ? `${window.location.origin}/board/${boardId}` : '';

  // Load board config
  useEffect(() => {
    const loadBoard = async () => {
      if (!boardId) return;

      setLoading(true);
      try {
        const config = await fetchBoardConfig(boardId);

        if (!config) {
          setError('Board not found');
          return;
        }

        setBoardConfig(config);
        setAmount(config.minZapAmount);
      } catch (err) {
        setError('Failed to load board');
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [boardId]);

  // Monitor for payment success after invoice is generated
  useEffect(() => {
    if (!invoice || !boardId || !boardConfig) return;

    console.log('Starting to monitor for payment...');

    const unsubscribe = monitorZapReceipts(
      boardId,
      boardConfig.creatorPubkey,
      (zapMessage: ZapMessage) => {
        if (zapMessage.content === message && zapMessage.zapAmount === amount) {
          console.log('Payment detected!', zapMessage);
          setPaymentSuccess(true);

          setTimeout(() => {
            navigate(`/board/${boardId}`);
          }, 3000);
        }
      }
    );

    return () => unsubscribe();
  }, [invoice, boardId, boardConfig, message, amount, navigate]);

  const getValidPresets = () => {
    if (!boardConfig) return [];
    return PRESET_AMOUNTS.filter((amt) => amt >= boardConfig.minZapAmount);
  };

  const handleSendZap = async () => {
    if (!boardConfig || !boardId) return;

    if (amount < boardConfig.minZapAmount) {
      setError(`Minimum amount is ${boardConfig.minZapAmount} sats`);
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      console.log('Creating zap request...');

      const invoiceData = await generateInvoice({
        lightningAddress: boardConfig.lightningAddress,
        amount,
        message,
        boardId,
        recipientPubkey: boardConfig.creatorPubkey,
        displayName: displayName.trim() || 'Anonymous',
      });

      if (!invoiceData || !invoiceData.invoice) {
        throw new Error('Failed to generate invoice');
      }

      setInvoice(invoiceData.invoice);
    } catch (err) {
      console.error('Zap error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create zap');
    } finally {
      setProcessing(false);
    }
  };

  const openInWallet = () => {
    if (!invoice) return;
    window.location.href = `lightning:${invoice}`;
  };

  const handleCopy = () => {
    if (invoice != null) {
      navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAmount = (amt: number) => {
    if (amt >= 1000000) return `${(amt / 1000000).toFixed(1)}M`;
    if (amt >= 1000) return `${(amt / 1000).toFixed(1)}K`;
    return amt.toString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !boardConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <Container className="py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Zap className="h-8 w-8 fill-yellow-500 text-yellow-500" />
                <h1 className="text-3xl font-bold">Send a Zap</h1>
              </div>
              <p className="text-muted-foreground">
                to <strong>{boardConfig?.displayName}</strong>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(boardUrl, '_blank')}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View Public Board
            </Button>
          </div>

          {!invoice ? (
            // Step 1: Input form
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
                <CardDescription>
                  Scan to send a Lightning payment with your message
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Your Name (optional)</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Anonymous"
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to post anonymously
                </p>
              </div>

              {/* Amount selection */}
              <div className="space-y-2">
                <Label>Amount (sats)</Label>

                {!showCustomAmount ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {getValidPresets().map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={amount === preset ? 'default' : 'outline'}
                          onClick={() => setAmount(preset)}
                          className="font-semibold"
                        >
                          {formatAmount(preset)}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowCustomAmount(true)}
                        className="col-span-3"
                      >
                        Custom Amount
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min={boardConfig?.minZapAmount}
                      placeholder="Enter custom amount"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomAmount(false)}
                      className="w-full"
                    >
                      Back to Presets
                    </Button>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Minimum: {boardConfig?.minZapAmount} sats
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question or leave a comment..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground">
                  {message.length}/500 characters
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleSendZap}
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Invoice...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Zap {amount.toLocaleString()} sats
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(`/board/${boardId}`)}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Board
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Step 2: Show invoice
          <Card>
            <CardHeader>
              {!paymentSuccess ? (
                <>
                  <CardTitle className="text-center text-2xl">Scan to Pay</CardTitle>
                  <CardDescription className="text-center">
                    <Badge variant="secondary" className="text-lg">
                      {amount.toLocaleString()} sats
                    </Badge>
                  </CardDescription>
                </>
              ) : (
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <CheckCircle2 className="h-20 w-20 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl text-green-600">
                    Payment Successful!
                  </CardTitle>
                  <CardDescription>
                    Your message has been sent ⚡
                  </CardDescription>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!paymentSuccess ? (
                <div className="space-y-4">
                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-lg bg-white p-4">
                      <QRCodeSVG
                        value={invoice}
                        size={280}
                        level="M"
                        includeMargin
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Invoice
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={openInWallet}
                      className="w-full"
                      size="lg"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Wallet
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => window.open(boardUrl, '_blank')}
                      className="w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Public Board
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setInvoice(null);
                        setMessage('');
                      }}
                      className="w-full"
                    >
                      Create Another Zap
                    </Button>
                  </div>

                  <Alert>
                    <AlertDescription className="text-center text-sm">
                      Waiting for payment...
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-muted-foreground">
                    Redirecting to board...
                  </p>
                  <Button
                    onClick={() => navigate(`/board/${boardId}`)}
                    className="w-full"
                  >
                    Go to Board Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </Container>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { Container, PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getFullUrl } from '@/libs/url';
import { 
  ArrowLeft, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Wallet, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { useBoardManager, useNWC, useCopyToClipboard } from '@/hooks';
import type { BoardConfig } from '@/types';

export default function Dashboard() {
  const { boardId } = useParams<{ boardId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { getBoardConfig } = useBoardManager();
  const { isConnected, isConnecting, error: nwcError, connect } = useNWC();
  const { copyToClipboard } = useCopyToClipboard();

  const [boardConfig, setBoardConfig] = useState<BoardConfig | null>(null);
  const [nwcString, setNwcString] = useState('');
  const [showNwcInput, setShowNwcInput] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string>('');

  // URLs for sharing
  const boardUrl = boardId ? getFullUrl(`/board/${boardId}`) : '';
  const dashboardUrl = window.location.href;

  useEffect(() => {
    if (!boardId) {
      navigate('/create');
      return;
    }

    const config = getBoardConfig(boardId);
    if (!config) {
      navigate('/create');
      return;
    }

    setBoardConfig(config);

    // If NWC string was passed from creation, use it
    const stateNwc = (location.state as any)?.nwcString;
    if (stateNwc) {
      setNwcString(stateNwc);
      setShowNwcInput(false);
      handleConnect(stateNwc);
    }
  }, [boardId, location.state, getBoardConfig, navigate]);

  const handleConnect = async (nwcStr?: string) => {
    const connectionString = nwcStr || nwcString;
    
    if (!connectionString.trim()) {
      return;
    }

    try {
      await connect(connectionString);
      setShowNwcInput(false);
    } catch (error) {
      console.error('Failed to connect NWC:', error);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboard(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  if (!boardConfig) {
    return (
      <Container className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Container>
    );
  }

  return (
    <Container className="max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/create')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Boards
      </Button>

      <PageHeader
        title={boardConfig.displayName}
        description={`Created on ${new Date(boardConfig.createdAt).toLocaleDateString()}`}
        className="mb-8"
      />

      {/* Wallet Connection Card */}
      {showNwcInput && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <CardTitle>Connect Your Wallet</CardTitle>
            </div>
            <CardDescription>
              Enter your NWC connection string to start receiving Lightning payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nwc">NWC Connection String</Label>
              <Input
                id="nwc"
                type="password"
                placeholder="nostr+walletconnect://..."
                value={nwcString}
                onChange={(e) => setNwcString(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {nwcError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{nwcError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => handleConnect()}
              disabled={isConnecting || !nwcString.trim()}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      {isConnected && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            Wallet connected successfully! Your board is now live and ready to receive payments.
          </AlertDescription>
        </Alert>
      )}

      {/* Board Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Board Settings</CardTitle>
          <CardDescription>Your board configuration and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Minimum Zap Amount</Label>
              <p className="text-lg font-semibold">{boardConfig.minZapAmount} sats</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Lightning Address</Label>
              <p className="truncate text-sm font-mono">{boardConfig.lightningAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sharing Links */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Public Display Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Public Display Link</CardTitle>
            <CardDescription>
              Share this on your screen or projector for the audience to see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="boardUrl">Display URL</Label>
              <div className="flex gap-2">
                <Input
                  id="boardUrl"
                  value={boardUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopy(boardUrl, 'board')}
                >
                  {copiedItem === 'board' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              variant="default"
              onClick={() => window.open(boardUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Display
            </Button>
          </CardContent>
        </Card>

        {/* Dashboard Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dashboard Link</CardTitle>
            <CardDescription>
              Keep this private for managing your board
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dashboardUrl">Dashboard URL</Label>
              <div className="flex gap-2">
                <Input
                  id="dashboardUrl"
                  value={dashboardUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopy(dashboardUrl, 'dashboard')}
                >
                  {copiedItem === 'dashboard' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Save this URL to access your dashboard later
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Your Board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">1</Badge>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Share the Display Link:</strong> Open the public display link on your projector or screen
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">2</Badge>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Let People Zap:</strong> Viewers can send Lightning payments with messages to your board
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-0.5">3</Badge>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Watch Messages Appear:</strong> Messages will appear in real-time on the display as payments arrive
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

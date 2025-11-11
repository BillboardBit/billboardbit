import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Container, PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useBoardManager } from '@/hooks';
import { BoardCreationService } from '@/services';
import type { StoredBoard } from '@/types';

// Form validation schema
const boardSchema = z.object({
  displayName: z.string().min(3, 'Board name must be at least 3 characters').max(50, 'Board name must be less than 50 characters'),
  minZapAmount: z.number().min(1, 'Minimum zap amount must be at least 1 sat').max(1000000, 'Maximum is 1,000,000 sats'),
  nwcString: z.string().min(10, 'Please enter a valid NWC connection string').startsWith('nostr+walletconnect://', 'Must be a valid NWC string'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type BoardFormData = z.infer<typeof boardSchema>;

export default function CreateBoard() {
  const navigate = useNavigate();
  const { boards, addBoard, deleteBoard } = useBoardManager();
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<StoredBoard | null>(null);
  const [boardPassword, setBoardPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      displayName: '',
      minZapAmount: 1000,
      nwcString: '',
      password: '',
    },
  });

  const onSubmit = async (data: BoardFormData) => {
    setIsCreating(true);
    setError('');

    try {
      const result = await BoardCreationService.createBoard(data);

      if (!result.success || !result.storedBoard || !result.boardId) {
        throw new Error(result.error || 'Failed to create board');
      }

      // Save to localStorage
      addBoard(result.storedBoard);

      // Navigate to dashboard with NWC string in state
      navigate(`/dashboard/${result.boardId}`, {
        state: { nwcString: data.nwcString },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUsePreviousBoard = () => {
    if (!selectedBoard) {
      setPasswordError('Please select a board');
      return;
    }

    if (!boardPassword) {
      setPasswordError('Please enter password');
      return;
    }

    try {
      const decryptedNWC = BoardCreationService.decryptBoardNWC(
        selectedBoard.encryptedNwcString,
        boardPassword
      );

      navigate(`/dashboard/${selectedBoard.boardId}`, {
        state: { nwcString: decryptedNWC },
      });
    } catch {
      setPasswordError('Incorrect password or failed to decrypt');
    }
  };

  const handleDeleteBoard = (boardId: string, boardName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${boardName}"? This action cannot be undone.`
    );

    if (confirmed) {
      deleteBoard(boardId);
      if (selectedBoard?.boardId === boardId) {
        setSelectedBoard(null);
        setBoardPassword('');
      }
    }
  };

  return (
    <Container className="max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <PageHeader
        title="Create Your Board"
        description="Set up a new Lightning-powered message board in minutes"
        className="mb-8"
      />

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">New Board</TabsTrigger>
          <TabsTrigger value="existing" disabled={boards.length === 0}>
            Existing Boards ({boards.length})
          </TabsTrigger>
        </TabsList>

        {/* Create New Board */}
        <TabsContent value="new" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Board Configuration</CardTitle>
              <CardDescription>
                Configure your board settings and connect your wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Board Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Board Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="Bitcoin Conference Q&A"
                    {...register('displayName')}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-destructive">{errors.displayName.message}</p>
                  )}
                </div>

                {/* Min Zap Amount */}
                <div className="space-y-2">
                  <Label htmlFor="minZapAmount">Minimum Zap Amount (sats) *</Label>
                  <Input
                    id="minZapAmount"
                    type="number"
                    placeholder="1000"
                    {...register('minZapAmount', { valueAsNumber: true })}
                  />
                  {errors.minZapAmount && (
                    <p className="text-sm text-destructive">{errors.minZapAmount.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Minimum amount in satoshis required to post a message
                  </p>
                </div>

                <Separator />

                {/* NWC String */}
                <div className="space-y-2">
                  <Label htmlFor="nwcString">NWC Connection String *</Label>
                  <Textarea
                    id="nwcString"
                    placeholder="nostr+walletconnect://..."
                    rows={4}
                    className="font-mono text-sm"
                    {...register('nwcString')}
                  />
                  {errors.nwcString && (
                    <p className="text-sm text-destructive">{errors.nwcString.message}</p>
                  )}

                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Encryption Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a secure password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Your NWC string will be encrypted with this password
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Board...
                    </>
                  ) : (
                    'Create Board'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Use Existing Board */}
        <TabsContent value="existing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Boards</CardTitle>
              <CardDescription>
                Select a previously created board to manage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {boards.map((board) => (
                <Card
                  key={board.boardId}
                  className={`cursor-pointer transition-all ${
                    selectedBoard?.boardId === board.boardId
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setSelectedBoard(board);
                    setBoardPassword('');
                    setPasswordError('');
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{board.config.displayName}</CardTitle>
                        <CardDescription className="text-sm">
                          Created {new Date(board.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBoard(board.boardId, board.config.displayName);
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground">
                      Min. {board.config.minZapAmount} sats • {board.config.lightningAddress}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {selectedBoard && (
                <div className="space-y-4 pt-4">
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="boardPassword">Board Password</Label>
                    <Input
                      id="boardPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={boardPassword}
                      onChange={(e) => {
                        setBoardPassword(e.target.value);
                        setPasswordError('');
                      }}
                    />
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleUsePreviousBoard}
                    className="w-full"
                    size="lg"
                  >
                    Open Board Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Container>
  );
}

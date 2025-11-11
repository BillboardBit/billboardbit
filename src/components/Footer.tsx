import { Separator } from '@/components/ui/separator';
import { Heart, Zap } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-8 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/logo.svg"
                alt="BillboardBit"
                className="h-6 w-6 object-contain"
              />
              <span className="text-lg font-bold">BillboardBit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Create interactive message boards powered by Bitcoin Lightning payments
            </p>
          </div>

          {/* Tech Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Powered By</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
                <Zap className="h-3 w-3" />
                Lightning Network
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
                Nostr Protocol
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
                NWC
              </span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>
            © {currentYear} BillboardBit. Open source software.
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> for the Bitcoin community
          </p>
        </div>
      </div>
    </footer>
  );
}

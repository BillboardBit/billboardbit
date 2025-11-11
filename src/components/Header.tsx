import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo and Brand */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/billboardbit/logo.svg"
            alt="BillboardBit logo"
            className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-110"
          />
          <span className="text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
            BillboardBit
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/create')}
            className="hidden md:inline-flex"
          >
            Create Board
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a
              href="https://github.com/BillboardBit/billboardbit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}

import { Moon, Sun, TrendingUp, UserCircle2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { isSupabaseConfigured } from '@/lib/supabase';

interface HeaderProps {
  onAccountClick: () => void;
  isLoggedIn: boolean;
}

export function Header({ onAccountClick, isLoggedIn }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
            <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-white sm:text-lg">
              Cabine de Change
            </h1>
            <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse-slow" />
              Taux en temps réel · Kinshasa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSupabaseConfigured && (
            <button
              onClick={onAccountClick}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <UserCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">{isLoggedIn ? 'Mon espace' : 'Se connecter'}</span>
            </button>
          )}
          <button
            onClick={toggle}
            aria-label="Changer de thème"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

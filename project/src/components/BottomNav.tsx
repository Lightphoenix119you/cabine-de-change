import { Home, MapPin, Building2, Megaphone } from 'lucide-react';

export type Tab = 'accueil' | 'bureaux' | 'carte' | 'signaler';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: 'accueil', label: 'Accueil', icon: Home },
  { key: 'bureaux', label: 'Bureaux', icon: Building2 },
  { key: 'carte', label: 'Carte', icon: MapPin },
  { key: 'signaler', label: 'Signaler', icon: Megaphone },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-stretch justify-around px-2">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="group relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

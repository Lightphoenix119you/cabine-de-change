import { Home, Store, Map, Settings } from 'lucide-react';

export type Screen = 'home' | 'market' | 'map';

interface Props {
  screen: Screen;
  onScreenChange: (screen: Screen) => void;
  onOpenAdmin: () => void;
  hasUnread: boolean;
}

const TABS: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'market', label: 'Marché', icon: Store },
  { id: 'map', label: 'Carte', icon: Map },
];

export function BottomNav({ screen, onScreenChange, onOpenAdmin, hasUnread }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] dark:border-stone-800 dark:bg-stone-900/90">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = screen === id;
          return (
            <button
              key={id}
              onClick={() => onScreenChange(id)}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors active:scale-95"
            >
              <Icon
                size={20}
                className={active ? 'text-amber-500' : 'text-stone-400 dark:text-stone-500'}
                fill={active ? 'currentColor' : 'none'}
                fillOpacity={active ? 0.15 : 0}
              />
              <span
                className={`text-[10px] font-semibold ${
                  active ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenAdmin}
          className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors active:scale-95"
        >
          <Settings size={20} className="text-stone-400 dark:text-stone-500" />
          <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
            Gérer
          </span>
          {hasUnread && (
            <span className="absolute right-5 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-stone-900" />
          )}
        </button>
      </div>
    </nav>
  );
}

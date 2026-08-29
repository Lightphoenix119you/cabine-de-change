import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon: ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'accent';
}

const ACCENTS = {
  primary: 'from-primary-500/10 to-primary-600/5 text-primary-600 dark:text-primary-400',
  success: 'from-success-500/10 to-success-600/5 text-success-600 dark:text-success-400',
  warning: 'from-warning-500/10 to-warning-600/5 text-warning-600 dark:text-warning-400',
  accent: 'from-accent-500/10 to-accent-600/5 text-accent-600 dark:text-accent-400',
};

export function StatCard({ label, value, sublabel, icon, accent = 'primary' }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/60">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${ACCENTS[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-lg font-bold leading-tight text-slate-900 dark:text-white">{value}</p>
        {sublabel && (
          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

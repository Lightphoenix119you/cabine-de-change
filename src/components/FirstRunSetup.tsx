import { OperatorAuthGate } from './OperatorAuthGate';
import { CabinSetupForm } from './CabinSetupForm';
import type { Session } from '@supabase/supabase-js';

interface Props {
  session: Session | null;
  checkedAuth: boolean;
  onSessionChange: (session: Session) => void;
  onCreated: () => void;
}

export function FirstRunSetup({ session, checkedAuth, onSessionChange, onCreated }: Props) {
  if (!checkedAuth) return null;

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-6 shadow-sm">
          <OperatorAuthGate
            onAuthenticated={onSessionChange}
            title="Créez votre compte opérateur"
            subtitle="Ce compte gérera cette cabine — taux, vendeurs et messages."
          />
        </div>
      </div>
    );
  }

  return <CabinSetupForm operatorId={session.user.id} onCreated={onCreated} />;
}

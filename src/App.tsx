import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

interface ExchangeOffice {
  id: string;
  name: string;
  location: string;
  buy_rate: number;
  sell_rate: number;
  is_active: boolean;
  opening_hours?: string;
}

export default function App() {
  const [offices, setOffices] = useState<ExchangeOffice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffices() {
      const { data, error } = await supabase.from('exchange_offices').select('*');
      if (error) console.error('Erreur Supabase:', error);
      else setOffices(data || []);
      setLoading(false);
    }
    fetchOffices();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <header className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">Cabine de Change</h1>
        <p className="text-slate-400">Taux de change en temps réel</p>
      </header>

      <main className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-center text-slate-400">Chargement des données...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {offices.map((office) => (
              <div key={office.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-white">{office.name}</h2>
                  <span className={`px-2 py-1 text-xs rounded-full ${office.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {office.is_active ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">📍 {office.location}</p>
                <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-lg text-center">
                  <div>
                    <span className="block text-xs text-slate-400">Achat</span>
                    <span className="text-lg font-bold text-emerald-400">{office.buy_rate} FC</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">Vente</span>
                    <span className="text-lg font-bold text-rose-400">{office.sell_rate} FC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

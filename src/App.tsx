import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function App() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: cabins, error: err } = await supabase.from('cabins').select('*');
        if (err) {
          setError(`Supabase Error: ${err.message} (Code: ${err.code})`);
        } else {
          setData(cabins);
        }
      } catch (e: any) {
        setError(`Catch Error: ${e?.message || String(e)}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Chargement...</div>;

  if (error) {
    return (
      <div style={{ color: 'red', padding: 20, backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
        <h2>Erreur de connexion :</h2>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</pre>
        <button onClick={() => window.location.reload()} style={{ marginTop: 10, padding: 8 }}>Réessayer</button>
      </div>
    );
  }

  return (
    <div style={{ color: 'white', padding: 20 }}>
      <h1>Cabine de Change</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

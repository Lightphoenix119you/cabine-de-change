import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Cabin, Vendor, VendorProduct } from '@/types';
import type { Session } from '@supabase/supabase-js';
import { CabinHeader } from '@/components/CabinHeader';
import { RateBanner } from '@/components/RateBanner';
import { Converter } from '@/components/Converter';
import { VendorsSection } from '@/components/VendorsSection';
import { AdminModal } from '@/components/AdminModal';
import { FirstRunSetup } from '@/components/FirstRunSetup';
import { VendorProfileModal } from '@/components/VendorProfileModal';
import { ClientChatModal } from '@/components/ClientChatModal';
import { BottomNav, type Screen } from '@/components/BottomNav';
import { useGeolocation } from '@/hooks/useGeolocation';
import { distanceInMeters } from '@/lib/geo';

const MapView = lazy(() => import('@/components/MapView').then((m) => ({ default: m.MapView })));

export default function App() {
  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [cabinChatOpen, setCabinChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const { coords: userCoords, loading: geoLoading } = useGeolocation();

  const loadCabin = useCallback(async () => {
    const { data, error } = await supabase
      .from('cabins')
      .select('*')
      .order('created_at')
      .limit(1)
      .maybeSingle();
    if (error) {
      setError('Impossible de charger les données de la cabine.');
      return null;
    }
    return data as Cabin | null;
  }, []);

  const loadVendors = useCallback(async (cabinId: string) => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('cabin_id', cabinId)
      .order('created_at');
    if (error) return [];
    return (data ?? []) as Vendor[];
  }, []);

  const loadVendorProducts = useCallback(async (vendorIds: string[]) => {
    if (vendorIds.length === 0) return [];
    const { data, error } = await supabase
      .from('vendor_products')
      .select('*')
      .in('vendor_id', vendorIds)
      .order('created_at');
    if (error) return [];
    return (data ?? []) as VendorProduct[];
  }, []);

  const checkUnread = useCallback(async (cabinId: string, operatorId: string | null, uid: string | undefined) => {
    if (!uid || !operatorId || uid !== operatorId) {
      setHasUnread(false);
      return;
    }
    const { data } = await supabase
      .from('conversations')
      .select('last_message_at, operator_last_read_at')
      .eq('cabin_id', cabinId);
    const unread = (data ?? []).some(
      (c) =>
        c.last_message_at &&
        (!c.operator_last_read_at || new Date(c.last_message_at) > new Date(c.operator_last_read_at))
    );
    setHasUnread(unread);
  }, []);

  const refreshAll = useCallback(async () => {
    const c = await loadCabin();
    if (c) {
      setCabin(c);
      const v = await loadVendors(c.id);
      setVendors(v);
      setVendorProducts(await loadVendorProducts(v.map((x) => x.id)));
      const { data } = await supabase.auth.getSession();
      checkUnread(c.id, c.operator_id, data.session?.user.id);
    }
  }, [loadCabin, loadVendors, loadVendorProducts, checkUnread]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const c = await loadCabin();
      if (c) {
        setCabin(c);
        const v = await loadVendors(c.id);
        setVendors(v);
        setVendorProducts(await loadVendorProducts(v.map((x) => x.id)));
        const { data } = await supabase.auth.getSession();
        checkUnread(c.id, c.operator_id, data.session?.user.id);
      }
      setLoading(false);
    })();
  }, [loadCabin, loadVendors, loadVendorProducts, checkUnread]);

  useEffect(() => {
    if (!cabin) return;
    const channel = supabase
      .channel(`conversations-badge-${cabin.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `cabin_id=eq.${cabin.id}` },
        () => checkUnread(cabin.id, cabin.operator_id, session?.user.id)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabin?.id, session?.user.id]);

  // Central auth listener: tracks the operator's session app-wide, and
  // catches sign-ins completed via redirect (email confirmation link,
  // OAuth callback) so the operator lands straight in their dashboard
  // instead of the public storefront with no sign anything happened.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.user.is_anonymous ? null : data.session);
      setCheckedAuth(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      const nonAnonSession = s?.user.is_anonymous ? null : s;
      setSession(nonAnonSession);
      if (event === 'SIGNED_IN' && nonAnonSession && cabin && nonAnonSession.user.id === cabin.operator_id) {
        setAdminOpen(true);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabin?.operator_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 transition-colors">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6 transition-colors">
        <div className="text-center space-y-2">
          <p className="text-stone-700 dark:text-stone-200 font-semibold">{error}</p>
          <button
            onClick={refreshAll}
            className="text-sm text-amber-600 dark:text-amber-400 font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!cabin) {
    return (
      <FirstRunSetup
        session={session}
        checkedAuth={checkedAuth}
        onSessionChange={setSession}
        onCreated={refreshAll}
      />
    );
  }

  const availableCount = vendors.filter((v) => v.status === 'available').length;
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId) ?? null;

  const cabinDistance =
    userCoords && cabin.latitude != null && cabin.longitude != null
      ? distanceInMeters(userCoords, { latitude: cabin.latitude, longitude: cabin.longitude })
      : null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="mx-auto max-w-md px-4 py-5 pb-24 space-y-5">
        <CabinHeader
          cabin={cabin}
          onMessageClick={() => setCabinChatOpen(true)}
          geoLoading={geoLoading}
          distanceMeters={cabinDistance}
        />

        {screen === 'home' && (
          <div key="home" className="space-y-5 tab-fade">
            <RateBanner cabin={cabin} />
            <Converter cabin={cabin} />
          </div>
        )}

        {screen === 'market' && (
          <div key="market" className="tab-fade">
            <VendorsSection
              vendors={vendors}
              availableCount={availableCount}
              onSelectVendor={(v) => setSelectedVendorId(v.id)}
              userCoords={userCoords}
              geoLoading={geoLoading}
            />
          </div>
        )}

        {screen === 'map' && (
          <div key="map" className="tab-fade">
            <Suspense
              fallback={
                <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <Loader2 className="animate-spin text-amber-500" size={28} />
                </div>
              }
            >
              <MapView
                cabin={cabin}
                vendors={vendors}
                userCoords={userCoords}
                onSelectVendor={(v) => setSelectedVendorId(v.id)}
              />
            </Suspense>
          </div>
        )}

        <footer className="pt-2 pb-2 text-center">
          <p className="text-[11px] text-stone-400 dark:text-stone-600">
            Les taux sont indicatifs et peuvent changer à tout moment.
          </p>
        </footer>
      </div>

      <BottomNav
        screen={screen}
        onScreenChange={setScreen}
        onOpenAdmin={() => setAdminOpen(true)}
        hasUnread={hasUnread}
      />

      <AdminModal
        open={adminOpen}
        cabin={cabin}
        vendors={vendors}
        vendorProducts={vendorProducts}
        session={session}
        checkedAuth={checkedAuth}
        onSessionChange={setSession}
        onClose={() => setAdminOpen(false)}
        onRatesUpdated={refreshAll}
        onVendorsChanged={refreshAll}
        onMessagesChanged={refreshAll}
      />

      {selectedVendor && (
        <VendorProfileModal
          vendor={selectedVendor}
          vendors={vendors}
          products={vendorProducts.filter((p) => p.vendor_id === selectedVendor.id)}
          cabin={cabin}
          userCoords={userCoords}
          onClose={() => setSelectedVendorId(null)}
          onSelectVendor={(v) => setSelectedVendorId(v.id)}
        />
      )}

      {cabinChatOpen && (
        <ClientChatModal cabin={cabin} onClose={() => setCabinChatOpen(false)} />
      )}
    </div>
  );
}

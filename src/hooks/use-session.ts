import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { setStoreUser } from "@/lib/store";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe first, then read current session — prevents race conditions.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setStoreUser(s?.user?.id ?? null);
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setStoreUser(data.session?.user?.id ?? null);
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

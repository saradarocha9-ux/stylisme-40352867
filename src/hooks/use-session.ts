import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { setStoreUser } from "@/lib/store";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let timeout: number | undefined;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
        timeout = undefined;
      }
      setStoreUser(nextSession?.user?.id ?? null);
      setSession(nextSession);
      setLoading(false);
    };

    // Subscribe first, then read current session — prevents race conditions.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      applySession(s);
    });
    supabase.auth.getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => applySession(null));

    timeout = window.setTimeout(() => applySession(null), 5000);

    return () => {
      active = false;
      if (timeout !== undefined) window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

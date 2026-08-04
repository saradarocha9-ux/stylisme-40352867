import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { setStoreUser } from "@/lib/store";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      setStoreUser(nextSession?.user?.id ?? null);
      setSession(nextSession);
      setLoading(false);
    };

    // Restore the persisted session before deciding whether the user is signed out.
    // INITIAL_SESSION can briefly be null while storage is still being restored,
    // so only an explicit SIGNED_OUT event is allowed to clear an active session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") {
        applySession(null);
        return;
      }
      if (nextSession) applySession(nextSession);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        applySession(null);
        return;
      }
      applySession(data.session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

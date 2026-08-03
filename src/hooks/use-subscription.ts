import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkSubscription, type SubscriptionStatus } from "@/lib/stripe.functions";
import { useSession } from "./use-session";

const EMPTY: SubscriptionStatus = {
  subscribed: false,
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
  productId: null,
};

export function useSubscription() {
  const { session } = useSession();
  const fn = useServerFn(checkSubscription);
  const query = useQuery({
    queryKey: ["subscription", session?.user.id ?? "anon"],
    queryFn: () => fn(),
    enabled: !!session,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  // Conta oficial do Stylisme é premium permanente.
  const official = isOfficialUser(session?.user.id, session?.user.email);
  return {
    status: official ? { ...(query.data ?? EMPTY), subscribed: true } : query.data ?? EMPTY,
    isPremium: official || !!query.data?.subscribed,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useRefreshSubscription() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["subscription"] });
}

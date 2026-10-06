DROP POLICY "Signed users read follows" ON public.follows;
CREATE POLICY "Users read own follow relations" ON public.follows FOR SELECT TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE OR REPLACE FUNCTION public.get_follow_counts(_user_id uuid)
RETURNS TABLE(followers integer, following integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*)::int FROM public.follows WHERE following_id = _user_id),
         (SELECT count(*)::int FROM public.follows WHERE follower_id = _user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.get_follow_counts(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_follow_counts(uuid) TO authenticated;
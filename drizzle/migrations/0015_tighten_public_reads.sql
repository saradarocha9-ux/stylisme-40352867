DROP POLICY "Anyone signed in reads look posts" ON public.look_posts;
CREATE POLICY "Signed users read visible look posts" ON public.look_posts FOR SELECT TO authenticated
USING (suspended_at IS NULL OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

DROP POLICY "Read own or published look images" ON storage.objects;
CREATE POLICY "Read own or published look images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'looks' AND ((storage.foldername(name))[1] = auth.uid()::text
  OR EXISTS (SELECT 1 FROM public.look_posts p WHERE p.image_path = objects.name AND p.suspended_at IS NULL)
  OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')));

DROP POLICY "Public reads published store assets" ON storage.objects;
CREATE POLICY "Public reads published store assets" ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'store-assets' AND (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.status='verified' AND (s.logo_path = objects.name OR s.banner_path = objects.name))
  OR EXISTS (SELECT 1 FROM public.store_products p JOIN public.stores s ON s.id=p.store_id WHERE p.image_path = objects.name AND p.published AND s.status='verified')));

DROP POLICY "Signed users read public or own store assets" ON storage.objects;
CREATE POLICY "Signed users read public or own store assets" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'store-assets' AND (
  public.is_store_member(((storage.foldername(name))[1])::uuid)
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.status='verified' AND (s.logo_path = objects.name OR s.banner_path = objects.name))
  OR EXISTS (SELECT 1 FROM public.store_products p JOIN public.stores s ON s.id=p.store_id WHERE p.image_path = objects.name AND p.published AND s.status='verified')
  OR EXISTS (SELECT 1 FROM public.store_campaigns c WHERE c.image_path = objects.name AND c.status IN ('approved','active'))));
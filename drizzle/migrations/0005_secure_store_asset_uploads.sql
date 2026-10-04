CREATE POLICY "Store members read own assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'store-assets' AND public.is_store_member(((storage.foldername(storage.objects.name))[1])::uuid));
CREATE POLICY "Public reads published store assets"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'store-assets' AND (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id::text = (storage.foldername(storage.objects.name))[1] AND s.status = 'verified')
  OR EXISTS (SELECT 1 FROM public.store_products p JOIN public.stores s ON s.id=p.store_id WHERE p.image_path=storage.objects.name AND p.published AND s.status='verified')
));
CREATE POLICY "Signed users read public or own store assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'store-assets' AND (
  public.is_store_member(((storage.foldername(storage.objects.name))[1])::uuid)
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id::text = (storage.foldername(storage.objects.name))[1] AND s.status = 'verified')
));
CREATE POLICY "Store members upload assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'store-assets' AND public.is_store_member(((storage.foldername(storage.objects.name))[1])::uuid));
CREATE POLICY "Store members update assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'store-assets' AND public.is_store_member(((storage.foldername(storage.objects.name))[1])::uuid))
WITH CHECK (bucket_id = 'store-assets' AND public.is_store_member(((storage.foldername(storage.objects.name))[1])::uuid));
CREATE POLICY "Store members delete assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'store-assets' AND public.is_store_member(((storage.foldername(storage.objects.name))[1])::uuid));
CREATE POLICY "payments_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payments' AND (
    (storage.foldername(name))[1] = 'qris'
    OR (storage.foldername(name))[2] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "payments_user_upload_deposit_proof" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payments'
  AND (storage.foldername(name))[1] = 'deposit'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "payments_admin_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payments_admin_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payments' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'payments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payments_admin_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payments' AND public.has_role(auth.uid(), 'admin'));
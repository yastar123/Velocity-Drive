CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  qris_path text,
  qris_owner_name text,
  bank_instruction text,
  deposit_enabled boolean NOT NULL DEFAULT true,
  withdraw_enabled boolean NOT NULL DEFAULT true,
  deposit_start time NOT NULL DEFAULT '08:00',
  deposit_end time NOT NULL DEFAULT '21:00',
  withdraw_start time NOT NULL DEFAULT '08:00',
  withdraw_end time NOT NULL DEFAULT '17:00',
  min_deposit bigint NOT NULL DEFAULT 75000,
  min_withdraw bigint NOT NULL DEFAULT 50000,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO authenticated, anon;
GRANT INSERT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_all" ON public.payment_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_insert" ON public.payment_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "settings_admin_update" ON public.payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER payment_settings_set_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.payment_settings (id) VALUES (true);

CREATE TABLE public.deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  method text NOT NULL,
  sender_name text,
  proof_path text,
  status public.request_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX deposit_requests_user_idx ON public.deposit_requests (user_id, created_at DESC);
CREATE INDEX deposit_requests_status_idx ON public.deposit_requests (status, created_at DESC);
GRANT SELECT, INSERT ON public.deposit_requests TO authenticated;
GRANT UPDATE ON public.deposit_requests TO authenticated;
GRANT ALL ON public.deposit_requests TO service_role;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deposit_select_own" ON public.deposit_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "deposit_select_admin" ON public.deposit_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deposit_insert_own" ON public.deposit_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL);
CREATE POLICY "deposit_update_admin" ON public.deposit_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.withdraw_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  method text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  proof_path text,
  status public.request_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX withdraw_requests_user_idx ON public.withdraw_requests (user_id, created_at DESC);
CREATE INDEX withdraw_requests_status_idx ON public.withdraw_requests (status, created_at DESC);
GRANT SELECT, INSERT ON public.withdraw_requests TO authenticated;
GRANT UPDATE ON public.withdraw_requests TO authenticated;
GRANT ALL ON public.withdraw_requests TO service_role;
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdraw_select_own" ON public.withdraw_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "withdraw_select_admin" ON public.withdraw_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "withdraw_insert_own" ON public.withdraw_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL AND proof_path IS NULL);
CREATE POLICY "withdraw_update_admin" ON public.withdraw_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.review_deposit(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.deposit_requests;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Hanya admin yang dapat memproses permintaan'; END IF;
  SELECT * INTO r FROM public.deposit_requests WHERE id = _id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Permintaan tidak ditemukan atau sudah diproses'; END IF;
  UPDATE public.deposit_requests
     SET status = CASE WHEN _approve THEN 'approved'::public.request_status ELSE 'rejected'::public.request_status END,
         admin_note = _note, reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _id;
  IF _approve THEN
    UPDATE public.profiles SET balance = balance + r.amount WHERE id = r.user_id;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_deposit(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_deposit(uuid, boolean, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.review_withdraw(_id uuid, _approve boolean, _note text DEFAULT NULL, _proof_path text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.withdraw_requests; current_balance bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Hanya admin yang dapat memproses permintaan'; END IF;
  SELECT * INTO r FROM public.withdraw_requests WHERE id = _id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Permintaan tidak ditemukan atau sudah diproses'; END IF;
  IF _approve THEN
    SELECT balance INTO current_balance FROM public.profiles WHERE id = r.user_id FOR UPDATE;
    IF current_balance IS NULL OR current_balance < r.amount THEN RAISE EXCEPTION 'Saldo pengguna tidak cukup untuk penarikan ini'; END IF;
    UPDATE public.profiles SET balance = balance - r.amount WHERE id = r.user_id;
  END IF;
  UPDATE public.withdraw_requests
     SET status = CASE WHEN _approve THEN 'approved'::public.request_status ELSE 'rejected'::public.request_status END,
         admin_note = _note,
         proof_path = COALESCE(_proof_path, proof_path),
         reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_withdraw(uuid, boolean, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_withdraw(uuid, boolean, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_balance(_user_id uuid, _balance bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Hanya admin yang dapat mengubah saldo'; END IF;
  IF _balance < 0 THEN RAISE EXCEPTION 'Saldo tidak boleh negatif'; END IF;
  UPDATE public.profiles SET balance = _balance WHERE id = _user_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_balance(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_balance(uuid, bigint) TO authenticated, service_role;
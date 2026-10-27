-- FlohmarktRadar: Trigger, Hilfsfunktionen, Row Level Security

-- Hilfsfunktion: ist der aktuelle Nutzer Super-Admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

-- Hilfsfunktion: ist der aktuelle Nutzer ein freigegebener Veranstalter?
CREATE OR REPLACE FUNCTION public.is_approved_organizer()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'organizer' AND organizer_status = 'approved'
  );
$$;

-- Profil automatisch bei Registrierung anlegen. Rolle kommt aus den Sign-up-Metadaten.
-- Wer sich als Veranstalter registriert, startet mit organizer_status = 'pending'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  requested_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'visitor');
BEGIN
  IF requested_role NOT IN ('visitor', 'seller', 'organizer') THEN
    requested_role := 'visitor';
  END IF;
  INSERT INTO public.profiles (id, email, role, organizer_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    requested_role,
    CASE WHEN requested_role = 'organizer' THEN 'pending' ELSE 'none' END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Geschützte Profilfelder: nur Super-Admins dürfen Admin-Flag und Veranstalter-Status ändern.
-- Nutzer dürfen ihre Rolle nur zu seller/organizer wechseln (organizer -> pending).
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.is_super_admin() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.is_super_admin := OLD.is_super_admin;
  NEW.email := OLD.email;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.role = 'organizer' AND OLD.organizer_status = 'none' THEN
      NEW.organizer_status := 'pending';
    ELSE
      NEW.organizer_status := OLD.organizer_status;
    END IF;
  ELSE
    NEW.organizer_status := OLD.organizer_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- location automatisch aus latitude/longitude befüllen
CREATE OR REPLACE FUNCTION public.set_location_from_coords()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.location := extensions.ST_SetSRID(
    extensions.ST_MakePoint(NEW.longitude, NEW.latitude), 4326
  )::extensions.geography;
  RETURN NEW;
END;
$$;

CREATE TRIGGER markets_set_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.markets
  FOR EACH ROW EXECUTE FUNCTION public.set_location_from_coords();

CREATE TRIGGER stalls_set_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.stalls
  FOR EACH ROW EXECUTE FUNCTION public.set_location_from_coords();

-- Garagen- und Hofflohmärkte brauchen Freigabe durch den Super-Admin.
-- Anbieter können approval_status nicht selbst setzen.
CREATE OR REPLACE FUNCTION public.enforce_stall_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.approval_status := CASE
      WHEN NEW.stall_type IN ('garage_sale', 'yard_sale') THEN 'pending_approval'
      ELSE 'approved'
    END;
  ELSE
    NEW.approval_status := OLD.approval_status;
    IF NEW.stall_type IS DISTINCT FROM OLD.stall_type
       AND NEW.stall_type IN ('garage_sale', 'yard_sale') THEN
      NEW.approval_status := 'pending_approval';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stalls_enforce_approval
  BEFORE INSERT OR UPDATE ON public.stalls
  FOR EACH ROW EXECUTE FUNCTION public.enforce_stall_approval();

-- Umkreissuche
CREATE OR REPLACE FUNCTION public.markets_nearby(lat DOUBLE PRECISION, lng DOUBLE PRECISION, radius_m DOUBLE PRECISION)
RETURNS TABLE (market public.markets, distance_m DOUBLE PRECISION)
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT m, extensions.ST_Distance(m.location, extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography)
  FROM public.markets m
  WHERE extensions.ST_DWithin(m.location, extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography, radius_m)
  ORDER BY 2;
$$;

CREATE OR REPLACE FUNCTION public.stalls_nearby(lat DOUBLE PRECISION, lng DOUBLE PRECISION, radius_m DOUBLE PRECISION)
RETURNS TABLE (stall public.stalls, distance_m DOUBLE PRECISION)
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT s, extensions.ST_Distance(s.location, extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography)
  FROM public.stalls s
  WHERE s.approval_status = 'approved'
    AND extensions.ST_DWithin(s.location, extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography, radius_m)
  ORDER BY 2;
$$;

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_suggestions ENABLE ROW LEVEL SECURITY;

-- profiles: eigenes Profil lesen/ändern, Admin alles
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));

-- favorites: nur eigene
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- markets: öffentlich lesbar; freigegebene Veranstalter verwalten eigene; Admin alles
CREATE POLICY "markets_select_public" ON public.markets FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "markets_insert_organizer" ON public.markets FOR INSERT TO authenticated
  WITH CHECK ((organizer_id = (SELECT auth.uid()) AND (SELECT public.is_approved_organizer())) OR (SELECT public.is_super_admin()));
CREATE POLICY "markets_update_owner" ON public.markets FOR UPDATE TO authenticated
  USING (organizer_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()))
  WITH CHECK (organizer_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));
CREATE POLICY "markets_delete_owner" ON public.markets FOR DELETE TO authenticated
  USING (organizer_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));

-- stalls: freigegebene öffentlich; eigene immer; Admin alles
CREATE POLICY "stalls_select" ON public.stalls FOR SELECT TO anon, authenticated
  USING (approval_status = 'approved' OR user_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));
CREATE POLICY "stalls_insert_own" ON public.stalls FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "stalls_update_own" ON public.stalls FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));
CREATE POLICY "stalls_delete_own" ON public.stalls FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));

-- market_suggestions: angemeldete Nutzer schicken ein; eigene lesen; Admin alles
CREATE POLICY "suggestions_insert" ON public.market_suggestions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "suggestions_select" ON public.market_suggestions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_super_admin()));
CREATE POLICY "suggestions_admin_modify" ON public.market_suggestions FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- Foto-Speicher
INSERT INTO storage.buckets (id, name, public) VALUES
  ('proof-images', 'proof-images', FALSE),
  ('market-images', 'market-images', TRUE),
  ('stall-images', 'stall-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Dateien liegen unter <user_id>/<datei>. Beweis-Fotos: nur Eigentümer und Admin.
CREATE POLICY "proof_images_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proof-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "proof_images_owner_or_admin_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proof-images' AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_super_admin())));
CREATE POLICY "proof_images_owner_or_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proof-images' AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR (SELECT public.is_super_admin())));

CREATE POLICY "public_images_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('market-images', 'stall-images') AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "public_images_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('market-images', 'stall-images') AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Hilfs- und Triggerfunktionen aus der öffentlichen API (Schema public) herausnehmen
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

ALTER FUNCTION public.is_super_admin() SET SCHEMA private;
ALTER FUNCTION public.is_approved_organizer() SET SCHEMA private;
ALTER FUNCTION public.handle_new_user() SET SCHEMA private;
ALTER FUNCTION public.protect_profile_fields() SET SCHEMA private;
ALTER FUNCTION public.enforce_stall_approval() SET SCHEMA private;
ALTER FUNCTION public.set_location_from_coords() SET SCHEMA private;

REVOKE EXECUTE ON FUNCTION private.handle_new_user(), private.protect_profile_fields(),
  private.enforce_stall_approval(), private.set_location_from_coords() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.protect_profile_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF private.is_super_admin() OR auth.uid() IS NULL THEN
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

CREATE OR REPLACE FUNCTION private.enforce_stall_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF private.is_super_admin() THEN
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

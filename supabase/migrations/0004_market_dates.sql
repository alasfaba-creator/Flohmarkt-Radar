-- Termine für den Kalender: ein Markt kann viele Termine haben.
ALTER TABLE public.markets
  ADD COLUMN address TEXT,
  ADD COLUMN website_url TEXT;

CREATE TABLE public.market_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  note TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (market_id, event_date)
);

CREATE INDEX market_dates_date_idx ON public.market_dates (event_date);

ALTER TABLE public.market_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_dates_select_public" ON public.market_dates FOR SELECT TO anon, authenticated USING (TRUE);

-- Termine verwaltet, wer den Markt verwaltet (Veranstalter oder Super-Admin).
CREATE POLICY "market_dates_modify_owner" ON public.market_dates FOR ALL TO authenticated
  USING (
    (SELECT private.is_super_admin())
    OR EXISTS (SELECT 1 FROM public.markets m WHERE m.id = market_id AND m.organizer_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT private.is_super_admin())
    OR EXISTS (SELECT 1 FROM public.markets m WHERE m.id = market_id AND m.organizer_id = (SELECT auth.uid()))
  );

-- Kalender: Termine im Umkreis und Zeitraum, nach Datum und Entfernung sortiert.
CREATE OR REPLACE FUNCTION public.market_dates_nearby(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_m DOUBLE PRECISION,
  from_date DATE,
  to_date DATE
)
RETURNS TABLE (market_date public.market_dates, market public.markets, distance_m DOUBLE PRECISION)
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT d, m, extensions.ST_Distance(m.location, extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography)
  FROM public.market_dates d
  JOIN public.markets m ON m.id = d.market_id
  WHERE d.event_date BETWEEN from_date AND to_date
    AND extensions.ST_DWithin(m.location, extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography, radius_m)
  ORDER BY d.event_date, 3;
$$;

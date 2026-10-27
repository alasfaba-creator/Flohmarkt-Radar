-- FlohmarktRadar: Grundschema (aus dem Master-Blueprint)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 1. Profiles: jedes Konto bekommt ein Profil. 'visitor' = Besucher mit Konto (nur für Favoriten).
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('visitor', 'seller', 'organizer')) NOT NULL DEFAULT 'visitor',
  organizer_status TEXT CHECK (organizer_status IN ('none', 'pending', 'approved')) NOT NULL DEFAULT 'none',
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Favorites
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  target_type TEXT CHECK (target_type IN ('market', 'stall')) NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

-- 3. Markets
CREATE TABLE public.markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_covered TEXT CHECK (is_covered IN ('indoor', 'outdoor', 'partial')) DEFAULT 'outdoor',
  features TEXT[],
  images TEXT[],
  parking_info_text TEXT,
  is_market_open BOOLEAN DEFAULT TRUE,
  total_stalls INT DEFAULT 0 CHECK (total_stalls >= 0),
  booked_stalls INT DEFAULT 0 CHECK (booked_stalls >= 0),
  available_sizes_text TEXT,
  show_occupancy_to_sellers BOOLEAN DEFAULT FALSE,
  show_free_stalls_to_sellers BOOLEAN DEFAULT FALSE,
  show_available_sizes_to_sellers BOOLEAN DEFAULT FALSE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location extensions.GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Stalls
CREATE TABLE public.stalls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  stall_type TEXT CHECK (stall_type IN ('classic_market', 'garage_sale', 'yard_sale')) NOT NULL,
  event_date DATE,
  proof_image_url TEXT,
  approval_status TEXT CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')) NOT NULL DEFAULT 'approved',
  stand_number TEXT,
  categories TEXT[],
  custom_items TEXT,
  has_coffee_and_cake BOOLEAN DEFAULT FALSE,
  planned_start TIME,
  planned_end TIME,
  is_open_by_seller BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location extensions.GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Market Suggestions
CREATE TABLE public.market_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  suggested_name TEXT NOT NULL,
  location_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes
CREATE INDEX markets_location_idx ON public.markets USING GIST (location);
CREATE INDEX stalls_location_idx ON public.stalls USING GIST (location);
CREATE INDEX markets_organizer_idx ON public.markets (organizer_id);
CREATE INDEX stalls_user_idx ON public.stalls (user_id);
CREATE INDEX stalls_market_idx ON public.stalls (market_id);
CREATE INDEX favorites_user_idx ON public.favorites (user_id);
CREATE INDEX market_suggestions_user_idx ON public.market_suggestions (user_id);

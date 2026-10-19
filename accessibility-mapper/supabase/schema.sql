-- ==============================================================================
-- AccessMap - Supabase Database Schema
-- Provides tables for Places, Community Reports, User Searches, and Activity Logs
-- ==============================================================================

-- 1. Places Table
CREATE TABLE IF NOT EXISTS public.places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Metro Area',
  lat DOUBLE PRECISION DEFAULT 0,
  lng DOUBLE PRECISION DEFAULT 0,
  distance_km DOUBLE PRECISION DEFAULT 0,
  accessibility_level TEXT NOT NULL DEFAULT 'partially_accessible',
  accessibility_score INTEGER NOT NULL DEFAULT 75,
  summary TEXT DEFAULT '',
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  entrances JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT DEFAULT '',
  image_alt TEXT DEFAULT '',
  photos_count INTEGER NOT NULL DEFAULT 1,
  reports_count INTEGER NOT NULL DEFAULT 1,
  last_updated TEXT DEFAULT CURRENT_DATE::text,
  verified_by_community BOOLEAN NOT NULL DEFAULT true,
  opening_hours TEXT DEFAULT 'Mon - Sun: 8:00 AM - 9:00 PM',
  phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Community Reports Table (Audits, AI Classifications & Community Feedback)
CREATE TABLE IF NOT EXISTS public.community_reports (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  place_name TEXT NOT NULL,
  place_category TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'community_member',
  feature_category TEXT NOT NULL,
  photo_url TEXT DEFAULT '',
  photo_alt TEXT DEFAULT '',
  ai_classification JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  date TEXT DEFAULT CURRENT_DATE::text,
  upvotes INTEGER NOT NULL DEFAULT 1,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. User Searches Table (Tracks user searches, filters, and count of matching places)
CREATE TABLE IF NOT EXISTS public.user_searches (
  id TEXT PRIMARY KEY,
  session_id TEXT DEFAULT '',
  query TEXT NOT NULL,
  category TEXT DEFAULT 'all',
  status_filter TEXT DEFAULT 'all',
  feature_filter TEXT DEFAULT 'all',
  results_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'discovery_bar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. User Activities Table (Tracks user actions: view, audit, search, upvote, etc.)
CREATE TABLE IF NOT EXISTS public.user_activities (
  id TEXT PRIMARY KEY,
  session_id TEXT DEFAULT '',
  action TEXT NOT NULL,
  target_id TEXT DEFAULT '',
  target_name TEXT DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for high-performance searches and filtering
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places (category);
CREATE INDEX IF NOT EXISTS idx_places_accessibility_level ON public.places (accessibility_level);
CREATE INDEX IF NOT EXISTS idx_community_reports_place_id ON public.community_reports (place_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_created_at ON public.community_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_created_at ON public.user_searches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_query ON public.user_searches (query);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated read & write access policies
CREATE POLICY "Public places are viewable by everyone" ON public.places FOR SELECT USING (true);
CREATE POLICY "Public can insert places" ON public.places FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update places" ON public.places FOR UPDATE USING (true);
CREATE POLICY "Public can delete places" ON public.places FOR DELETE USING (true);

CREATE POLICY "Public reports are viewable by everyone" ON public.community_reports FOR SELECT USING (true);
CREATE POLICY "Public can insert reports" ON public.community_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update reports" ON public.community_reports FOR UPDATE USING (true);
CREATE POLICY "Public can delete reports" ON public.community_reports FOR DELETE USING (true);

CREATE POLICY "Public searches are viewable by everyone" ON public.user_searches FOR SELECT USING (true);
CREATE POLICY "Public can insert searches" ON public.user_searches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete searches" ON public.user_searches FOR DELETE USING (true);

CREATE POLICY "Public activities are viewable by everyone" ON public.user_activities FOR SELECT USING (true);
CREATE POLICY "Public can insert activities" ON public.user_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can delete activities" ON public.user_activities FOR DELETE USING (true);

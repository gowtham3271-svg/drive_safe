-- Intelligent Road Safety and Blind-Turn Hazard Detection System
-- Supabase / PostgreSQL Schema Definition

-- Cameras Table
CREATE TABLE IF NOT EXISTS public.cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    road_section TEXT DEFAULT 'Blind Turn / Ghat Section',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'OFFLINE', -- 'ONLINE' | 'OFFLINE'
    hazard_status TEXT NOT NULL DEFAULT 'NORMAL', -- 'NORMAL' | 'CAUTION' | 'ALERT'
    stream_url TEXT,
    visibility TEXT DEFAULT 'Normal', -- 'Normal' | 'Fog' | 'Low Visibility'
    vehicle_count INT DEFAULT 0,
    person_count INT DEFAULT 0,
    last_ping TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Detections Table
CREATE TABLE IF NOT EXISTS public.detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id TEXT NOT NULL REFERENCES public.cameras(camera_id) ON DELETE CASCADE,
    object_class TEXT NOT NULL,
    confidence REAL NOT NULL,
    x1 REAL NOT NULL,
    y1 REAL NOT NULL,
    x2 REAL NOT NULL,
    y2 REAL NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'NORMAL' | 'CAUTION' | 'ALERT'
    timestamp TIMESTAMPTZ DEFAULT now(),
    resolved BOOLEAN DEFAULT false
);

-- System Status Table
CREATE TABLE IF NOT EXISTS public.system_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component TEXT UNIQUE NOT NULL, -- 'raspberry_pi', 'yolo11', 'camera', 'backend', 'database'
    status TEXT NOT NULL,           -- 'ONLINE', 'OFFLINE', 'CONNECTED', 'NOT CONNECTED'
    last_update TIMESTAMPTZ DEFAULT now(),
    details JSONB DEFAULT '{}'::jsonb
);

-- Row Level Security (RLS)
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

-- Permissive development policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read cameras') THEN
        CREATE POLICY "Allow public read cameras" ON public.cameras FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all cameras') THEN
        CREATE POLICY "Allow public all cameras" ON public.cameras FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read detections') THEN
        CREATE POLICY "Allow public read detections" ON public.detections FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert detections') THEN
        CREATE POLICY "Allow public insert detections" ON public.detections FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read alerts') THEN
        CREATE POLICY "Allow public read alerts" ON public.alerts FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all alerts') THEN
        CREATE POLICY "Allow public all alerts" ON public.alerts FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read system_status') THEN
        CREATE POLICY "Allow public read system_status" ON public.system_status FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public all system_status') THEN
        CREATE POLICY "Allow public all system_status" ON public.system_status FOR ALL USING (true);
    END IF;
END $$;

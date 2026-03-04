-- Run this in Supabase → SQL Editor → New Query → paste and click "Run"

-- Create the deacons table
CREATE TABLE deacons (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth TEXT,
  deacon_rank TEXT,
  ordination_date TEXT,
  ordination_name TEXT,
  confession_father TEXT,
  profession TEXT,
  mobile_number TEXT,
  residence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE deacons ENABLE ROW LEVEL SECURITY;

-- Allow anyone with the anon key to read, insert, update, delete
-- (For a church app this is fine. For production, use auth.)
CREATE POLICY "Allow all operations" ON deacons
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deacons_updated_at
  BEFORE UPDATE ON deacons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

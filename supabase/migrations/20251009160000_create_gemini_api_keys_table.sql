/*
  # Create Gemini API Keys Management Table

  1. New Tables
    - `gemini_api_keys`
      - `id` (uuid, primary key)
      - `api_key` (text, unique, not null) - The Gemini API key
      - `is_active` (boolean, default true) - Whether the key is currently active
      - `last_used_at` (timestamptz) - Last time this key was used
      - `error_count` (integer, default 0) - Track consecutive errors
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `gemini_api_keys` table
    - Add policies for public access (needed for the app)

  3. Notes
    - This table stores API keys that will be rotated in round-robin fashion
    - Keys can be added/removed dynamically
    - System tracks usage and errors for each key
*/

CREATE TABLE IF NOT EXISTS gemini_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  error_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gemini_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active API keys" ON gemini_api_keys;
CREATE POLICY "Allow public read access to active API keys"
  ON gemini_api_keys
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow public insert of API keys" ON gemini_api_keys;
CREATE POLICY "Allow public insert of API keys"
  ON gemini_api_keys
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update of API keys" ON gemini_api_keys;
CREATE POLICY "Allow public update of API keys"
  ON gemini_api_keys
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete of API keys" ON gemini_api_keys;
CREATE POLICY "Allow public delete of API keys"
  ON gemini_api_keys
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_active ON gemini_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_last_used ON gemini_api_keys(last_used_at);

-- Insert the initial API keys
INSERT INTO gemini_api_keys (api_key) VALUES
  ('AIzaSyB9QDIoLmfWnQI9Qy9PXGeeNvNyESLWMr0'),
  ('AIzaSyAAk-o1ZQIxHos0ixXdm59qt8jOOEsc_0M'),
  ('AIzaSyBZcxKcFkMLUBXtYRp5UHoXwGB5mQ1MJVI'),
  ('AIzaSyDc60zrn69_ofEXMdU4gCOT5QUphrPgiBM'),
  ('AIzaSyAmh6oy770fHumwmpE7_tyT1cjwiV4jtcA'),
  ('AIzaSyAIb8_yMe4eBJi0zM-ltIr36VpbIYBrduE'),
  ('AIzaSyDtYCBEUhsJQoOYtT8AUOHGlicNYyyvdZw'),
  ('AIzaSyD4C7drU0i3yg9vCx_UyN1kgYaNWnV3K4E'),
  ('AIzaSyCLaG3KK6BpziM1Uj57Ja9GfnOnqi1o4s8'),
  ('AIzaSyBHBIe0n4-7tCjfPsRVgNYgUQOznFHfMHw')
ON CONFLICT (api_key) DO NOTHING;

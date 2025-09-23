-- Create table for storing guest invitations
CREATE TABLE IF NOT EXISTS public.guest_invitations (
  id BIGSERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.guest_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access
CREATE POLICY "Allow public read access" ON public.guest_invitations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.guest_invitations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON public.guest_invitations
  FOR DELETE USING (true);

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_invitations;

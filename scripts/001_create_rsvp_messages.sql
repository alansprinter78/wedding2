-- Create table for RSVP messages
CREATE TABLE IF NOT EXISTS public.rsvp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attendance BOOLEAN NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.rsvp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read and insert (since this is a wedding invitation)
CREATE POLICY "Allow public to view messages" ON public.rsvp_messages FOR SELECT USING (true);
CREATE POLICY "Allow public to insert messages" ON public.rsvp_messages FOR INSERT WITH CHECK (true);

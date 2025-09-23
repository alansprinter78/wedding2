-- Drop existing table if it exists and recreate with correct structure
DROP TABLE IF EXISTS public.rsvp_messages;

-- Create the rsvp_messages table with correct column names
CREATE TABLE public.rsvp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_name TEXT NOT NULL,
    message TEXT,
    attendance BOOLEAN NOT NULL DEFAULT false,
    guest_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.rsvp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access
CREATE POLICY "Allow public read access" ON public.rsvp_messages
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.rsvp_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON public.rsvp_messages
    FOR DELETE USING (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvp_messages;

-- Grant necessary permissions
GRANT ALL ON public.rsvp_messages TO anon;
GRANT ALL ON public.rsvp_messages TO authenticated;

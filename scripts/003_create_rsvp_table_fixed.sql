-- Drop table if exists and recreate to ensure clean setup
DROP TABLE IF EXISTS public.rsvp_messages;

-- Create rsvp_messages table
CREATE TABLE public.rsvp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    attendance VARCHAR(50) NOT NULL CHECK (attendance IN ('hadir', 'tidak-hadir', 'ragu-ragu')),
    guest_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Insert some sample data for testing
INSERT INTO public.rsvp_messages (name, message, attendance, guest_count) VALUES
('Admin Test', 'Tabel berhasil dibuat!', 'hadir', 1);

-- Enable RLS and create policies for public access
-- Enable Row Level Security
ALTER TABLE rsvp_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert messages (for public RSVP)
CREATE POLICY "Allow public insert on rsvp_messages" ON rsvp_messages
FOR INSERT TO anon
WITH CHECK (true);

-- Create policy to allow anyone to read messages (for public display)
CREATE POLICY "Allow public read on rsvp_messages" ON rsvp_messages
FOR SELECT TO anon
USING (true);

-- Create policy to allow anyone to delete messages (for admin functions)
CREATE POLICY "Allow public delete on rsvp_messages" ON rsvp_messages
FOR DELETE TO anon
USING (true);

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1000;

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
  SELECT 'FIN-' || LPAD(nextval('support_ticket_seq')::TEXT, 6, '0');
$$ LANGUAGE SQL;

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL DEFAULT generate_ticket_number(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

-- Admins can update tickets
CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

-- Create trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
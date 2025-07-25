
-- Create pickup_agents table for phone-based authentication
CREATE TABLE IF NOT EXISTS pickup_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  total_collections INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pickup_agents ENABLE ROW LEVEL SECURITY;

-- Create policies for pickup agents
CREATE POLICY "Pickup agents can view own profile" ON pickup_agents
  FOR SELECT USING (true);

CREATE POLICY "Pickup agents can update own profile" ON pickup_agents
  FOR UPDATE USING (true);

CREATE POLICY "Allow pickup agent creation" ON pickup_agents
  FOR INSERT WITH CHECK (true);

-- Create collection_tasks table for pickup assignments
CREATE TABLE IF NOT EXISTS collection_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup_agent_id UUID REFERENCES pickup_agents(id) ON DELETE CASCADE,
  waste_report_id UUID REFERENCES waste_reports(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for collection_tasks
ALTER TABLE collection_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for collection_tasks
CREATE POLICY "Pickup agents can view own tasks" ON collection_tasks
  FOR SELECT USING (true);

CREATE POLICY "Pickup agents can update own tasks" ON collection_tasks
  FOR UPDATE USING (true);

CREATE POLICY "Allow task creation" ON collection_tasks
  FOR INSERT WITH CHECK (true);

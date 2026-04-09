-- Migration 005: Maintenance Tickets

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general'
    CHECK (category IN ('plumbing', 'electrical', 'structural', 'landscape', 'general', 'security')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'pending_parts', 'completed', 'cancelled')),
  location VARCHAR(255),
  reported_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  closing_notes TEXT,
  materials_used TEXT,
  labor_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_community ON maintenance_tickets(community_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON maintenance_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_reported ON maintenance_tickets(reported_by);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON maintenance_tickets(priority);

CREATE TABLE IF NOT EXISTS maintenance_ticket_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id),
  author_id UUID NOT NULL REFERENCES users(id),
  comment TEXT,
  status_change_from VARCHAR(20),
  status_change_to VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_updates_ticket ON maintenance_ticket_updates(ticket_id);

CREATE TABLE IF NOT EXISTS maintenance_ticket_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id),
  update_id UUID REFERENCES maintenance_ticket_updates(id),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  photo_type VARCHAR(20) DEFAULT 'general'
    CHECK (photo_type IN ('before', 'after', 'general', 'evidence')),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_photos_ticket ON maintenance_ticket_photos(ticket_id);

-- Inspection checklists
CREATE TABLE IF NOT EXISTS inspection_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  inspector_id UUID NOT NULL REFERENCES users(id),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  area VARCHAR(100) NOT NULL,
  checklist_data JSONB NOT NULL DEFAULT '[]',
  overall_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspection_checklists(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspection_checklists(inspector_id);

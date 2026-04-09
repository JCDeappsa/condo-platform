-- Migration 002: Units / Lots
-- Creates the units table for tracking all lots in the condominium

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  unit_number VARCHAR(20) NOT NULL,
  unit_type VARCHAR(30) NOT NULL DEFAULT 'house'
    CHECK (unit_type IN ('house', 'guard_house', 'maintenance_yard', 'clubhouse', 'visitor_parking')),
  address TEXT,
  area_m2 DECIMAL(10,2),
  owner_user_id UUID REFERENCES users(id),
  resident_user_id UUID REFERENCES users(id),
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_number_community ON units(community_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_units_community ON units(community_id);
CREATE INDEX IF NOT EXISTS idx_units_owner ON units(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_units_resident ON units(resident_user_id);
CREATE INDEX IF NOT EXISTS idx_units_type ON units(unit_type);

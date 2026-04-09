-- Migration 006: Meter Management

CREATE TABLE IF NOT EXISTS meter_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  anomaly_threshold_pct DECIMAL(5,2) NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO meter_types (name, unit_of_measure, anomaly_threshold_pct) VALUES
  ('Agua', 'm3', 50),
  ('Electricidad', 'kWh', 50),
  ('Gas', 'ft3', 50)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS meter_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id),
  meter_type_id UUID NOT NULL REFERENCES meter_types(id),
  meter_serial VARCHAR(100),
  location_description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_reading_value DECIMAL(12,3),
  last_reading_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meter_points_unit ON meter_points(unit_id);

CREATE TABLE IF NOT EXISTS meter_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_point_id UUID NOT NULL REFERENCES meter_points(id),
  reading_value DECIMAL(12,3) NOT NULL,
  reading_date DATE NOT NULL,
  photo_url TEXT,
  is_anomaly BOOLEAN NOT NULL DEFAULT false,
  anomaly_notes TEXT,
  read_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_point ON meter_readings(meter_point_id);
CREATE INDEX IF NOT EXISTS idx_readings_date ON meter_readings(reading_date);
CREATE INDEX IF NOT EXISTS idx_readings_anomaly ON meter_readings(is_anomaly);

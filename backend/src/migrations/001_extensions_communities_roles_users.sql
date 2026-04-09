-- Migration 001: Extensions, Communities, Roles, Users
-- Creates the foundational tables for auth and RBAC

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Communities (single row for MVP, multi-condo ready for V2)
-- ============================================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  total_lots INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the single community
INSERT INTO communities (id, name, address, total_lots)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Mi Condominio',
  'Ciudad de Guatemala, Guatemala',
  60
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  hierarchy_level INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (id, name, description, hierarchy_level) VALUES
  ('00000000-0000-0000-0000-000000000010', 'administrator', 'Administrador - Control operativo total', 40),
  ('00000000-0000-0000-0000-000000000020', 'board_member', 'Junta Directiva - Supervisión y reportes (solo lectura)', 30),
  ('00000000-0000-0000-0000-000000000030', 'maintenance', 'Mantenimiento - Tareas, reportes, lecturas', 20),
  ('00000000-0000-0000-0000-000000000050', 'owner', 'Propietario - Dueño de la unidad', 15),
  ('00000000-0000-0000-0000-000000000040', 'resident', 'Residente - Acceso a datos propios', 10)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  role_id UUID NOT NULL REFERENCES roles(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  refresh_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_community ON users(community_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

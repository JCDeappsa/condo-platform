-- Migration 003: Billing (monthly_charges), Payments, Account Movements

-- ============================================================
-- Monthly Charges
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id),
  period VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_unit_period_desc ON monthly_charges(unit_id, period, description);
CREATE INDEX IF NOT EXISTS idx_charges_period ON monthly_charges(period);
CREATE INDEX IF NOT EXISTS idx_charges_status ON monthly_charges(status);
CREATE INDEX IF NOT EXISTS idx_charges_unit ON monthly_charges(unit_id);
CREATE INDEX IF NOT EXISTS idx_charges_due_date ON monthly_charges(due_date);

-- ============================================================
-- Payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'bank_transfer'
    CHECK (payment_method IN ('bank_transfer', 'cash', 'check', 'online')),
  reference_number VARCHAR(100),
  bank_reference VARCHAR(100),
  notes TEXT,
  receipt_url TEXT,
  reconciled BOOLEAN NOT NULL DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_unit ON payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_reconciled ON payments(reconciled);

-- ============================================================
-- Account Movements (ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS account_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id),
  monthly_charge_id UUID REFERENCES monthly_charges(id),
  payment_id UUID REFERENCES payments(id),
  movement_type VARCHAR(20) NOT NULL
    CHECK (movement_type IN ('charge', 'payment', 'adjustment', 'credit', 'penalty')),
  amount DECIMAL(10,2) NOT NULL, -- positive for charges, negative for payments
  running_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  description VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_unit ON account_movements(unit_id);
CREATE INDEX IF NOT EXISTS idx_movements_unit_date ON account_movements(unit_id, created_at);
CREATE INDEX IF NOT EXISTS idx_movements_charge ON account_movements(monthly_charge_id);
CREATE INDEX IF NOT EXISTS idx_movements_payment ON account_movements(payment_id);

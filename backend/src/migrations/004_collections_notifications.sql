-- Migration 004: Collections and Notifications

-- ============================================================
-- Notification Templates
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  channel VARCHAR(20) NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'sms', 'in_app')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default templates
INSERT INTO notification_templates (name, subject, body_html, body_text, channel) VALUES
  ('first_reminder', 'Recordatorio de pago - {{unit_number}}',
   '<p>Estimado(a) {{resident_name}},</p><p>Le recordamos que su cuota mensual de <strong>Q{{amount}}</strong> con fecha de vencimiento <strong>{{due_date}}</strong> se encuentra pendiente de pago.</p><p>Le agradecemos realizar su pago a la brevedad.</p><p>Atentamente,<br/>Administración del Condominio</p>',
   'Estimado(a) {{resident_name}}, le recordamos que su cuota mensual de Q{{amount}} con vencimiento {{due_date}} está pendiente.', 'email'),
  ('second_reminder', 'Segundo recordatorio de pago - {{unit_number}}',
   '<p>Estimado(a) {{resident_name}},</p><p>Este es un segundo recordatorio de que su cuenta presenta un saldo vencido de <strong>Q{{total_overdue}}</strong> correspondiente a la unidad <strong>{{unit_number}}</strong>.</p><p>Le solicitamos regularizar su situación a la brevedad posible.</p><p>Atentamente,<br/>Administración del Condominio</p>',
   'Segundo recordatorio: su cuenta presenta un saldo vencido de Q{{total_overdue}} para la unidad {{unit_number}}.', 'email'),
  ('delinquency_notice', 'Aviso de morosidad - {{unit_number}}',
   '<p>Estimado(a) {{resident_name}},</p><p>Por medio de la presente le notificamos que su cuenta de la unidad <strong>{{unit_number}}</strong> presenta un saldo vencido de <strong>Q{{total_overdue}}</strong> con <strong>{{days_overdue}} días de mora</strong>.</p><p>De no regularizar su situación, se procederá conforme al reglamento del condominio.</p><p>Atentamente,<br/>Administración del Condominio</p>',
   'Aviso de morosidad: unidad {{unit_number}} con Q{{total_overdue}} y {{days_overdue}} días de mora.', 'email'),
  ('final_warning', 'Aviso final de pago - {{unit_number}}',
   '<p>Estimado(a) {{resident_name}},</p><p><strong>AVISO FINAL:</strong> Su cuenta de la unidad <strong>{{unit_number}}</strong> presenta un saldo vencido de <strong>Q{{total_overdue}}</strong> con <strong>{{days_overdue}} días de mora</strong>.</p><p>Este es el último aviso antes de proceder con las medidas establecidas en el reglamento.</p><p>Atentamente,<br/>Administración del Condominio</p>',
   'AVISO FINAL: unidad {{unit_number}} con Q{{total_overdue}} y {{days_overdue}} días de mora.', 'email'),
  ('shutoff_warning', 'Aviso de restricción de servicios - {{unit_number}}',
   '<p>Estimado(a) {{resident_name}},</p><p>Debido a la morosidad persistente de <strong>Q{{total_overdue}}</strong> en su cuenta de la unidad <strong>{{unit_number}}</strong>, se le notifica que se procederá con la restricción de servicios conforme al reglamento del condominio.</p><p>Para evitar esta medida, le solicitamos regularizar su cuenta de inmediato.</p><p>Atentamente,<br/>Administración del Condominio</p>',
   'Aviso de restricción: unidad {{unit_number}} con Q{{total_overdue}} de mora.', 'email')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Notification Rules (escalation)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  trigger_type VARCHAR(30) NOT NULL DEFAULT 'days_overdue'
    CHECK (trigger_type IN ('days_overdue', 'payment_received', 'promise_expired')),
  days_overdue INTEGER,
  template_id UUID NOT NULL REFERENCES notification_templates(id),
  cooldown_hours INTEGER NOT NULL DEFAULT 168, -- 7 days
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_active ON notification_rules(is_active, sort_order);

-- ============================================================
-- Notifications (sent/pending)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  rule_id UUID REFERENCES notification_rules(id),
  template_id UUID REFERENCES notification_templates(id),
  channel VARCHAR(20) NOT NULL DEFAULT 'email',
  subject VARCHAR(255),
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'read')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unit ON notifications(unit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- ============================================================
-- Account Collection Status (one per unit)
-- ============================================================
CREATE TABLE IF NOT EXISTS account_collection_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL UNIQUE REFERENCES units(id),
  total_overdue DECIMAL(10,2) NOT NULL DEFAULT 0,
  oldest_overdue_date DATE,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  collection_stage VARCHAR(30) NOT NULL DEFAULT 'current'
    CHECK (collection_stage IN ('current', 'reminder', 'warning', 'escalated', 'legal')),
  last_notification_at TIMESTAMPTZ,
  has_active_promise BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_status_stage ON account_collection_status(collection_stage);
CREATE INDEX IF NOT EXISTS idx_collection_status_overdue ON account_collection_status(days_overdue DESC);

-- ============================================================
-- Payment Promises
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_promises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id),
  promised_amount DECIMAL(10,2) NOT NULL,
  promised_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'fulfilled', 'broken', 'cancelled')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promises_unit ON payment_promises(unit_id);
CREATE INDEX IF NOT EXISTS idx_promises_status ON payment_promises(status);

-- ============================================================
-- Collection Notes
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id),
  author_id UUID NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_notes_unit ON collection_notes(unit_id);

import { MonthlyCharge } from '../modules/billing/monthly-charges.model';
import { Unit } from '../modules/units/units.model';
import { User } from '../modules/users/users.model';
import { Op } from 'sequelize';
import { env } from '../config/env';

interface BICSVRow {
  reference_id: string;
  unit_number: string;
  resident_name: string;
  billing_period: string;
  amount_due: string;
  due_date: string;
  description: string;
}

/**
 * Generate a CSV string for Banco Industrial payment collection.
 * Each row represents an outstanding charge.
 */
export async function generateBancoIndustrialCSV(period?: string): Promise<string> {
  const where: any = {
    status: { [Op.in]: ['pending', 'partial', 'overdue'] },
  };
  if (period) where.period = period;

  const charges = await MonthlyCharge.findAll({
    where,
    include: [{
      model: Unit,
      as: 'unit',
      attributes: ['id', 'unitNumber', 'ownerUserId', 'residentUserId'],
      include: [
        { model: User, as: 'resident', attributes: ['firstName', 'lastName'] },
        { model: User, as: 'owner', attributes: ['firstName', 'lastName'] },
      ],
    }],
    order: [['unit_id', 'ASC'], ['period', 'ASC']],
  });

  const header = 'reference_id,unit_number,resident_name,billing_period,amount_due,due_date,description';
  const rows: string[] = [header];

  for (const charge of charges) {
    const unit = charge.unit;
    if (!unit) continue;

    const resident = (unit as any).resident || (unit as any).owner;
    const residentName = resident
      ? `${resident.firstName} ${resident.lastName}`
      : 'Sin residente';

    const amountDue = (Number(charge.amount) - Number(charge.paidAmount)).toFixed(2);

    const row: BICSVRow = {
      reference_id: charge.id,
      unit_number: unit.unitNumber,
      resident_name: escapeCsvField(residentName),
      billing_period: charge.period,
      amount_due: amountDue,
      due_date: formatDate(charge.dueDate),
      description: escapeCsvField(charge.description),
    };

    rows.push(Object.values(row).join(','));
  }

  return rows.join('\n');
}

/**
 * Parse a bank reconciliation CSV from Banco Industrial.
 * Stub implementation — to be completed with actual bank format.
 */
export async function parseBancoIndustrialReconciliation(csvContent: string): Promise<{
  parsed: number;
  matched: number;
  unmatched: number;
  records: Array<{
    referenceId: string;
    amountPaid: number;
    paymentDate: string;
    matched: boolean;
  }>;
}> {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return { parsed: 0, matched: 0, unmatched: 0, records: [] };
  }

  // Skip header line
  const dataLines = lines.slice(1);
  const records: Array<{ referenceId: string; amountPaid: number; paymentDate: string; matched: boolean }> = [];
  let matched = 0;
  let unmatched = 0;

  for (const line of dataLines) {
    const fields = line.split(',');
    // Expected format: reference_id, amount_paid, payment_date, bank_reference
    if (fields.length < 3) continue;

    const referenceId = fields[0].trim();
    const amountPaid = parseFloat(fields[1].trim());
    const paymentDate = fields[2].trim();

    // Check if charge exists
    const charge = await MonthlyCharge.findByPk(referenceId);
    const isMatched = !!charge;

    if (isMatched) matched++;
    else unmatched++;

    records.push({ referenceId, amountPaid, paymentDate, matched: isMatched });
  }

  return { parsed: records.length, matched, unmatched, records };
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

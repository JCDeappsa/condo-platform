import { MonthlyCharge } from './monthly-charges.model';

export function toChargeDTO(charge: MonthlyCharge) {
  const balance = Number(charge.amount) - Number(charge.paidAmount);
  const today = new Date();
  const dueDate = new Date(charge.dueDate);
  const daysOverdue = balance > 0 && dueDate < today
    ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    id: charge.id,
    unitId: charge.unitId,
    period: charge.period,
    description: charge.description,
    amount: Number(charge.amount),
    dueDate: charge.dueDate,
    status: charge.status,
    paidAmount: Number(charge.paidAmount),
    balance,
    daysOverdue,
    generatedAt: charge.generatedAt,
    unit: charge.unit
      ? { id: charge.unit.id, unitNumber: charge.unit.unitNumber }
      : null,
  };
}

export function toChargeListDTO(charges: MonthlyCharge[]) {
  return charges.map(toChargeDTO);
}

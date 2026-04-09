import { Payment } from './payments.model';
import { AccountMovement } from './account-movements.model';

export function toPaymentDTO(payment: Payment) {
  return {
    id: payment.id,
    unitId: payment.unitId,
    amount: Number(payment.amount),
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    bankReference: payment.bankReference,
    notes: payment.notes,
    receiptUrl: payment.receiptUrl,
    reconciled: payment.reconciled,
    reconciledAt: payment.reconciledAt,
    createdAt: payment.createdAt,
    unit: payment.unit
      ? { id: payment.unit.id, unitNumber: payment.unit.unitNumber }
      : null,
    recorder: payment.recorder
      ? { id: payment.recorder.id, firstName: payment.recorder.firstName, lastName: payment.recorder.lastName }
      : null,
  };
}

export function toPaymentListDTO(payments: Payment[]) {
  return payments.map(toPaymentDTO);
}

export function toMovementDTO(movement: AccountMovement) {
  return {
    id: movement.id,
    unitId: movement.unitId,
    monthlyChargeId: movement.monthlyChargeId,
    paymentId: movement.paymentId,
    movementType: movement.movementType,
    amount: Number(movement.amount),
    runningBalance: Number(movement.runningBalance),
    description: movement.description,
    createdAt: movement.createdAt,
  };
}

export function toMovementListDTO(movements: AccountMovement[]) {
  return movements.map(toMovementDTO);
}

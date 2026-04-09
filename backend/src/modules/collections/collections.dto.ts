import { AccountCollectionStatus } from './account-collection-status.model';
import { PaymentPromise } from './payment-promises.model';
import { CollectionNote } from './collection-notes.model';

export function toCollectionStatusDTO(status: AccountCollectionStatus) {
  return {
    id: status.id,
    unitId: status.unitId,
    totalOverdue: Number(status.totalOverdue),
    oldestOverdueDate: status.oldestOverdueDate,
    daysOverdue: status.daysOverdue,
    collectionStage: status.collectionStage,
    lastNotificationAt: status.lastNotificationAt,
    hasActivePromise: status.hasActivePromise,
    updatedAt: status.updatedAt,
    unit: status.unit ? { id: status.unit.id, unitNumber: status.unit.unitNumber } : null,
  };
}

export function toPromiseDTO(promise: PaymentPromise) {
  return {
    id: promise.id,
    unitId: promise.unitId,
    promisedAmount: Number(promise.promisedAmount),
    promisedDate: promise.promisedDate,
    status: promise.status,
    notes: promise.notes,
    createdBy: promise.creator
      ? { id: promise.creator.id, firstName: promise.creator.firstName, lastName: promise.creator.lastName }
      : null,
    resolvedAt: promise.resolvedAt,
    createdAt: promise.createdAt,
  };
}

export function toNoteDTO(note: CollectionNote) {
  return {
    id: note.id,
    unitId: note.unitId,
    note: note.note,
    author: note.author
      ? { id: note.author.id, firstName: note.author.firstName, lastName: note.author.lastName }
      : null,
    createdAt: note.createdAt,
  };
}

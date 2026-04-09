import { Vendor } from './vendors.model';
import { Expense } from './expenses.model';

export function toVendorDTO(vendor: Vendor) {
  return {
    id: vendor.id,
    communityId: vendor.communityId,
    name: vendor.name,
    contactName: vendor.contactName,
    phone: vendor.phone,
    email: vendor.email,
    taxId: vendor.taxId,
    category: vendor.category,
    isActive: vendor.isActive,
    notes: vendor.notes,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  };
}

export function toVendorListDTO(vendors: Vendor[]) {
  return vendors.map(toVendorDTO);
}

export function toExpenseDTO(expense: Expense) {
  return {
    id: expense.id,
    communityId: expense.communityId,
    vendorId: expense.vendorId,
    projectId: expense.projectId,
    category: expense.category,
    description: expense.description,
    amount: Number(expense.amount),
    expenseDate: expense.expenseDate,
    invoiceNumber: expense.invoiceNumber,
    receiptUrl: expense.receiptUrl,
    approvedBy: expense.approvedBy,
    vendor: expense.vendor ? { id: expense.vendor.id, name: expense.vendor.name } : null,
    project: expense.project ? { id: expense.project.id, title: expense.project.title } : null,
    approver: expense.approver ? { id: expense.approver.id, firstName: expense.approver.firstName, lastName: expense.approver.lastName } : null,
    createdAt: expense.createdAt,
  };
}

export function toExpenseListDTO(expenses: Expense[]) {
  return expenses.map(toExpenseDTO);
}

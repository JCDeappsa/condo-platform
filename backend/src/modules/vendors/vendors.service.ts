import { sequelize } from '../../config/database';
import { Vendor } from './vendors.model';
import { Expense } from './expenses.model';
import { Project } from '../projects/projects.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

const expenseIncludes = [
  { model: Vendor, as: 'vendor', attributes: ['id', 'name'] },
  { model: Project, as: 'project', attributes: ['id', 'title'] },
  { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'] },
];

export class VendorsService {
  // ── Vendors ──

  async createVendor(data: {
    name: string; contactName?: string | null; phone?: string | null;
    email?: string | null; taxId?: string | null; category?: string | null;
    isActive?: boolean; notes?: string | null;
  }) {
    return Vendor.create({
      communityId: env.defaultCommunityId,
      name: data.name,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      taxId: data.taxId || null,
      category: data.category || null,
      isActive: data.isActive ?? true,
      notes: data.notes || null,
    });
  }

  async findAllVendors(filters: { category?: string; isActive?: boolean }, page: number, limit: number) {
    const where: any = { communityId: env.defaultCommunityId };
    if (filters.category) where.category = filters.category;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const offset = (page - 1) * limit;
    const { rows, count } = await Vendor.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit, offset,
    });
    return { vendors: rows, total: count };
  }

  async findVendorById(id: string) {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) throw new HttpError(404, 'Proveedor no encontrado.');
    return vendor;
  }

  async updateVendor(id: string, data: Partial<{
    name: string; contactName: string | null; phone: string | null;
    email: string | null; taxId: string | null; category: string | null;
    isActive: boolean; notes: string | null;
  }>) {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) throw new HttpError(404, 'Proveedor no encontrado.');
    await vendor.update(data);
    return vendor;
  }

  async deleteVendor(id: string) {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) throw new HttpError(404, 'Proveedor no encontrado.');
    await vendor.destroy();
  }

  // ── Expenses ──

  async createExpense(data: {
    vendorId?: string | null; projectId?: string | null; category: string;
    description: string; amount: number; expenseDate: Date;
    invoiceNumber?: string | null; receiptUrl?: string | null; approvedBy?: string | null;
  }) {
    const transaction = await sequelize.transaction();
    try {
      const expense = await Expense.create({
        communityId: env.defaultCommunityId,
        vendorId: data.vendorId || null,
        projectId: data.projectId || null,
        category: data.category,
        description: data.description,
        amount: data.amount,
        expenseDate: data.expenseDate,
        invoiceNumber: data.invoiceNumber || null,
        receiptUrl: data.receiptUrl || null,
        approvedBy: data.approvedBy || null,
      }, { transaction });

      // Update project spent if linked
      if (data.projectId) {
        const project = await Project.findByPk(data.projectId, { transaction });
        if (project) {
          await project.update({
            spent: Number(project.spent) + data.amount,
          }, { transaction });
        }
      }

      await transaction.commit();

      return Expense.findByPk(expense.id, { include: expenseIncludes });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAllExpenses(filters: { vendorId?: string; projectId?: string; category?: string }, page: number, limit: number) {
    const where: any = { communityId: env.defaultCommunityId };
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.category) where.category = filters.category;

    const offset = (page - 1) * limit;
    const { rows, count } = await Expense.findAndCountAll({
      where,
      include: expenseIncludes,
      order: [['expense_date', 'DESC']],
      limit, offset,
    });
    return { expenses: rows, total: count };
  }

  async findExpenseById(id: string) {
    const expense = await Expense.findByPk(id, { include: expenseIncludes });
    if (!expense) throw new HttpError(404, 'Gasto no encontrado.');
    return expense;
  }

  async updateExpense(id: string, data: Partial<{
    vendorId: string | null; projectId: string | null; category: string;
    description: string; amount: number; expenseDate: Date;
    invoiceNumber: string | null; receiptUrl: string | null; approvedBy: string | null;
  }>) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new HttpError(404, 'Gasto no encontrado.');

    const transaction = await sequelize.transaction();
    try {
      const oldAmount = Number(expense.amount);
      const oldProjectId = expense.projectId;

      await expense.update(data, { transaction });

      const newAmount = data.amount !== undefined ? data.amount : oldAmount;
      const newProjectId = data.projectId !== undefined ? data.projectId : oldProjectId;

      // Update old project spent if project changed
      if (oldProjectId && oldProjectId !== newProjectId) {
        const oldProject = await Project.findByPk(oldProjectId, { transaction });
        if (oldProject) {
          await oldProject.update({ spent: Math.max(0, Number(oldProject.spent) - oldAmount) }, { transaction });
        }
      }

      // Update new project spent
      if (newProjectId) {
        const newProject = await Project.findByPk(newProjectId, { transaction });
        if (newProject) {
          if (oldProjectId === newProjectId) {
            // Same project, adjust difference
            await newProject.update({ spent: Number(newProject.spent) - oldAmount + newAmount }, { transaction });
          } else {
            // New project
            await newProject.update({ spent: Number(newProject.spent) + newAmount }, { transaction });
          }
        }
      }

      await transaction.commit();
      return Expense.findByPk(id, { include: expenseIncludes });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteExpense(id: string) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new HttpError(404, 'Gasto no encontrado.');

    const transaction = await sequelize.transaction();
    try {
      // Subtract from project spent
      if (expense.projectId) {
        const project = await Project.findByPk(expense.projectId, { transaction });
        if (project) {
          await project.update({ spent: Math.max(0, Number(project.spent) - Number(expense.amount)) }, { transaction });
        }
      }

      await expense.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const vendorsService = new VendorsService();

import bcrypt from 'bcryptjs';
import { sequelize } from './database';
import '../modules/roles/roles.model';
import '../modules/users/users.model';
import '../modules/units/units.model';
import { User } from '../modules/users/users.model';
import { Unit } from '../modules/units/units.model';

async function seed(): Promise<void> {
  await sequelize.authenticate();

  // Seed admin user
  const existingAdmin = await User.findOne({ where: { email: 'admin@condominio.com' } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await User.create({
      communityId: '00000000-0000-0000-0000-000000000001',
      roleId: '00000000-0000-0000-0000-000000000010', // administrator
      email: 'admin@condominio.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      phone: null,
    });
    console.log('Usuario administrador creado: admin@condominio.com / admin123');
  } else {
    console.log('Usuario administrador ya existe.');
  }

  // Seed sample maintenance user
  const existingMaint = await User.findOne({ where: { email: 'mantenimiento@condominio.com' } });
  if (!existingMaint) {
    const passwordHash = await bcrypt.hash('maint123', 12);
    await User.create({
      communityId: '00000000-0000-0000-0000-000000000001',
      roleId: '00000000-0000-0000-0000-000000000030', // maintenance
      email: 'mantenimiento@condominio.com',
      passwordHash,
      firstName: 'Carlos',
      lastName: 'Mantenimiento',
      phone: '5555-1234',
    });
    console.log('Usuario mantenimiento creado: mantenimiento@condominio.com / maint123');
  }

  // Seed sample board member
  const existingBoard = await User.findOne({ where: { email: 'junta@condominio.com' } });
  if (!existingBoard) {
    const passwordHash = await bcrypt.hash('board123', 12);
    await User.create({
      communityId: '00000000-0000-0000-0000-000000000001',
      roleId: '00000000-0000-0000-0000-000000000020', // board_member
      email: 'junta@condominio.com',
      passwordHash,
      firstName: 'María',
      lastName: 'Directiva',
      phone: '5555-5678',
    });
    console.log('Usuario junta directiva creado: junta@condominio.com / board123');
  }

  // Seed sample resident
  const existingResident = await User.findOne({ where: { email: 'residente@condominio.com' } });
  if (!existingResident) {
    const passwordHash = await bcrypt.hash('resident123', 12);
    await User.create({
      communityId: '00000000-0000-0000-0000-000000000001',
      roleId: '00000000-0000-0000-0000-000000000040', // resident
      email: 'residente@condominio.com',
      passwordHash,
      firstName: 'Juan',
      lastName: 'Residente',
      phone: '5555-9012',
    });
    console.log('Usuario residente creado: residente@condominio.com / resident123');
  }

  // Seed sample owner
  const existingOwner = await User.findOne({ where: { email: 'propietario@condominio.com' } });
  if (!existingOwner) {
    const passwordHash = await bcrypt.hash('owner123', 12);
    await User.create({
      communityId: '00000000-0000-0000-0000-000000000001',
      roleId: '00000000-0000-0000-0000-000000000050', // owner
      email: 'propietario@condominio.com',
      passwordHash,
      firstName: 'Pedro',
      lastName: 'Propietario',
      phone: '5555-3456',
    });
    console.log('Usuario propietario creado: propietario@condominio.com / owner123');
  }

  // Seed 60 units
  const existingUnits = await Unit.count();
  if (existingUnits === 0) {
    const units = [];

    // 58 houses (L-01 to L-58)
    for (let i = 1; i <= 58; i++) {
      units.push({
        communityId: '00000000-0000-0000-0000-000000000001',
        unitNumber: `C-${String(i).padStart(2, '0')}`,
        unitType: 'house',
        monthlyFee: 1500.00, // Q1,500 default monthly fee
        isOccupied: false,
      });
    }

    // Special units
    units.push({
      communityId: '00000000-0000-0000-0000-000000000001',
      unitNumber: 'GARITA',
      unitType: 'guard_house',
      monthlyFee: 0,
      isOccupied: true,
    });

    units.push({
      communityId: '00000000-0000-0000-0000-000000000001',
      unitNumber: 'CLUB',
      unitType: 'clubhouse',
      monthlyFee: 0,
      isOccupied: false,
    });

    await Unit.bulkCreate(units);
    console.log('60 unidades creadas (58 casas + garita + casa club).');
  } else {
    console.log(`Ya existen ${existingUnits} unidades.`);
  }

  console.log('Seed completado.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});

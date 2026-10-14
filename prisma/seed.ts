import { PrismaClient, LocationType, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Seeding Karachi Omnichannel Network...');

  // 1. Central Warehouse
  const centralWarehouse = await prisma.location.upsert({
    where: { code: 'CW-KHI-01' },
    update: {},
    create: {
      code: 'CW-KHI-01',
      name: 'Central Warehouse & Online Hub',
      type: LocationType.CENTRAL_WAREHOUSE,
      city: 'Karachi',
      address: 'Plot 48, Sector 15, Korangi Industrial Area, Karachi',
      phone: '+92 21 35051111',
      isActive: true,
    },
  });

  // 2. The Four Karachi Retail Outlets
  const branches = [
    {
      code: 'RET-KHI-01',
      name: 'Clifton Outlet (Park Towers/Block 5)',
      address: 'Shop 14, Block 5, Clifton, Karachi',
      phone: '+92 21 35831122',
      timings: '12:00 PM – 11:30 PM',
    },
    {
      code: 'RET-KHI-02',
      name: 'Tariq Road Outlet',
      address: 'Plot 112, Main Tariq Road, PECHS, Karachi',
      phone: '+92 21 34558833',
      timings: '12:00 PM – 11:30 PM',
    },
    {
      code: 'RET-KHI-03',
      name: 'Saddar Heritage Outlet',
      address: 'Zaibunnisa Street, Saddar, Karachi',
      phone: '+92 21 35684499',
      timings: '11:00 AM – 10:00 PM',
    },
    {
      code: 'RET-KHI-04',
      name: 'Gulshan-e-Iqbal Outlet (LuckyOne/Block 6)',
      address: 'Main Rashid Minhas Road, Gulshan-e-Iqbal, Karachi',
      phone: '+92 21 34982211',
      timings: '12:00 PM – 11:30 PM',
    },
  ];

  for (const b of branches) {
    await prisma.location.upsert({
      where: { code: b.code },
      update: {},
      create: {
        code: b.code,
        name: b.name,
        type: LocationType.RETAIL_BRANCH,
        city: 'Karachi',
        address: b.address,
        phone: b.phone,
        timings: b.timings,
        isActive: true,
      },
    });
  }

  // 3. Super Admin & Warehouse Operations Staff
  const passwordHash = await bcrypt.hash('RoyalStepHQ2026!', 12);

  await prisma.staffUser.upsert({
    where: { email: 'admin@royalstep.pk' },
    update: {},
    create: {
      name: 'Karachi HQ Super Admin',
      email: 'admin@royalstep.pk',
      passwordHash,
      role: Role.SUPER_ADMIN,
      locationId: centralWarehouse.id,
      isActive: true,
    },
  });

  // 4. Default Store Settings
  await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      brandName: 'Royal Step',
      tagline: 'Pure Handcrafted Leather Footwear',
      supportEmail: 'support@royalstep.pk',
      supportPhone: '+92 21 35890000',
      whatsappNumber: '923001234567',
      freeShippingThreshold: 4999,
      flatShippingRate: 200,
    },
  });

  console.log('✅ Karachi Central Warehouse & 4 Retail Branches Configured!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
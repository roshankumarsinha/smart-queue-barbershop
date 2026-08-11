import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo data so the frontend login works immediately. Idempotent (upserts).
async function main() {
  // Owner and shop reference each other (User.shopId <-> Shop.ownerId), so seed in
  // FK order: owner first (no shop), then the shop pointing at the owner, then link
  // the owner's default "active shop" back so the single-shop owner dashboard works.
  const owner = await prisma.user.upsert({
    where: { email: 'owner@shop.com' },
    update: {},
    create: {
      role: 'SHOP_OWNER',
      name: 'Shop Owner',
      email: 'owner@shop.com',
      passwordHash: await bcrypt.hash('secret123', 10),
    },
  });

  const shop = await prisma.shop.upsert({
    where: { id: 'demo-shop' },
    update: {},
    create: {
      id: 'demo-shop',
      name: 'Downtown Cuts',
      ownerId: owner.id,
      type: 'SALON',
      whatsappNumber: '+10000000000',
      address: '221B Baker Street',
      status: 'OPEN',
    },
  });

  await prisma.user.update({
    where: { id: owner.id },
    data: { shopId: shop.id },
  });

  const barber = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      role: 'BARBER_STAFF',
      name: 'Barber',
      phone: '9876543210',
      pinHash: await bcrypt.hash('1234', 10),
      shopId: shop.id,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartqueue.app' },
    update: {},
    create: {
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      email: 'admin@smartqueue.app',
      passwordHash: await bcrypt.hash('admin123', 10),
    },
  });

  console.log('Seeded:');
  console.log(`  Shop:   ${shop.name} (${shop.id})`);
  console.log(`  Owner:  owner@shop.com / secret123`);
  console.log(`  Barber: 9876543210 / 1234`);
  console.log(`  Admin:  admin@smartqueue.app / admin123`);
  void owner;
  void barber;
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { shopDomain: 'demo-store.myshopify.com' },
    update: {},
    create: {
      name: 'Demo Store',
      shopDomain: 'demo-store.myshopify.com',
      accessToken: 'demo-access-token-replace-with-real',
      isActive: true,
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create a demo user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Demo Admin',
      tenantId: tenant.id,
      role: 'admin',
    },
  });

  console.log('✅ Created user:', user.email);
  console.log('📧 Login credentials:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: password123');

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


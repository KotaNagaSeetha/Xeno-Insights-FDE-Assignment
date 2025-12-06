/**
 * Realistic Seed Script
 * 
 * Generates realistic demo data:
 *   - 1 demo tenant (if none exists)
 *   - 50 customers with randomized names/emails
 *   - 30 products with randomized titles, SKUs, and prices
 *   - ~300 orders distributed over last 180 days
 *   - Order line items stored in CustomEvents
 *   - Customer totalSpent computed and updated
 * 
 * Usage:
 *   npm run db:seed:real
 * 
 * Warning: Running multiple times will create duplicate data.
 * Use with a fresh database or reset first: npx prisma migrate reset
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample data arrays
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams'
];

const productTitles = [
  'Wireless Headphones', 'Smart Watch', 'Laptop Stand', 'USB-C Cable', 'Phone Case',
  'Bluetooth Speaker', 'Tablet Stand', 'Keyboard', 'Mouse', 'Webcam',
  'Monitor Stand', 'Desk Lamp', 'Cable Organizer', 'Laptop Sleeve', 'Power Bank',
  'Wireless Charger', 'HDMI Cable', 'USB Hub', 'Microphone', 'Headset',
  'Gaming Mouse Pad', 'Monitor Arm', 'Desk Mat', 'Cable Clips', 'Laptop Cooler',
  'External Hard Drive', 'SSD Drive', 'Memory Card', 'Adapter', 'Dongle'
];

const productTypes = ['Electronics', 'Accessories', 'Computer', 'Audio', 'Mobile'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com'];
  const variants = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${randomInt(1, 999)}`,
    `${lastName.toLowerCase()}${randomInt(1, 999)}`
  ];
  return `${randomElement(variants)}@${randomElement(domains)}`;
}

function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  date.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return date;
}

async function main() {
  console.log('🌱 Starting realistic seed...');

  // Check if tenant exists, create if not
  let tenant = await prisma.tenant.findFirst({
    where: { shopDomain: 'demo-shop.myshopify.com' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Shop',
        shopDomain: 'demo-shop.myshopify.com',
        accessToken: 'demo_token',
        isActive: true
      }
    });
    console.log('✅ Created demo tenant:', tenant.id);
  } else {
    console.log('ℹ️  Using existing tenant:', tenant.id);
  }

  const tenantId = tenant.id;

  // Create 50 customers
  console.log('📦 Creating 50 customers...');
  const customers = [];
  for (let i = 0; i < 50; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const customer = await prisma.customer.create({
      data: {
        shopifyId: `shopify_customer_${i + 1}`,
        tenantId,
        email: randomEmail(firstName, lastName),
        firstName,
        lastName,
        phone: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
        totalSpent: 0,
        ordersCount: 0,
        acceptsMarketing: Math.random() > 0.5,
        createdAt: randomDate(365)
      }
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers`);

  // Create 30 products
  console.log('📦 Creating 30 products...');
  const products = [];
  for (let i = 0; i < 30; i++) {
    const title = randomElement(productTitles);
    const product = await prisma.product.create({
      data: {
        shopifyId: `shopify_product_${i + 1}`,
        tenantId,
        title: `${title} ${i + 1}`,
        handle: `${title.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
        vendor: randomElement(['TechCorp', 'GadgetPro', 'ElectroMax', 'SmartDevices']),
        productType: randomElement(productTypes),
        status: 'active',
        price: randomFloat(9.99, 299.99),
        compareAtPrice: randomFloat(299.99, 499.99),
        inventoryQuantity: randomInt(0, 100),
        createdAt: randomDate(180)
      }
    });
    products.push(product);
  }
  console.log(`✅ Created ${products.length} products`);

  // Create ~300 orders
  console.log('📦 Creating ~300 orders...');
  let orderCount = 0;
  const customerSpent = new Map();

  for (let i = 0; i < 300; i++) {
    const customer = Math.random() > 0.1 ? randomElement(customers) : null; // 10% guest orders
    const orderDate = randomDate(180);
    
    // 1-5 line items per order
    const numItems = randomInt(1, 5);
    const lineItems = [];
    let orderTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const product = randomElement(products);
      const quantity = randomInt(1, 5);
      const price = product.price || 0;
      const lineTotal = price * quantity;
      orderTotal += lineTotal;

      lineItems.push({
        productId: product.id,
        quantity,
        price
      });
    }

    // Add tax (approx 8%)
    const subtotal = orderTotal;
    const tax = orderTotal * 0.08;
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        shopifyId: `shopify_order_${i + 1}`,
        tenantId,
        customerId: customer?.id || null,
        orderNumber: `#${1000 + i}`,
        financialStatus: randomElement(['paid', 'pending', 'paid', 'paid', 'refunded']),
        fulfillmentStatus: randomElement(['fulfilled', 'unfulfilled', 'fulfilled', 'partial']),
        totalPrice: total,
        subtotalPrice: subtotal,
        totalTax: tax,
        currency: 'USD',
        orderDate,
        createdAt: orderDate
      }
    });

    // Store line items in CustomEvents
    for (const item of lineItems) {
      await prisma.customEvent.create({
        data: {
          tenantId,
          eventType: 'order_line_item',
          customerId: customer?.id || null,
          orderId: order.id,
          productId: item.productId,
          metadata: JSON.stringify({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })
        }
      });
    }

    // Track customer spending
    if (customer) {
      const current = customerSpent.get(customer.id) || 0;
      customerSpent.set(customer.id, current + total);
    }

    orderCount++;
  }

  console.log(`✅ Created ${orderCount} orders`);

  // Update customer totalSpent
  console.log('📦 Updating customer totalSpent...');
  for (const [customerId, total] of customerSpent.entries()) {
    const ordersCount = await prisma.order.count({
      where: { customerId, tenantId }
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: total,
        ordersCount
      }
    });
  }
  console.log(`✅ Updated ${customerSpent.size} customers`);

  console.log('\n✨ Realistic seed completed!');
  console.log(`📊 Tenant ID: ${tenantId}`);
  console.log(`👥 Customers: ${customers.length}`);
  console.log(`📦 Products: ${products.length}`);
  console.log(`🛒 Orders: ${orderCount}`);
  console.log(`📈 Line items stored in CustomEvents`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


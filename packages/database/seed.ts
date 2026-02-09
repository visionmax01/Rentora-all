import { PrismaClient, UserRole, PropertyType, ServiceCategory } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rentora.com' },
    update: {},
    create: {
      email: 'admin@rentora.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo user
  const userPassword = await hash('user123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@rentora.com' },
    update: {},
    create: {
      email: 'demo@rentora.com',
      password: userPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.USER,
      emailVerified: true,
    },
  });
  console.log('✅ Demo user created:', demoUser.email);

  // Create host user
  const hostPassword = await hash('host123', 10);
  const hostUser = await prisma.user.upsert({
    where: { email: 'host@rentora.com' },
    update: {},
    create: {
      email: 'host@rentora.com',
      password: hostPassword,
      firstName: 'Demo',
      lastName: 'Host',
      role: UserRole.HOST,
      emailVerified: true,
    },
  });
  console.log('✅ Host user created:', hostUser.email);

  // Create service categories
  const serviceCategories = [
    { name: 'Electrical', description: 'Electrical repairs and installations', icon: '⚡' },
    { name: 'Plumbing', description: 'Plumbing services and repairs', icon: '🔧' },
    { name: 'Cleaning', description: 'Home and office cleaning services', icon: '🧹' },
    { name: 'Doctor', description: 'Medical consultation and services', icon: '👨‍⚕️' },
    { name: 'Carpentry', description: 'Furniture and woodwork services', icon: '🔨' },
    { name: 'Painting', description: 'Interior and exterior painting', icon: '🎨' },
    { name: 'AC Repair', description: 'Air conditioning services', icon: '❄️' },
    { name: 'Pest Control', description: 'Pest control and fumigation', icon: '🐜' },
  ];

  for (const category of serviceCategories) {
    await prisma.serviceCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log('✅ Service categories created');

  // Create marketplace categories
  const marketplaceCategories = [
    { name: 'Mobile Phones', slug: 'mobile-phones', description: 'Smartphones and accessories' },
    { name: 'Laptops & Computers', slug: 'laptops-computers', description: 'Laptops, desktops, and accessories' },
    { name: 'Electronics', slug: 'electronics', description: 'TVs, cameras, and electronics' },
    { name: 'Home Appliances', slug: 'home-appliances', description: 'Fridges, washing machines, etc.' },
    { name: 'Furniture', slug: 'furniture', description: 'Home and office furniture' },
    { name: 'Vehicles', slug: 'vehicles', description: 'Cars, bikes, and scooters' },
    { name: 'Books & Study', slug: 'books-study', description: 'Books and educational materials' },
    { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sports equipment and gear' },
  ];

  for (const category of marketplaceCategories) {
    await prisma.marketplaceCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('✅ Marketplace categories created');

  // Create pages
  const pages = [
    {
      slug: 'about',
      title: 'About Us',
      content: 'Rentora Nepal is your trusted platform for property rentals, home services, and marketplace.',
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      content: 'Get in touch with us for any queries or support.',
    },
    {
      slug: 'terms',
      title: 'Terms of Service',
      content: 'Please read our terms of service carefully.',
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      content: 'Your privacy is important to us.',
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log('✅ Pages created');

  // Create sample properties
  const sampleProperties = [
    {
      title: 'Modern 2BHK Apartment in Kathmandu',
      description: 'Spacious 2 bedroom apartment with modern amenities, located in the heart of Kathmandu.',
      type: PropertyType.APARTMENT,
      price: 35000,
      bedrooms: 2,
      bathrooms: 2,
      areaSqFt: 1200,
      furnished: true,
      address: 'Thamel, Kathmandu',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      latitude: 27.7172,
      longitude: 85.3240,
      amenities: ['WiFi', 'Parking', 'AC', 'Gym', 'Security'],
      ownerId: hostUser.id,
    },
    {
      title: 'Cozy Room in Lalitpur',
      description: 'Affordable room for rent with shared kitchen and bathroom.',
      type: PropertyType.ROOM,
      price: 8000,
      bedrooms: 1,
      bathrooms: 1,
      areaSqFt: 200,
      furnished: false,
      address: 'Patan, Lalitpur',
      city: 'Lalitpur',
      state: 'Bagmati',
      zipCode: '44700',
      latitude: 27.6667,
      longitude: 85.3167,
      amenities: ['WiFi', 'Water Supply'],
      ownerId: hostUser.id,
    },
    {
      title: 'Luxury Villa in Bhaktapur',
      description: 'Beautiful villa with garden and parking space.',
      type: PropertyType.VILLA,
      price: 120000,
      bedrooms: 4,
      bathrooms: 3,
      areaSqFt: 3000,
      furnished: true,
      address: 'Bhaktapur Durbar Square Area',
      city: 'Bhaktapur',
      state: 'Bagmati',
      zipCode: '44800',
      latitude: 27.6710,
      longitude: 85.4298,
      amenities: ['Garden', 'Parking', 'Security', 'Furnished', 'AC'],
      ownerId: hostUser.id,
    },
  ];

  for (const property of sampleProperties) {
    await prisma.property.create({
      data: property,
    });
  }
  console.log('✅ Sample properties created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
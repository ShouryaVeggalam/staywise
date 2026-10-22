import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Staywise database...');

  // Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@staywise.demo' },
    update: {},
    create: {
      email: 'admin@staywise.demo',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { email: 'staff@staywise.demo' },
    update: {},
    create: {
      email: 'staff@staywise.demo',
      name: 'Front Desk Staff',
      password: staffPassword,
      role: 'FRONT_DESK',
    },
  });

  // Room Types
  const deluxe = await prisma.roomType.upsert({
    where: { name: 'Deluxe' },
    update: {},
    create: {
      name: 'Deluxe',
      description: 'Spacious room with city view',
      baseRate: 150.00,
      capacity: 2,
      amenities: JSON.stringify(['WiFi', 'TV', 'Mini Bar', 'AC']),
    },
  });

  const suite = await prisma.roomType.upsert({
    where: { name: 'Suite' },
    update: {},
    create: {
      name: 'Suite',
      description: 'Luxury suite with living area',
      baseRate: 250.00,
      capacity: 4,
      amenities: JSON.stringify(['WiFi', 'TV', 'Mini Bar', 'AC', 'Jacuzzi']),
    },
  });

  const standard = await prisma.roomType.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      description: 'Comfortable standard room',
      baseRate: 100.00,
      capacity: 2,
      amenities: JSON.stringify(['WiFi', 'TV', 'AC']),
    },
  });

  // Rooms
  const roomsData = [
    { number: '101', floor: 1, roomTypeId: standard.id, nightlyRate: 100 },
    { number: '102', floor: 1, roomTypeId: standard.id, nightlyRate: 100 },
    { number: '201', floor: 2, roomTypeId: deluxe.id, nightlyRate: 150 },
    { number: '202', floor: 2, roomTypeId: deluxe.id, nightlyRate: 150 },
    { number: '203', floor: 2, roomTypeId: deluxe.id, nightlyRate: 150 },
    { number: '301', floor: 3, roomTypeId: suite.id, nightlyRate: 250 },
    { number: '302', floor: 3, roomTypeId: suite.id, nightlyRate: 250 },
    { number: '401', floor: 4, roomTypeId: deluxe.id, nightlyRate: 160 },
    { number: '402', floor: 4, roomTypeId: standard.id, nightlyRate: 110 },
    { number: '501', floor: 5, roomTypeId: suite.id, nightlyRate: 280 },
  ];

  for (const r of roomsData) {
    await prisma.room.upsert({
      where: { number: r.number },
      update: {},
      create: r,
    });
  }

  // Guests
  const guestsData = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@demo.com', phone: '555-0101' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@demo.com', phone: '555-0102' },
    { firstName: 'Alice', lastName: 'Johnson', email: 'alice.j@demo.com', phone: '555-0103' },
    { firstName: 'Bob', lastName: 'Williams', email: 'bob.w@demo.com', phone: '555-0104' },
    { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.b@demo.com', phone: '555-0105' },
    { firstName: 'Diana', lastName: 'Prince', email: 'diana.p@demo.com', phone: '555-0106' },
    { firstName: 'Eve', lastName: 'Davis', email: 'eve.d@demo.com', phone: '555-0107' },
    { firstName: 'Frank', lastName: 'Miller', email: 'frank.m@demo.com', phone: '555-0108' },
  ];

  const guests = [];
  for (const g of guestsData) {
    const guest = await prisma.guest.upsert({
      where: { email: g.email },
      update: {},
      create: g,
    });
    guests.push(guest);
  }

  const allRooms = await prisma.room.findMany();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const past = new Date(today);
  past.setDate(today.getDate() - 3);

  if (allRooms[0] && guests[0]) {
    await prisma.reservation.upsert({
      where: { reference: 'SW-DEMO-001' },
      update: {},
      create: {
        reference: 'SW-DEMO-001',
        guestId: guests[0].id,
        roomId: allRooms[0].id,
        checkIn: past,
        checkOut: tomorrow,
        adults: 2,
        status: 'CHECKED_IN',
        nightlyRate: allRooms[0].nightlyRate,
        nights: 4,
        subtotal: Number(allRooms[0].nightlyRate) * 4,
        taxAmount: Number(allRooms[0].nightlyRate) * 4 * 0.1,
        totalAmount: Number(allRooms[0].nightlyRate) * 4 * 1.1,
      },
    });
  }

  if (allRooms[2] && guests[1]) {
    await prisma.reservation.upsert({
      where: { reference: 'SW-DEMO-002' },
      update: {},
      create: {
        reference: 'SW-DEMO-002',
        guestId: guests[1].id,
        roomId: allRooms[2].id,
        checkIn: nextWeek,
        checkOut: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        adults: 1,
        status: 'CONFIRMED',
        nightlyRate: allRooms[2].nightlyRate,
        nights: 3,
        subtotal: Number(allRooms[2].nightlyRate) * 3,
        taxAmount: Number(allRooms[2].nightlyRate) * 3 * 0.1,
        totalAmount: Number(allRooms[2].nightlyRate) * 3 * 1.1,
      },
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

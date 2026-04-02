import { PrismaClient, BookingStatus, CourtType, Role } from "@prisma/client";
import { hashPassword } from "../src/shared/hash";

const prisma = new PrismaClient();

const toMinutes = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / 60000);

const addMinutes = (time: Date, minutes: number): Date =>
  new Date(time.getTime() + minutes * 60000);

const addHours = (time: Date, hours: number): Date =>
  new Date(time.getTime() + hours * 60 * 60000);

const seed = async () => {
  const existingCourts = await prisma.court.count();
  if (existingCourts === 0) {
    await prisma.court.createMany({
      data: [
        { name: "Court A", type: CourtType.SINGLE, basePrice: 120000 },
        { name: "Court B", type: CourtType.DOUBLE, basePrice: 150000 },
        { name: "Court C", type: CourtType.SINGLE, basePrice: 110000 },
      ],
    });
  }

  const createdCourts = await prisma.court.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (createdCourts.length === 0) {
    console.log("No courts created, skipping bookings.");
    return;
  }

  const now = new Date();

  const courtA = createdCourts[0];
  const courtB = createdCourts[1] ?? createdCourts[0];

  const seedUsername = "customer.seed";
  const seedPassword = "Password123!";
  const seedPasswordHash = await hashPassword(seedPassword);

  const customer = await prisma.user.upsert({
    where: { username: seedUsername },
    update: {
      passwordHash: seedPasswordHash,
      fullName: "Seed Customer",
      phone: "+84900000000",
      email: "customer.seed@smartbadminton.local",
      role: Role.CUSTOMER,
    },
    create: {
      username: seedUsername,
      passwordHash: seedPasswordHash,
      fullName: "Seed Customer",
      phone: "+84900000000",
      email: "customer.seed@smartbadminton.local",
      role: Role.CUSTOMER,
    },
  });

  const bookingSlots = [
    {
      courtId: courtA.id,
      // Cancel >=24h before startTime => refund 70%
      startTime: addHours(now, 30),
      endTime: addHours(now, 32),
      status: BookingStatus.PAID,
    },
    {
      courtId: courtB.id,
      // Cancel <24h before startTime => no refund
      startTime: addHours(now, 12),
      endTime: addHours(now, 13.5),
      status: BookingStatus.PAID,
    },
    {
      courtId: courtB.id,
      // Non-cancellable status sample
      startTime: addHours(now, 36),
      endTime: addHours(now, 37),
      status: BookingStatus.PENDING_PAYMENT,
    },
  ];

  const bookings = bookingSlots.map((slot) => {
    const durationMinutes = toMinutes(slot.startTime, slot.endTime);
    const court = slot.courtId === courtA.id ? courtA : courtB;
    const unitPrice = court.basePrice;
    const totalPrice = Math.round((unitPrice * durationMinutes) / 60);

    return {
      ...slot,
      userId: customer.id,
      durationMinutes,
      unitPrice,
      totalPrice,
      expiresAt: addMinutes(slot.startTime, 15),
    };
  });

  const existingBookings = await prisma.booking.count();
  if (existingBookings === 0) {
    await prisma.booking.createMany({
      data: bookings,
    });
  }

  console.log("Seed user credentials:");
  console.log(`- username: ${seedUsername}`);
  console.log(`- password: ${seedPassword}`);
  console.log(
    `Seed completed: ${createdCourts.length} courts, ${existingBookings === 0 ? 3 : 0} bookings.`,
  );
};

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

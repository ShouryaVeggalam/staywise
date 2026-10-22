import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { guest: true, room: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: reservations });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, roomId, checkIn, checkOut, adults = 1, children = 0 } = body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const reservation = await prisma.$transaction(async (tx) => {
      const conflicting = await tx.reservation.findFirst({
        where: {
          roomId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });
      if (conflicting) throw new Error('ROOM_UNAVAILABLE');

      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw new Error('ROOM_NOT_FOUND');

      const reference = `SW-${Date.now().toString(36).toUpperCase()}`;
      const subtotal = Number(room.nightlyRate) * nights;
      const taxAmount = subtotal * 0.1;

      return tx.reservation.create({
        data: {
          reference,
          guestId,
          roomId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults,
          children,
          status: 'CONFIRMED',
          nightlyRate: room.nightlyRate,
          nights,
          subtotal,
          taxAmount,
          totalAmount: subtotal + taxAmount,
        },
      });
    });

    return NextResponse.json({ success: true, data: reservation }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'ROOM_UNAVAILABLE') {
      return NextResponse.json({ error: 'Room no longer available' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}

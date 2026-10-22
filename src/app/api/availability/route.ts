import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const adults = parseInt(searchParams.get('adults') || '1');

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'checkIn and checkOut required' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const rooms = await prisma.room.findMany({
      where: {
        status: 'AVAILABLE',
        roomType: { capacity: { gte: adults } },
        reservations: {
          none: {
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        },
      },
      include: { roomType: true },
    });

    const results = rooms.map((r) => ({
      id: r.id,
      number: r.number,
      floor: r.floor,
      category: r.roomType.name,
      capacity: r.roomType.capacity,
      nightlyRate: Number(r.nightlyRate),
      nights,
      estimatedTotal: Number(r.nightlyRate) * nights,
    }));

    return NextResponse.json({ success: true, data: results, nights });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

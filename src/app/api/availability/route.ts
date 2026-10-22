import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseDate(value: string | null) {
  if (!value) return null;
  // Accept YYYY-MM-DD as a hotel-local calendar date without shifting it via UTC.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
    return date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkInRaw = searchParams.get('checkIn');
    const checkOutRaw = searchParams.get('checkOut');
    const adults = Number(searchParams.get('adults') || '1');

    if (!checkInRaw || !checkOutRaw) {
      return NextResponse.json({ success: false, error: 'Please provide both check-in and check-out dates.' }, { status: 400 });
    }
    const checkInDate = parseDate(checkInRaw);
    const checkOutDate = parseDate(checkOutRaw);
    if (!checkInDate || !checkOutDate) {
      return NextResponse.json({ success: false, error: 'One or both dates are invalid. Select dates from the calendar and try again.' }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ success: false, error: 'Check-out must be after check-in.' }, { status: 400 });
    }
    if (!Number.isInteger(adults) || adults < 1 || adults > 20) {
      return NextResponse.json({ success: false, error: 'Adults must be a whole number between 1 and 20.' }, { status: 400 });
    }

    const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
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
        maintenances: {
          none: {
            status: 'ACTIVE',
            startDate: { lt: checkOutDate },
            OR: [{ endDate: null }, { endDate: { gt: checkInDate } }],
          },
        },
      },
      include: { roomType: true },
      orderBy: [{ nightlyRate: 'asc' }, { number: 'asc' }],
    });

    const results = rooms.map((room) => ({
      id: room.id,
      number: room.number,
      floor: room.floor,
      category: room.roomType.name,
      capacity: room.roomType.capacity,
      nightlyRate: Number(room.nightlyRate),
      nights,
      estimatedTotal: Number(room.nightlyRate) * nights,
    }));

    return NextResponse.json({ success: true, data: results, nights, count: results.length }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Availability query failed:', error);
    return NextResponse.json({ success: false, error: 'Availability could not be loaded. Check database connectivity and server logs.' }, { status: 500 });
  }
}

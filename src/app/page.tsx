import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [totalRooms, activeReservations, totalGuests] = await Promise.all([
    prisma.room.count(),
    prisma.reservation.count({ where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } } }),
    prisma.guest.count(),
  ]);

  return { totalRooms, activeReservations, totalGuests };
}

export default async function Dashboard() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-slate-500">Total Rooms</p><p className="text-2xl font-semibold">{data.totalRooms}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-slate-500">Active Reservations</p><p className="text-2xl font-semibold">{data.activeReservations}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-slate-500">Guests</p><p className="text-2xl font-semibold">{data.totalGuests}</p></div>
      </div>
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      totalRooms,
      availableRooms,
      activeReservations,
      todayArrivals,
      todayDepartures,
      totalPayments,
      outstanding,
      totalGuests,
      recentReservations,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({
        where: {
          status: 'AVAILABLE',
          reservations: {
            none: {
              status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
              checkIn: { lt: tomorrow },
              checkOut: { gt: today },
            },
          },
        },
      }),
      prisma.reservation.count({
        where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } },
      }),
      prisma.reservation.findMany({
        where: {
          checkIn: { gte: today, lt: tomorrow },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
        include: { guest: true, room: true },
        take: 10,
      }),
      prisma.reservation.findMany({
        where: {
          checkOut: { gte: today, lt: tomorrow },
          status: 'CHECKED_IN',
        },
        include: { guest: true, room: true },
        take: 10,
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.reservation.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      prisma.guest.count(),
      prisma.reservation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { guest: true, room: true },
      }),
    ]);

    const totalPaid = totalPayments._sum.amount || 0;
    const totalBilled = outstanding._sum.totalAmount || 0;
    const outstandingBalance = Number(totalBilled) - Number(totalPaid);

    return {
      totalRooms,
      availableRooms,
      activeReservations,
      todayArrivals: todayArrivals.length,
      todayDepartures: todayDepartures.length,
      paymentsCollected: Number(totalPaid),
      outstandingBalances: outstandingBalance,
      registeredGuests: totalGuests,
      arrivals: todayArrivals,
      departures: todayDepartures,
      recent: recentReservations,
      dbReady: true,
    };
  } catch (error) {
    console.error('Dashboard query failed (tables may not exist yet):', error);
    return {
      totalRooms: 0,
      availableRooms: 0,
      activeReservations: 0,
      todayArrivals: 0,
      todayDepartures: 0,
      paymentsCollected: 0,
      outstandingBalances: 0,
      registeredGuests: 0,
      arrivals: [],
      departures: [],
      recent: [],
      dbReady: false,
    };
  }
}

export default async function Dashboard() {
  const data = await getDashboardData();

  const metrics = [
    { label: 'Total Rooms', value: data.totalRooms },
    { label: 'Available Today', value: data.availableRooms },
    { label: 'Active Reservations', value: data.activeReservations },
    { label: "Today's Arrivals", value: data.todayArrivals },
    { label: "Today's Departures", value: data.todayDepartures },
    { label: 'Payments Collected', value: `$${data.paymentsCollected.toFixed(2)}` },
    { label: 'Outstanding', value: `$${data.outstandingBalances.toFixed(2)}` },
    { label: 'Guests', value: data.registeredGuests },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">{m.label}</p>
            <p className="text-2xl font-semibold mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Today's Arrivals</h2>
          {data.arrivals.length === 0 ? (
            <p className="text-slate-500 text-sm">No arrivals today</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Guest</th>
                  <th>Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.arrivals.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2">{a.guest.firstName} {a.guest.lastName}</td>
                    <td>{a.room.number}</td>
                    <td><span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Today's Departures</h2>
          {data.departures.length === 0 ? (
            <p className="text-slate-500 text-sm">No departures today</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Guest</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {data.departures.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2">{d.guest.firstName} {d.guest.lastName}</td>
                    <td>{d.room.number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Recent Reservations</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2">Ref</th>
              <th>Guest</th>
              <th>Room</th>
              <th>Dates</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{r.reference}</td>
                <td>{r.guest.firstName} {r.guest.lastName}</td>
                <td>{r.room.number}</td>
                <td>{format(r.checkIn, 'MMM d')} - {format(r.checkOut, 'MMM d')}</td>
                <td><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

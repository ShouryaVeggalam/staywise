import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  BedDouble, CalendarCheck, Users, ArrowUpRight, ArrowRight, Wallet,
  UserCheck, CalendarDays, Activity, RefreshCw, Plus
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      totalRooms, activeReservations, totalGuests, arrivalRows, departureRows,
      payments, billed, recent, rooms
    ] = await Promise.all([
      prisma.room.count(),
      prisma.reservation.count({ where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } } }),
      prisma.guest.count(),
      prisma.reservation.findMany({
        where: { checkIn: { gte: today, lt: tomorrow }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        include: { guest: true, room: true }, orderBy: { checkIn: 'asc' }, take: 6,
      }),
      prisma.reservation.findMany({
        where: { checkOut: { gte: today, lt: tomorrow }, status: 'CHECKED_IN' },
        include: { guest: true, room: true }, orderBy: { checkOut: 'asc' }, take: 6,
      }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.reservation.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      prisma.reservation.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { guest: true, room: true } }),
      prisma.room.findMany({ include: { roomType: true, reservations: { where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] }, checkIn: { lt: tomorrow }, checkOut: { gt: today } }, take: 1 } }, take: 5, orderBy: { number: 'asc' } }),
    ]);

    const paid = Number(payments._sum.amount ?? 0);
    const total = Number(billed._sum.totalAmount ?? 0);
    const blocked = rooms.filter(r => r.status !== 'AVAILABLE' || r.reservations.length > 0).length;

    return {
      dbReady: true, totalRooms, activeReservations, totalGuests, arrivals: arrivalRows,
      departures: departureRows, recent, rooms, availableRooms: Math.max(0, totalRooms - blocked),
      paymentsCollected: paid, outstandingBalances: Math.max(0, total - paid),
    };
  } catch (error) {
    console.error('Staywise dashboard database query failed:', error);
    return { dbReady: false, totalRooms: 0, activeReservations: 0, totalGuests: 0, arrivals: [], departures: [], recent: [], rooms: [], availableRooms: 0, paymentsCollected: 0, outstandingBalances: 0 };
  }
}

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: Date) => format(value, 'dd MMM');

function Status({ value }: { value: string }) {
  return <span className={`status-pill status-${value.toLowerCase()}`}>{value.replaceAll('_', ' ')}</span>;
}

export default async function Dashboard() {
  const data = await getDashboardData();

  const metrics = [
    { label: 'Total rooms', value: data.dbReady ? data.totalRooms.toString() : '—', foot: 'Physical room inventory', color: '#c89543', icon: BedDouble },
    { label: 'Available today', value: data.dbReady ? data.availableRooms.toString() : '—', foot: 'Ready for a new stay', color: '#20a36b', icon: CalendarCheck },
    { label: 'Active reservations', value: data.dbReady ? data.activeReservations.toString() : '—', foot: 'Pending, confirmed or in-house', color: '#4285ee', icon: CalendarDays },
    { label: 'Registered guests', value: data.dbReady ? data.totalGuests.toString() : '—', foot: 'Guest directory', color: '#8c70db', icon: Users },
    { label: 'Payments collected', value: data.dbReady ? money(data.paymentsCollected) : '—', foot: 'Recorded completed payments', color: '#20a36b', icon: Wallet },
    { label: 'Outstanding balance', value: data.dbReady ? money(data.outstandingBalances) : '—', foot: 'Estimated unpaid amount', color: '#e16a5c', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <header className="page-heading">
        <div>
          <div className="eyebrow">OVERVIEW / OPERATIONS</div>
          <h1 className="mt-2">Good evening.</h1>
          <p>Your hotel, at a glance. Here is what is happening today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:block rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Reporting date</div>
            <div className="text-sm font-semibold mt-1">{format(new Date(), 'EEE, dd MMM yyyy')}</div>
          </div>
          <Link href="/availability" className="btn"><RefreshCw size={14}/> Availability</Link>
          <Link href="/book" className="btn btn-primary"><Plus size={15}/> New booking</Link>
        </div>
      </header>

      {!data.dbReady && <div className="notice notice-error"><strong>Database query failed.</strong> Dashboard values are unavailable. Check the deployed environment variables and Vercel function logs; zeros are not being presented as real metrics.</div>}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return <div key={m.label} className="metric-card" style={{ '--metric-color': m.color } as React.CSSProperties}>
            <div className="flex items-center justify-between gap-3">
              <p className="metric-label">{m.label}</p>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center"><Icon size={15}/></div>
            </div>
            <p className="metric-value">{m.value}</p>
            <p className="metric-foot">{m.foot}</p>
          </div>;
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <div className="panel overflow-hidden">
          <div className="panel-head">
            <div><h2>Today at the front desk</h2><p>Arrivals scheduled for today</p></div>
            <Link href="/reservations" className="text-xs font-semibold text-[#a6762c] flex items-center gap-1">All reservations <ArrowUpRight size={14}/></Link>
          </div>
          {data.arrivals.length ? <div className="overflow-x-auto"><table className="data-table">
            <thead><tr><th>Guest</th><th>Room</th><th>Arrival</th><th>Status</th></tr></thead>
            <tbody>{data.arrivals.map(a => <tr key={a.id}><td><div className="font-semibold text-slate-800">{a.guest.firstName} {a.guest.lastName}</div><div className="text-[10px] text-slate-400">{a.reference}</div></td><td>{a.room.number}</td><td>{format(a.checkIn, 'hh:mm a')}</td><td><Status value={a.status}/></td></tr>)}</tbody>
          </table></div> : <div className="empty-state"><div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><UserCheck size={18}/></div><strong>No arrivals scheduled today</strong><span className="text-xs">New arrivals will appear here automatically.</span></div>}
        </div>

        <div className="panel overflow-hidden">
          <div className="panel-head"><div><h2>Room inventory</h2><p>Availability and operational status</p></div><Link href="/rooms" className="text-xs font-semibold text-[#a6762c] flex items-center gap-1">Manage <ArrowUpRight size={14}/></Link></div>
          {data.rooms.length ? <div className="divide-y divide-slate-100">{data.rooms.map(room => {
            const busy = room.reservations.length > 0;
            const status = room.status !== 'AVAILABLE' ? room.status : busy ? 'OCCUPIED' : 'AVAILABLE';
            return <div key={room.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#fbf4e8] text-[#a6762c] flex items-center justify-center"><BedDouble size={17}/></div>
              <div className="min-w-0 flex-1"><div className="font-semibold text-sm">Room {room.number}</div><div className="text-[11px] text-slate-500">{room.roomType.name} · Floor {room.floor}</div></div>
              <div className="text-right"><Status value={status}/><div className="mt-1 text-[10px] text-slate-400">{money(Number(room.nightlyRate))}/night</div></div>
            </div>;
          })}</div> : <div className="empty-state"><div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><BedDouble size={18}/></div><strong>No rooms to display</strong><span className="text-xs">Add room inventory to see live status.</span><div className="mt-4"><Link className="btn" href="/rooms">Manage rooms <ArrowRight size={14}/></Link></div></div>}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="panel-head"><div><h2>Recent reservations</h2><p>Latest activity across your property</p></div><Link href="/reservations" className="btn">View all <ArrowRight size={14}/></Link></div>
        {data.recent.length ? <div className="overflow-x-auto"><table className="data-table">
          <thead><tr><th>Reference</th><th>Guest</th><th>Room</th><th>Stay dates</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{data.recent.map(r => <tr key={r.id}><td className="font-mono font-semibold text-xs text-slate-500">{r.reference}</td><td className="font-semibold text-slate-800">{r.guest.firstName} {r.guest.lastName}</td><td>{r.room.number}</td><td>{dateLabel(r.checkIn)} – {dateLabel(r.checkOut)}</td><td className="font-semibold">{money(Number(r.totalAmount))}</td><td><Status value={r.status}/></td></tr>)}</tbody>
        </table></div> : <div className="empty-state"><div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><ClipboardList size={18}/></div><strong>No reservations yet</strong><span className="text-xs">Your confirmed and upcoming stays will appear here.</span><div className="mt-4"><Link className="btn btn-primary" href="/book"><Plus size={14}/> Create first booking</Link></div></div>}
      </section>

      <section className="panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><Activity size={18}/></div><div><div className="font-semibold text-sm">Front desk overview</div><div className="text-xs text-slate-500">{data.dbReady ? 'Connected to live database queries' : 'Database data could not be loaded'}</div></div></div>
        <div className="text-xs text-slate-400">Updated {format(new Date(), 'hh:mm a')}</div>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, BedDouble, Users, CreditCard,
  ClipboardList, BarChart3, LogIn, Hotel, Sparkles, Settings2
} from 'lucide-react';

const groups = [
  { label: 'OVERVIEW', items: [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/availability', label: 'Availability', icon: CalendarDays },
  ]},
  { label: 'FRONT DESK', items: [
    { href: '/reservations', label: 'Reservations', icon: ClipboardList },
    { href: '/book', label: 'New booking', icon: BedDouble },
    { href: '/checkin', label: 'Check-in / out', icon: LogIn },
  ]},
  { label: 'PROPERTY', items: [
    { href: '/rooms', label: 'Rooms', icon: Hotel },
    { href: '/guests', label: 'Guests', icon: Users },
    { href: '/payments', label: 'Payments', icon: CreditCard },
  ]},
  { label: 'INSIGHTS', items: [
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="navy-sidebar flex flex-col w-[248px] min-h-screen shrink-0">
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c89543] text-white flex items-center justify-center shadow-lg shadow-black/20">
            <Hotel size={19} />
          </div>
          <div>
            <h1 className="text-[19px] leading-5 font-bold tracking-tight text-white">Staywise</h1>
            <p className="text-[9px] mt-1 tracking-[.2em] uppercase text-slate-400">Hotel operations</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="sidebar-group">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                return (
                  <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-[#dfad55]"><Sparkles size={15}/></div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Staywise workspace</p>
            <p className="mt-1 text-[10px] text-slate-400">Hotel management</p>
          </div>
          <Settings2 size={14} className="ml-auto text-slate-500"/>
        </div>
      </div>
    </aside>
  );
}

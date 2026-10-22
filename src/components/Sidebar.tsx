'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Bed, Users, CreditCard, ClipboardList, BarChart3, LogIn } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/availability', label: 'Availability', icon: Calendar },
  { href: '/reservations', label: 'Reservations', icon: ClipboardList },
  { href: '/book', label: 'New Booking', icon: Bed },
  { href: '/rooms', label: 'Rooms', icon: Bed },
  { href: '/guests', label: 'Guests', icon: Users },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/checkin', label: 'Check-in/out', icon: LogIn },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 navy-sidebar flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold gold-accent">Staywise</h1>
        <p className="text-sm text-slate-400">Hotel Operations</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

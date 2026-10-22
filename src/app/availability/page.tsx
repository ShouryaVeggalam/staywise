'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, Search, RotateCcw, BedDouble, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

type Room = { id: number; number: string; floor: number; category: string; capacity: number; nightlyRate: number; nights: number; estimatedTotal: number };

function localDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(value: string, count: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + count);
  return localDateString(date);
}

export default function AvailabilityPage() {
  const today = useMemo(() => localDateString(new Date()), []);
  const [form, setForm] = useState({ checkIn: today, checkOut: addDays(today, 1), adults: 1 });
  const [results, setResults] = useState<Room[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState(0);

  const validRange = form.checkIn && form.checkOut && form.checkOut > form.checkIn;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validRange) {
      setError('Check-out must be at least one day after check-in.');
      setResults(null);
      return;
    }
    if (form.adults < 1 || !Number.isInteger(form.adults)) {
      setError('Enter at least one adult.');
      setResults(null);
      return;
    }
    setLoading(true);
    setError('');
    setResults(null);
    setRequestId((current) => current + 1);
    try {
      const params = new URLSearchParams({
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: String(form.adults),
      });
      const response = await fetch(`/api/availability?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || `Availability request failed (HTTP ${response.status}).`);
      if (!body || !Array.isArray(body.data)) throw new Error('The server returned an unexpected response. Check the API logs.');
      setResults(body.data);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'TimeoutError') {
        setError('The search timed out after 15 seconds. Check database connectivity and server logs.');
      } else {
        setError(cause instanceof Error ? cause.message : 'Could not search availability. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm({ checkIn: today, checkOut: addDays(today, 1), adults: 1 });
    setResults(null);
    setError('');
  }

  const formatMoney = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      <header className="page-heading">
        <div><div className="eyebrow">FRONT DESK / SEARCH</div><h1 className="mt-2">Room availability</h1><p>Find the right room for your guest’s stay.</p></div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white border border-[var(--line)] px-4 py-3 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500"/><span>Live availability search</span></div>
      </header>

      <section className="panel overflow-hidden">
        <div className="panel-head"><div><h2>Find a room</h2><p>Search uses reservation dates and room capacity from the database.</p></div><div className="w-9 h-9 rounded-xl bg-[#fbf4e8] text-[#a6762c] flex items-center justify-center"><CalendarDays size={17}/></div></div>
        <form onSubmit={onSubmit} className="panel-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_.8fr_auto_auto] gap-4 items-end">
            <div><label htmlFor="checkIn" className="form-label">Check-in</label><input id="checkIn" type="date" value={form.checkIn} min={today} onChange={e => setForm({ ...form, checkIn: e.target.value, checkOut: form.checkOut <= e.target.value ? addDays(e.target.value, 1) : form.checkOut })} className="form-control" required /></div>
            <div><label htmlFor="checkOut" className="form-label">Check-out</label><input id="checkOut" type="date" value={form.checkOut} min={form.checkIn ? addDays(form.checkIn, 1) : today} onChange={e => setForm({ ...form, checkOut: e.target.value })} className="form-control" required /></div>
            <div><label htmlFor="adults" className="form-label">Adults</label><div className="relative"><Users size={15} className="absolute left-3 top-3.5 text-slate-400"/><input id="adults" type="number" min={1} max={20} value={form.adults} onChange={e => setForm({ ...form, adults: Number(e.target.value) })} className="form-control pl-9" required /></div></div>
            <button type="submit" disabled={loading} className="btn btn-primary min-h-[42px]">{loading ? <><span className="animate-spin">◌</span> Searching…</> : <><Search size={15}/> Search rooms</>}</button>
            <button type="button" onClick={reset} className="btn min-h-[42px]"><RotateCcw size={14}/> Reset</button>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">Stay dates use the standard hotel convention: check-out day is not counted as an occupied night.</p>
        </form>
      </section>

      {error && <div role="alert" className="notice notice-error flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5"/><div><strong>Search could not be completed</strong><div className="mt-1">{error}</div></div></div>}

      <section className="panel overflow-hidden">
        <div className="panel-head"><div><h2>{results === null ? 'Available rooms' : 'Search results'}</h2><p>{results === null ? 'Choose your dates and search to see matching inventory.' : `${results.length} room${results.length === 1 ? '' : 's'} found for ${form.checkIn} → ${form.checkOut}`}</p></div>{results !== null && <span className="status-pill status-available">{results.length} result{results.length === 1 ? '' : 's'}</span>}</div>
        {loading ? <div className="empty-state"><div className="animate-spin mx-auto w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#c89543]"/><strong>Checking room inventory…</strong><span className="text-xs">This usually takes a moment.</span></div> :
        results === null ? <div className="empty-state"><div className="mx-auto w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center"><BedDouble size={19}/></div><strong>Search dates to see available rooms</strong><span className="text-xs">Results will be checked against current reservations.</span></div> :
        results.length === 0 ? <div className="empty-state"><div className="mx-auto w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><CalendarDays size={19}/></div><strong>No rooms available for these dates</strong><span className="text-xs">Try different dates or reduce the number of guests.</span><button type="button" className="btn mt-4" onClick={() => setForm({ ...form, checkIn: addDays(form.checkIn, 1), checkOut: addDays(form.checkOut, 1) })}>Try next day <ArrowRight size={14}/></button></div> :
        <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Room</th><th>Category</th><th>Floor</th><th>Capacity</th><th>Nightly rate</th><th>Nights</th><th>Estimated total</th><th>Action</th></tr></thead><tbody>{results.map(room => <tr key={room.id}><td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#fbf4e8] text-[#a6762c] flex items-center justify-center"><BedDouble size={14}/></div><span className="font-semibold text-slate-800">{room.number}</span></div></td><td>{room.category}</td><td>{room.floor}</td><td>{room.capacity} guests</td><td>{formatMoney(room.nightlyRate)}</td><td>{room.nights}</td><td className="font-semibold text-slate-800">{formatMoney(room.estimatedTotal)}</td><td><Link href={`/book?roomId=${room.id}&checkIn=${form.checkIn}&checkOut=${form.checkOut}&adults=${form.adults}`} className="btn btn-primary">Select <ArrowRight size={13}/></Link></td></tr>)}</tbody></table></div>}
      </section>
      <div className="flex items-center gap-2 text-[11px] text-slate-400"><CheckCircle2 size={14}/> Search is based on live inventory. Final availability is rechecked when a reservation is submitted.</div>
      <span className="sr-only">{requestId}</span>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AvailabilityPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ checkIn: '', checkOut: '', adults: 1 });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        checkIn: new Date(form.checkIn).toISOString(),
        checkOut: new Date(form.checkOut).toISOString(),
        adults: String(form.adults),
      });
      const res = await fetch(`/api/availability?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Search failed');
      setResults(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Availability</h1>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl border grid grid-cols-2 md:grid-cols-4 gap-4">
        <input type="date" value={form.checkIn} onChange={(e) => setForm({...form, checkIn: e.target.value})} className="border rounded px-3 py-2" required />
        <input type="date" value={form.checkOut} onChange={(e) => setForm({...form, checkOut: e.target.value})} className="border rounded px-3 py-2" required />
        <input type="number" min={1} value={form.adults} onChange={(e) => setForm({...form, adults: Number(e.target.value)})} className="border rounded px-3 py-2" />
        <button type="submit" disabled={loading} className="bg-navy-900 text-white py-2 rounded-lg disabled:opacity-50">{loading ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}
      <div className="space-y-3">
        {results.map((room) => (
          <div key={room.id} className="bg-white border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">Room {room.number} • {room.category}</p>
              <p className="text-sm">${room.nightlyRate}/night • {room.nights} nights • ${room.estimatedTotal.toFixed(2)}</p>
            </div>
            <button onClick={() => router.push('/book')} className="bg-gold-500 text-white px-4 py-2 rounded">Book</button>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reservations').then(r => r.json()).then(j => {
      if (j.success) setReservations(j.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reservations</h1>
      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3 text-left">Ref</th><th className="p-3 text-left">Guest</th><th className="p-3 text-left">Room</th><th className="p-3 text-left">Status</th></tr></thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{r.reference}</td>
                  <td className="p-3">{r.guest?.firstName} {r.guest?.lastName}</td>
                  <td className="p-3">{r.room?.number}</td>
                  <td className="p-3">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

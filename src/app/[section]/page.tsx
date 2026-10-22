'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BedDouble, Users, CreditCard, ClipboardCheck, BarChart3, Plus, Search, AlertTriangle } from 'lucide-react';

type Section = 'rooms'|'guests'|'payments'|'book'|'checkin'|'reports';
const config: Record<Section,{title:string;subtitle:string;api:string;icon:any;cols:string[]}> = {
 rooms:{title:'Room inventory',subtitle:'Rooms and their current operational status.',api:'/api/rooms',icon:BedDouble,cols:['Room','Type','Floor','Rate / night','Status']},
 guests:{title:'Guest directory',subtitle:'Guest profiles registered in Staywise.',api:'/api/guests',icon:Users,cols:['Guest','Email','Phone','Reservations']},
 payments:{title:'Payments',subtitle:'Recorded payment transactions and reservation balances.',api:'/api/payments',icon:CreditCard,cols:['Date','Reservation','Guest','Method','Amount','Status']},
 book:{title:'New booking',subtitle:'Create a guest profile and reserve an available room.',api:'/api/reservations',icon:Plus,cols:[]},
 checkin:{title:'Check-in / check-out',subtitle:'Update the stay status for confirmed reservations.',api:'/api/checkin',icon:ClipboardCheck,cols:['Reference','Guest','Room','Dates','Status','Action']},
 reports:{title:'Reports',subtitle:'A quick operational snapshot from your live database.',api:'/api/reports',icon:BarChart3,cols:[]},
};
const currency=(v:any)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(v||0));
const date=(v:any)=>v?new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';

export default function OperationalSection({params}:{params:{section:string}}){
 const section=params.section as Section;
 const cfg=config[section];
 const [rows,setRows]=useState<any[]>([]);
 const [report,setReport]=useState<any>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [form,setForm]=useState<any>({firstName:'',lastName:'',email:'',phone:'',roomId:'',checkIn:'',checkOut:'',adults:1,children:0});
 async function load(){
  if(!cfg)return;setLoading(true);setError('');
  try{const res=await fetch(cfg.api,{cache:'no-store'});const json=await res.json();if(!res.ok||json.success===false)throw new Error(json.error||'Could not load this section.');if(section==='reports')setReport(json.data);else setRows(Array.isArray(json.data)?json.data:[]);}
  catch(e){setError(e instanceof Error?e.message:'Request failed');}finally{setLoading(false);}
 }
 useEffect(()=>{load();},[section]);
 async function submit(e:any){e.preventDefault();setBusy(true);setError('');setNotice('');
 try{
  if(section==='book'){
   const guestRes=await fetch('/api/guests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:form.firstName,lastName:form.lastName,email:form.email||null,phone:form.phone||null})});
   const gj=await guestRes.json();if(!guestRes.ok)throw new Error(gj.error||'Guest creation failed');
   const rr=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guestId:gj.data.id,roomId:Number(form.roomId),checkIn:form.checkIn,checkOut:form.checkOut,adults:Number(form.adults),children:Number(form.children)})});
   const rj=await rr.json();if(!rr.ok)throw new Error(rj.error||'Reservation failed');
   setNotice('Booking created: '+(rj.data?.reference||'confirmed'));setForm({firstName:'',lastName:'',email:'',phone:'',roomId:'',checkIn:'',checkOut:'',adults:1,children:0});
  }else if(section==='checkin'){
   const res=await fetch('/api/checkin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const j=await res.json();if(!res.ok)throw new Error(j.error||'Status update failed');setNotice(j.message||'Reservation updated');
  }
  await load();
 }catch(e){setError(e instanceof Error?e.message:'Action failed');}finally{setBusy(false);}
 }
 if(!cfg)return <div className="panel p-8"><h1 className="text-xl font-bold">Page not found</h1><Link href="/" className="btn mt-4">Dashboard</Link></div>;
 const Icon=cfg.icon;
 return <div className="space-y-6">
  <header className="page-heading"><div><div className="eyebrow">STAYWISE / OPERATIONS</div><h1 className="mt-2">{cfg.title}</h1><p>{cfg.subtitle}</p></div><Link href="/book" className="btn btn-primary"><Plus size={15}/> New booking</Link></header>
  {error&&<div role="alert" className="notice notice-error flex gap-2"><AlertTriangle size={16}/><span>{error}</span></div>}
  {notice&&<div role="status" className="notice">{notice}</div>}
  {section==='book'&&<div className="panel"><div className="panel-head"><div><h2>Guest and stay details</h2><p>Reservation is rechecked for room conflicts by the server.</p></div></div><form onSubmit={submit} className="panel-body grid grid-cols-1 sm:grid-cols-2 gap-4">
   {(['firstName','lastName','email','phone','roomId','checkIn','checkOut','adults','children'] as string[]).map(k=><label key={k} className="form-label">{({firstName:'First name',lastName:'Last name',email:'Email',phone:'Phone',roomId:'Room ID',checkIn:'Check-in',checkOut:'Check-out',adults:'Adults',children:'Children'} as any)[k]}<input className="form-control mt-1" required={!['email','phone','children'].includes(k)} type={k==='checkIn'||k==='checkOut'?'date':k==='email'?'email':['roomId','adults','children'].includes(k)?'number':'text'} min={k==='adults'||k==='roomId'?'1':k==='children'?'0':undefined} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
   <div className="sm:col-span-2"><button disabled={busy} className="btn btn-primary">{busy?'Creating…':'Create reservation'}</button></div>
  </form></div>}
  {section==='checkin'&&<div className="panel p-5"><form onSubmit={submit} className="flex flex-wrap gap-3 items-end"><label className="form-label">Reservation ID<input className="form-control mt-1" type="number" min="1" required value={form.reservationId||''} onChange={e=>setForm({...form,reservationId:Number(e.target.value)})}/></label><label className="form-label">Action<select className="form-control mt-1" value={form.action||'checkin'} onChange={e=>setForm({...form,action:e.target.value})}><option value="checkin">Check in</option><option value="checkout">Check out</option><option value="cancel">Cancel reservation</option></select></label><button className="btn btn-primary" disabled={busy}>{busy?'Updating…':'Apply status'}</button></form><p className="text-xs text-slate-500 mt-2">Use the reservation ID shown in the table below.</p></div>}
  {section==='reports'&&report&&<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{Object.entries(report).map(([k,v])=><div key={k} className="metric-card"><div className="metric-label">{k.replace(/([A-Z])/g,' $1')}</div><div className="metric-value">{typeof v==='number'&&/revenue|payments|balance/i.test(k)?currency(v):String(v)}</div></div>)}</div>}
  {['rooms','guests','payments','checkin'].includes(section)&&<div className="panel overflow-hidden"><div className="panel-head"><div><h2>{cfg.title}</h2><p>{rows.length} record{rows.length===1?'':'s'}</p></div><button className="btn" onClick={load}><Search size={14}/> Refresh</button></div>{loading?<div className="empty-state">Loading records…</div>:rows.length===0?<div className="empty-state"><Icon size={20}/><strong>No records found</strong><span className="text-xs">There is currently no data to show for this section.</span></div>:<div className="overflow-x-auto"><table className="data-table"><thead><tr>{cfg.cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>
  {section==='rooms'&&<><td className="font-semibold">{r.number}</td><td>{r.roomType?.name||'—'}</td><td>{r.floor}</td><td>{currency(r.nightlyRate)}</td><td>{r.status}</td></>}
  {section==='guests'&&<><td className="font-semibold">{r.firstName} {r.lastName}</td><td>{r.email||'—'}</td><td>{r.phone||'—'}</td><td>{r.reservations?.length??0}</td></>}
  {section==='payments'&&<><td>{date(r.paymentDate)}</td><td>{r.reservation?.reference||r.reservationId}</td><td>{r.reservation?.guest? r.reservation.guest.firstName+' '+r.reservation.guest.lastName:'—'}</td><td>{r.method}</td><td className="font-semibold">{currency(r.amount)}</td><td>{r.status}</td></>}
  {section==='checkin'&&<><td className="font-mono">{r.reference} <span className="text-slate-400">#{r.id}</span></td><td>{r.guest?.firstName} {r.guest?.lastName}</td><td>{r.room?.number}</td><td>{date(r.checkIn)}–{date(r.checkOut)}</td><td>{r.status}</td><td><button className="btn" onClick={()=>{setForm({reservationId:r.id,action:r.status==='CHECKED_IN'?'checkout':'checkin'});window.scrollTo({top:0,behavior:'smooth'})}}>{r.status==='CHECKED_IN'?'Check out':'Check in'}</button></td></>}
 </tr>)}</tbody></table></div>}</div>}
 </div>;
}

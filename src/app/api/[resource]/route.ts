import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic='force-dynamic';
export const revalidate=0;
const fail=(error:string,status=400)=>NextResponse.json({success:false,error},{status});

export async function GET(_req:NextRequest,{params}:{params:{resource:string}}){
 try{
  switch(params.resource){
   case 'rooms': return NextResponse.json({success:true,data:await prisma.room.findMany({include:{roomType:true},orderBy:{number:'asc'}})});
   case 'guests': return NextResponse.json({success:true,data:await prisma.guest.findMany({include:{reservations:{select:{id:true,status:true}}},orderBy:{createdAt:'desc'}})});
   case 'payments': return NextResponse.json({success:true,data:await prisma.payment.findMany({include:{reservation:{include:{guest:true,room:true}}},orderBy:{paymentDate:'desc'}})});
   case 'checkin': return NextResponse.json({success:true,data:await prisma.reservation.findMany({where:{status:{in:['CONFIRMED','CHECKED_IN']}},include:{guest:true,room:true},orderBy:{checkIn:'asc'}})});
   case 'reports': {
    const [rooms,guests,reservations,paymentAgg,bookingAgg]=await Promise.all([
     prisma.room.count(),prisma.guest.count(),prisma.reservation.count({where:{status:{in:['PENDING','CONFIRMED','CHECKED_IN']}}}),
     prisma.payment.aggregate({where:{status:'COMPLETED'},_sum:{amount:true}}),
     prisma.reservation.aggregate({where:{status:{not:'CANCELLED'}},_sum:{totalAmount:true}})
    ]);
    return NextResponse.json({success:true,data:{totalRooms:rooms,registeredGuests:guests,activeReservations:reservations,paymentsCollected:Number(paymentAgg._sum.amount||0),bookedValue:Number(bookingAgg._sum.totalAmount||0)}});
   }
   default:return fail('Unknown API resource',404);
  }
 }catch(e){console.error('GET /api/'+params.resource,e);return fail('Unable to load data. Check database connection and Vercel function logs.',500);}
}
export async function POST(req:NextRequest,{params}:{params:{resource:string}}){
 try{
  const body=await req.json();
  if(params.resource==='guests'){
   const firstName=String(body.firstName||'').trim(),lastName=String(body.lastName||'').trim();
   if(!firstName||!lastName)return fail('First and last name are required.');
   const guest=await prisma.guest.create({data:{firstName,lastName,email:body.email||null,phone:body.phone||null}});
   return NextResponse.json({success:true,data:guest},{status:201});
  }
  if(params.resource==='payments'){
   const reservationId=Number(body.reservationId),amount=Number(body.amount);
   if(!Number.isInteger(reservationId)||reservationId<1||!Number.isFinite(amount)||amount<=0||!body.method)return fail('Reservation, positive amount, and payment method are required.');
   const payment=await prisma.payment.create({data:{reservationId,amount,method:String(body.method),status:'COMPLETED',providerRef:body.providerRef||null,notes:body.notes||null}});
   return NextResponse.json({success:true,data:payment},{status:201});
  }
  if(params.resource==='checkin'){
   const reservationId=Number(body.reservationId),action=String(body.action||'');
   if(!Number.isInteger(reservationId)||reservationId<1)return fail('Valid reservation ID required.');
   const reservation=await prisma.reservation.findUnique({where:{id:reservationId}});
   if(!reservation)return fail('Reservation not found.',404);
   const transitions:any={checkin:{from:['CONFIRMED'],to:'CHECKED_IN'},checkout:{from:['CHECKED_IN'],to:'CHECKED_OUT'},cancel:{from:['PENDING','CONFIRMED'],to:'CANCELLED'}};
   const t=transitions[action];if(!t||!t.from.includes(reservation.status))return fail('This action is not valid for the reservation current status.',409);
   const updated=await prisma.reservation.update({where:{id:reservationId},data:{status:t.to}});
   await prisma.reservationStatusHistory.create({data:{reservationId,oldStatus:reservation.status,newStatus:t.to,reason:'Updated via Staywise front desk'}});
   return NextResponse.json({success:true,data:updated,message:'Reservation status changed to '+t.to});
  }
  return fail('Unknown API resource',404);
 }catch(e:any){console.error('POST API resource',e);if(e?.code==='P2002')return fail('A guest with this email already exists.',409);if(e?.code==='P2003')return fail('Referenced reservation/guest/room does not exist.',400);return fail('Action failed. Check the submitted values and server logs.',500);}
}

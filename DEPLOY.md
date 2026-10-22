# Deploy Staywise

## Vercel
1. Import this repo at vercel.com/new
2. Set environment variables:
   - DATABASE_URL (Aiven MySQL with ?sslaccept=strict)
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
3. Deploy

## Database
```bash
npx prisma db push
npm run db:seed
```

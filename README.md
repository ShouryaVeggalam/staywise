# Staywise — Hotel Booking & Management System

A production-quality full-stack hotel operations platform built with Next.js, TypeScript, Tailwind CSS, Prisma, and MySQL.

## Features
- Live dashboard with real DB metrics
- Availability search with overlap prevention
- Full reservation management
- Multi-step booking workflow
- Room, guest, and payment management
- Check-in / check-out
- Reports
- NextAuth credentials auth

## Tech Stack
- Next.js 14 App Router + TypeScript + Tailwind
- Prisma ORM + MySQL 8
- NextAuth.js

## Setup
```bash
npm install
cp .env.example .env
# Set DATABASE_URL
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Demo: admin@staywise.demo / admin123

See DEPLOY.md for Vercel + Aiven deployment.

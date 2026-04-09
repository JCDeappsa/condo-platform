# Condominium Administration Platform

## Project Overview
Single-condominium admin platform (60 lots, Guatemala). All UI in Spanish. Can evolve to multi-condo SaaS.

## Tech Stack
- **Backend**: Node.js, Express, TypeScript, Sequelize ORM, PostgreSQL (Supabase), Joi, JWT, Swagger
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, react-router-dom, lucide-react, recharts
- **Email**: Resend (simulated if no API key)
- **Storage**: Supabase Storage (for receipts, photos, documents)

## Running Locally
```bash
# Backend
cd backend && cp .env.example .env  # fill in your Supabase credentials
npm install && npm run migrate && npm run seed && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Architecture
- Backend: layered modules at `src/modules/{name}/` — each has routes, schema, controller, service, dto, model(s)
- Frontend: pages at `src/pages/{module}/`, shared components at `src/components/`, Spanish strings at `src/i18n/es.ts`
- 9 SQL migrations in `src/migrations/`, run via `npm run migrate`
- 27 database tables, all with `community_id` for future multi-condo support

## Key Business Rules
- Payments apply to oldest unpaid charge first (FIFO)
- Notification engine respects cooldown windows and active payment promises
- Completed maintenance tickets require closing notes
- Meter readings trigger anomaly detection against previous value
- Board members are read-only, maintenance users cannot see financial data

## Seed Users
- admin@condominio.com / admin123 (Administrator)
- junta@condominio.com / board123 (Board Member)
- mantenimiento@condominio.com / maint123 (Maintenance)
- residente@condominio.com / resident123 (Resident)

# Convoy Fleet Desk

Bilingual (English / தமிழ்) accounts book for a transport office: one trip sheet per vehicle round,
rent payments per load, diesel and expense heads, driver advances and settlement, reports, and
PDF / WhatsApp export. Next.js 14 + MongoDB.

## Setup

1. `npm install`
2. Fill in `.env.local` (see `.env.example`):
   - `MONGODB_URI` — replace `<db_user>` and `<db_password>`. The database (`multiaxletrex`) is created on first write.
   - `JWT_SECRET`, `SUPERADMIN_SECRET` — long random strings.
3. `npm run dev` → http://localhost:3000
4. Create the office and its owner login once:

   ```bash
   curl -X POST http://localhost:3000/api/auth/setup \
     -H "Content-Type: application/json" \
     -H "x-superadmin-secret: $SUPERADMIN_SECRET" \
     -d '{"company_name":"My Transports","full_name":"Owner","email":"owner@example.com","password":"at-least-8-chars"}'
   ```

5. Log in. The first screen offers **Restore a backup** (paste the text from *Backup or restore* in the old
   Convoy page), **Load sample sheets**, or **Start empty**.

The owner can add more office logins under **Drivers & vehicles → Office logins**.

## Commands

```bash
npm run dev          # dev server on :3000
npm run build        # production build
npm run type-check   # TypeScript
npm run lint         # ESLint
```

## NFC Backend (Express + TypeScript + Drizzle + Neon)

### Setup
- Copy `.env.example` to `.env` and set `DATABASE_URL`.
- Install deps: `npm install`

### Drizzle Commands

**Generate migrations:**
```bash
npx drizzle-kit generate
```

**Push schema to database (dev):**
```bash
npx drizzle-kit push
```

**Open Drizzle Studio (web editor):**
```bash
npx drizzle-kit studio
```

**Check migration status:**
```bash
npx drizzle-kit check
```

**Migrate database:**
```bash
npx drizzle-kit migrate
```

**Pull schema from database:**
```bash
npx drizzle-kit pull
```

### Dev
```bash
npm run dev
# health
curl http://localhost:${PORT:-3000}/healthz

# create NFC record
curl -X POST http://localhost:${PORT:-3000}/api/nfc \
  -H 'content-type: application/json' \
  -d '{"userId":"b9d3f9c0-6a2e-4e0c-8f8d-5d7a2f3c9a10","tagId":"tag-123","data":{"foo":"bar"}}'
```

### Notes
- One user to many NFC tags via `userId` FK.
- If a user does not exist, it is created on first NFC write.



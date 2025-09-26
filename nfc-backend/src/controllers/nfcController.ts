import { Request, Response } from 'express';
import { db } from '../db';
import { nfcTags, users } from '../schema';
import { eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

const insertNfcSchema = createInsertSchema(nfcTags);

export async function createNfc(req: Request, res: Response) {
    const parsed = insertNfcSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const { userId, tagId, data } = parsed.data;

    try {
        const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!existingUser) {
            await db.insert(users).values({ id: userId });
        }

        const insertedRows = await db
            .insert(nfcTags)
            .values({ userId, tagId, data })
            .returning({ id: nfcTags.id, createdAt: nfcTags.createdAt });

        const inserted = insertedRows[0];
        if (!inserted) {
            return res.status(500).json({ error: 'Insert did not return a row' });
        }

        return res.status(201).json({ id: inserted.id, createdAt: inserted.createdAt });
    } catch (_error) {
        return res.status(500).json({ error: 'Failed to store NFC data' });
    }
}



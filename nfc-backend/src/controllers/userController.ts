import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

const insertUserSchema = createInsertSchema(users);

export async function createUser(req: Request, res: Response) {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    try {
        const [inserted] = await db
            .insert(users)
            .values(parsed.data)
            .returning();

        return res.status(201).json(inserted);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create user' });
    }
}

export async function getUser(req: Request, res: Response) {
    const { userId } = req.params;

    try {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get user' });
    }
}

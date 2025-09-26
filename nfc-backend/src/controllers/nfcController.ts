import { Request, Response } from 'express';
import { db } from '../db';
import { userNfcs, users, connections } from '../schema';
import { eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

const insertUserNfcSchema = createInsertSchema(userNfcs);

// Register user's own NFC
export async function registerNfc(req: Request, res: Response) {
    const parsed = insertUserNfcSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const { userId, nfcId, name, data } = parsed.data;

    try {
        // Check if user exists
        const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if NFC already exists
        const [existingNfc] = await db
            .select()
            .from(userNfcs)
            .where(eq(userNfcs.nfcId, nfcId))
            .limit(1);

        if (existingNfc) {
            return res.status(409).json({ error: 'NFC already registered' });
        }

        const [inserted] = await db
            .insert(userNfcs)
            .values({ userId, nfcId, name, data })
            .returning();

        return res.status(201).json(inserted);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to register NFC' });
    }
}

// Get user's NFCs
export async function getUserNfcs(req: Request, res: Response) {
    const { userId } = req.params;

    try {
        const nfcs = await db
            .select()
            .from(userNfcs)
            .where(eq(userNfcs.userId, userId!));

        return res.status(200).json(nfcs);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get user NFCs' });
    }
}

// Connect with someone else's NFC
export async function connectNfc(req: Request, res: Response) {
    const { fromUserId, toNfcId, fromNfcId } = req.body;

    if (!fromUserId || !toNfcId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Find the owner of the NFC being scanned
        const [targetNfc] = await db
            .select()
            .from(userNfcs)
            .where(eq(userNfcs.nfcId, toNfcId))
            .limit(1);

        if (!targetNfc) {
            return res.status(404).json({ error: 'NFC not found' });
        }

        // // Verify the fromNfcId belongs to fromUserId
        // const [fromNfc] = await db
        //     .select()
        //     .from(userNfcs)
        //     .where(eq(userNfcs.nfcId, fromNfcId))
        //     .limit(1);

        // get the fromNfcId from the userNfcs table for fromUserId
        const [fromNfc] = await db
            .select()
            .from(userNfcs)
            .where(eq(userNfcs.nfcId, fromNfcId))
            .limit(1);

        if (!fromNfc || fromNfc.userId !== fromUserId) {
            return res.status(403).json({ error: 'Invalid NFC for user' });
        }

        // Create connection
        const [connection] = await db
            .insert(connections)
            .values({
                fromUserId,
                toUserId: targetNfc.userId,
                fromNfcId,
                toNfcId,
                data: { connectedAt: new Date().toISOString() }
            })
            .returning();

        return res.status(201).json(connection);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create connection' });
    }
}

// Get user's connections
export async function getUserConnections(req: Request, res: Response) {
    const { userId } = req.params;

    try {
        const userConnections = await db
            .select()
            .from(connections)
            .where(eq(connections.fromUserId, userId!));

        return res.status(200).json(userConnections);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get connections' });
    }
}
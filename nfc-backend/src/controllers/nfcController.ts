import { Request, Response } from 'express';
import { db } from '../db';
import { userNfcs, users, connections } from '../schema';
import { eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

// Helper function to update pending connections when a user registers their NFC
async function updatePendingConnections(nfcId: string, userId: string) {
    try {
        // Find all connections where this NFC was scanned but the user was unknown
        const pendingConnections = await db
            .select()
            .from(connections)
            .where(eq(connections.toNfcId, nfcId));

        // Update all pending connections to point to the actual user
        for (const connection of pendingConnections) {
            if (connection.toUserId === 'unknown_user') {
                await db
                    .update(connections)
                    .set({
                        toUserId: userId,
                        data: {
                            ...(connection.data || {}),
                            userRegistered: true,
                            registeredAt: new Date().toISOString()
                        }
                    })
                    .where(eq(connections.id, connection.id));
            }
        }
    } catch (error) {
        console.error('Error updating pending connections:', error);
    }
}

const insertUserNfcSchema = createInsertSchema(userNfcs);

// Register user's own NFC
export async function registerNfc(req: Request, res: Response) {
    const parsed = insertUserNfcSchema.safeParse(req.body);
    console.log("parsed data:: ", parsed)
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

        // After successfully registering the NFC, check if there are any pending connections
        // from users who scanned this NFC before it was registered
        if (inserted) {
            await updatePendingConnections(inserted.nfcId, inserted.userId);
        }

        console.log('insertion: ', [inserted]);
        return res.status(201).json(inserted);
    } catch (error) {
        console.log("errror::: ", error);
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

        let toUserId = null;

        if (targetNfc) {
            // NFC exists and is registered to a user
            toUserId = targetNfc.userId;
        } else {
            // NFC doesn't exist in database yet - this is a new/unknown NFC
            // We'll create a placeholder connection that can be updated later
            // when the actual user registers this NFC
            toUserId = 'unknown_user'; // Placeholder for unknown users
        }

        // Create connection (even if the target user is unknown)
        const [connection] = await db
            .insert(connections)
            .values({
                fromUserId,
                toUserId: toUserId,
                fromNfcId,
                toNfcId,
                data: {
                    connectedAt: new Date().toISOString(),
                    isUnknownUser: !targetNfc, // Flag to indicate if this was an unknown user
                    targetNfcExists: !!targetNfc
                }
            })
            .returning();

        return res.status(201).json({
            success: true,
            connection,
            message: targetNfc
                ? 'Successfully connected with user!'
                : 'Connection recorded! The user will be notified when they register this NFC.'
        });
    } catch (error) {
        console.error('Error creating connection:', error);
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

// Toggle NFC status
export async function toggleNfcStatus(req: Request, res: Response) {
    const { nfcId } = req.params;
    const { isActive } = req.body;
    console.log("body:: ", req.params);
    if (typeof isActive !== 'boolean') {
        console.log('isactive :: ', isActive);
        return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    try {
        // Check if NFC exists
        const [existingNfc] = await db
            .select()
            .from(userNfcs)
            .where(eq(userNfcs.nfcId, nfcId!))
            .limit(1);

        if (!existingNfc) {
            console.log('issue in if', existingNfc)
            return res.status(404).json({ error: 'NFC not found' });
        }

        // Update the NFC status
        const [updated] = await db
            .update(userNfcs)
            .set({ isActive: isActive.toString() })
            .where(eq(userNfcs.nfcId, nfcId!))
            .returning();
        console.log('updated:: ', updated)
        return res.status(200).json({
            success: true,
            nfc: updated,
            message: `NFC ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error toggling NFC status:', error);
        return res.status(500).json({ error: 'Failed to toggle NFC status' });
    }
}
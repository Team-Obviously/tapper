import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Define validation schema for user creation
const createUserSchema = z.object({
    // Basic Information
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    location: z.string().optional(),
    // Sports Information
    interests: z.array(z.string()).optional(),
    skillLevel: z.string().optional(),
    availability: z.string().optional(),
    // Work Information
    company: z.string().optional(),
    position: z.string().optional(),
    experience: z.string().optional(),
    isHiring: z.boolean().optional(),
    resumeUrl: z.string().optional(),
});

export async function createUser(req: Request, res: Response) {
    console.log('CREATE USERreq.body', req.body);
    const parsed = createUserSchema.safeParse(req.body);
    console.log('parsed', parsed);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsed.error.flatten()
        });
    }

    try {
        // Convert isHiring boolean to string for database storage
        const userData = {
            ...parsed.data,
            isHiring: parsed.data.isHiring ? 'true' : 'false'
        };

        const [inserted] = await db
            .insert(users)
            .values(userData)
            .returning();

        return res.status(201).json({
            success: true,
            user: inserted,
            message: 'User created successfully'
        });
    } catch (error: any) {
        console.error('Error creating user:', error);

        // Handle unique constraint violation
        if (error.code === '23505' && error.constraint === 'users_email_key') {
            return res.status(400).json({
                error: 'Email already exists',
                message: 'A user with this email address already exists'
            });
        }

        return res.status(500).json({
            error: 'Failed to create user',
            message: 'Internal server error'
        });
    }
}

export async function getUser(req: Request, res: Response) {
    const { userId } = req.params;

    try {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId!))
            .limit(1);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to get user' });
    }
}

// Update user data
export async function updateUser(req: Request, res: Response) {
    const { userId } = req.params;
    const updateData = req.body;

    try {
        // Check if user exists
        const [existingUser] = await db.select().from(users).where(eq(users.id, userId!));
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Process the update data
        const processedData: any = { ...updateData };

        // Convert isHiring boolean to string if present
        if (processedData.isHiring !== undefined) {
            processedData.isHiring = processedData.isHiring.toString();
        }

        // Handle dateOfBirth - ensure it's a string and properly formatted
        let dateOfBirthValue = null;
        if (processedData.dateOfBirth) {
            if (typeof processedData.dateOfBirth === 'string') {
                // Validate the date format
                const date = new Date(processedData.dateOfBirth);
                if (!isNaN(date.getTime())) {
                    // Valid date, keep as string in YYYY-MM-DD format
                    dateOfBirthValue = date.toISOString().split('T')[0];
                }
            }
            // Remove dateOfBirth from processedData to handle separately
            delete processedData.dateOfBirth;
        }

        // Remove any undefined or null values to avoid database issues
        Object.keys(processedData).forEach(key => {
            if (processedData[key] === undefined || processedData[key] === null || processedData[key] === '') {
                delete processedData[key];
            }
        });

        console.log('Processed data for update:', processedData);

        // Update user data
        let updatedUser;
        if (Object.keys(processedData).length > 0) {
            [updatedUser] = await db
                .update(users)
                .set(processedData)
                .where(eq(users.id, userId!))
                .returning();
        } else {
            // If no other fields to update, just get the current user
            [updatedUser] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId!))
                .limit(1);
        }

        // Handle dateOfBirth separately if it was provided
        if (dateOfBirthValue !== null) {
            await db
                .update(users)
                .set({ dateOfBirth: dateOfBirthValue })
                .where(eq(users.id, userId!));

            // Get the updated user with the new dateOfBirth
            [updatedUser] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId!))
                .limit(1);
        }

        return res.status(200).json({
            success: true,
            user: updatedUser,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Failed to update user' });
    }
}

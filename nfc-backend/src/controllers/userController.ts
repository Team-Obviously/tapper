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
    isOpenToRelationships: z.boolean().optional(),
    resumeUrl: z.string().optional(),
});

// Define validation schema for user login
const loginUserSchema = z.object({
    email: z.string().email('Invalid email address'),
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
        // Convert boolean fields to string for database storage
        const userData = {
            ...parsed.data,
            isHiring: parsed.data.isHiring ? 'true' : 'false',
            isOpenToRelationships: parsed.data.isOpenToRelationships ? 'true' : 'false'
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

export async function loginUser(req: Request, res: Response) {
    console.log('LOGIN USER req.body', req.body);
    const parsed = loginUserSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email format',
            details: parsed.error.flatten()
        });
    }

    try {
        const { email } = parsed.data;

        // Find user by email
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'No user found with this email address'
            });
        }

        // Return user data (excluding sensitive information if any)
        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                location: user.location,
                interests: user.interests,
                skillLevel: user.skillLevel,
                availability: user.availability,
                company: user.company,
                position: user.position,
                experience: user.experience,
                isHiring: user.isHiring,
                isOpenToRelationships: user.isOpenToRelationships,
                resumeUrl: user.resumeUrl,
                data: user.data,
                createdAt: user.createdAt
            },
            message: 'Login successful'
        });
    } catch (error: any) {
        console.error('Error during login:', error);
        return res.status(500).json({
            success: false,
            error: 'Login failed',
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

    console.log('UPDATE USER - Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('UPDATE USER - User ID:', userId);

    try {
        // Check if user exists
        const [existingUser] = await db.select().from(users).where(eq(users.id, userId!));
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Process the update data - only allow specific fields to be updated
        const allowedFields = [
            'firstName', 'lastName', 'email', 'phone', 'location',
            'interests', 'skillLevel', 'availability', 'company',
            'position', 'experience', 'isHiring', 'isOpenToRelationships', 'resumeUrl'
        ];

        const processedData: any = {};

        // Only include allowed fields
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined && updateData[field] !== null && updateData[field] !== '') {
                processedData[field] = updateData[field];
            }
        });

        // Convert isHiring boolean to string if present
        if (processedData.isHiring !== undefined) {
            processedData.isHiring = processedData.isHiring.toString();
        }

        console.log('Processed data for update:', processedData);

        // Update user data
        const [updatedUser] = await db
            .update(users)
            .set(processedData)
            .where(eq(users.id, userId!))
            .returning();

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

import { db } from './db';
import { invitations } from './schema';

const userId = 'd0e8d4a2-0b2f-43e0-b1d5-9c20c6c074d7'; // Your user ID

// List of users from our seed data
const targetUserIds = [
    'bf0350c5-f3ba-4a75-a2d5-c4602f4e3ff8',
    'd9805a1d-e2af-428e-bc56-d2ef5a289e7e',
    '1c987f6b-06d7-4404-b45a-34c53cb5190b',
    '1b56f2ca-cd66-4efd-82f4-f9030d55689f',
    '338900ff-52ff-49d6-8250-987b80acd100',
    '4917370c-c858-476b-8bba-8d61f7b593cb',
    'ad5c434b-359c-4ba1-8463-2ace6f75f03a',
    'dfded687-714c-4de9-ac5f-99bef5de5af0',
    '327c947c-6221-44da-8b6d-d9ccbc08705e',
    '4dc33da8-e28e-4216-b9a8-c5b8224a6bab'
];

// Seed invitations for Basketball interest
const seedInvitations = async () => {
    try {
        console.log('🌱 Starting invitation seeding...');

        // Create invitations for Basketball
        const invitationsData = targetUserIds.map(toUserId => ({
            fromUserId: userId,
            toUserId,
            interest: 'Basketball',
            message: 'Hi! I noticed we both share an interest in Basketball. Would you like to connect?',
            status: 'pending'
        }));

        // Insert all invitations
        const insertedInvitations = await db.insert(invitations).values(invitationsData).returning();

        console.log(`✅ Created ${insertedInvitations.length} invitations for Basketball`);
        console.log('🎉 Invitation seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding invitations:', error);

        // If invitations already exist, that's okay
        if (error.message?.includes('duplicate key')) {
            console.log('ℹ️ Some invitations already exist in database');
        } else {
            throw error;
        }
    }
};

// Run the seed function
seedInvitations()
    .then(() => {
        console.log('✅ Invitation seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Invitation seeding failed:', error);
        process.exit(1);
    });

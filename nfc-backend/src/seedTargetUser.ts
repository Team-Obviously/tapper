import { db } from './db';
import { users, invitations, acceptedConnections } from './schema';
import { eq, and, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Target user ID
const TARGET_USER_ID = 'd0e8d4a2-0b2f-43e0-b1d5-9c20c6c074d7';

// Interests categories
const SPORTS_INTERESTS = ['Basketball', 'Tennis', 'Soccer', 'Running', 'Swimming', 'Volleyball', 'Golf', 'Cycling', 'Yoga'];
const PROFESSIONAL_INTERESTS = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'Product Management', 'UI/UX Design', 'Data Science'];
const HOBBY_INTERESTS = ['Photography', 'Cooking', 'Reading', 'Gaming', 'Music', 'Travel', 'Hiking', 'Painting'];
const SKILL_INTERESTS = ['Leadership', 'Public Speaking', 'Writing', 'Design', 'Marketing', 'Project Management'];

// Create connections and invitations for target user
const seedTargetUser = async () => {
    try {
        console.log(`🎯 Seeding data for target user: ${TARGET_USER_ID}`);

        // Check if target user exists
        const targetUser = await db.select().from(users).where(eq(users.id, TARGET_USER_ID)).limit(1);

        if (targetUser.length === 0) {
            console.error(`❌ Target user ${TARGET_USER_ID} not found in database`);
            return;
        }

        console.log(`✅ Found target user: ${targetUser[0].firstName} ${targetUser[0].lastName}`);

        // Get other users to create connections with
        const allUsers = await db.select().from(users).limit(50);
        const otherUsers = allUsers.filter(user => user.id !== TARGET_USER_ID);

        if (otherUsers.length < 10) {
            console.error(`❌ Not enough users in database to create connections`);
            return;
        }

        console.log(`✅ Found ${otherUsers.length} other users to create connections with`);

        // Create accepted connections for sports (target: ~11)
        const sportsConnections = [];
        for (let i = 0; i < 11; i++) {
            if (i >= otherUsers.length) break;

            const otherUser = otherUsers[i];
            const interest = SPORTS_INTERESTS[i % SPORTS_INTERESTS.length];

            sportsConnections.push({
                fromUserId: TARGET_USER_ID,
                toUserId: otherUser.id,
                interest,
                message: `I'd love to play ${interest} sometime!`,
                status: 'accepted',
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date in the last 30 days
                respondedAt: new Date()
            });
        }

        // Create accepted connections for professional interests (target: ~0)
        // We'll create a few pending invitations instead to match the screenshot
        const professionalInvitations = [];
        for (let i = 0; i < 3; i++) {
            if ((i + 11) >= otherUsers.length) break;

            const otherUser = otherUsers[i + 11];
            const interest = PROFESSIONAL_INTERESTS[i % PROFESSIONAL_INTERESTS.length];

            professionalInvitations.push({
                fromUserId: otherUser.id,
                toUserId: TARGET_USER_ID,
                interest,
                message: `I noticed your ${interest} skills and would like to connect!`,
                status: 'pending',
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random date in the last 7 days
                respondedAt: null
            });
        }

        // Create accepted connections for hobby interests (target: ~0)
        // We'll create a few pending invitations instead
        const hobbyInvitations = [];
        for (let i = 0; i < 3; i++) {
            if ((i + 14) >= otherUsers.length) break;

            const otherUser = otherUsers[i + 14];
            const interest = HOBBY_INTERESTS[i % HOBBY_INTERESTS.length];

            hobbyInvitations.push({
                fromUserId: TARGET_USER_ID,
                toUserId: otherUser.id,
                interest,
                message: `I see we both enjoy ${interest}!`,
                status: 'pending',
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random date in the last 7 days
                respondedAt: null
            });
        }

        // Create accepted connections for skills (target: ~0)
        // We'll create a few pending invitations instead
        const skillInvitations = [];
        for (let i = 0; i < 3; i++) {
            if ((i + 17) >= otherUsers.length) break;

            const otherUser = otherUsers[i + 17];
            const interest = SKILL_INTERESTS[i % SKILL_INTERESTS.length];

            skillInvitations.push({
                fromUserId: otherUser.id,
                toUserId: TARGET_USER_ID,
                interest,
                message: `I'm impressed by your ${interest} skills!`,
                status: 'pending',
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random date in the last 7 days
                respondedAt: null
            });
        }

        // Combine all invitations
        const allInvitations = [...sportsConnections, ...professionalInvitations, ...hobbyInvitations, ...skillInvitations];

        // Insert invitations
        console.log(`🌱 Creating ${allInvitations.length} invitations...`);

        let acceptedCount = 0;
        let pendingCount = 0;

        for (const invitation of allInvitations) {
            try {
                // Check if invitation already exists
                const existingInvitation = await db
                    .select()
                    .from(invitations)
                    .where(
                        and(
                            eq(invitations.fromUserId, invitation.fromUserId),
                            eq(invitations.toUserId, invitation.toUserId),
                            eq(invitations.interest, invitation.interest)
                        )
                    );

                if (existingInvitation.length > 0) {
                    console.log(`   - Invitation already exists between ${invitation.fromUserId} and ${invitation.toUserId} for ${invitation.interest}`);
                    continue;
                }

                // Insert invitation
                const [insertedInvitation] = await db
                    .insert(invitations)
                    .values({
                        id: uuidv4(),
                        fromUserId: invitation.fromUserId,
                        toUserId: invitation.toUserId,
                        interest: invitation.interest,
                        message: invitation.message,
                        status: invitation.status,
                        createdAt: invitation.createdAt,
                        respondedAt: invitation.respondedAt
                    })
                    .returning();

                if (invitation.status === 'accepted') {
                    acceptedCount++;

                    // Create accepted connection
                    const [acceptedConnection] = await db
                        .insert(acceptedConnections)
                        .values({
                            id: uuidv4(),
                            userId1: invitation.fromUserId,
                            userId2: invitation.toUserId,
                            sharedInterest: invitation.interest,
                            invitationId: insertedInvitation.id,
                            createdAt: invitation.createdAt
                        })
                        .returning();

                    console.log(`   ✅ Created accepted connection: ${invitation.fromUserId} ↔️ ${invitation.toUserId} (${invitation.interest})`);
                } else {
                    pendingCount++;
                    console.log(`   📩 Created pending invitation: ${invitation.fromUserId} → ${invitation.toUserId} (${invitation.interest})`);
                }
            } catch (error) {
                console.error(`   ❌ Error creating invitation:`, error);
            }
        }

        console.log(`\n✅ Successfully created ${acceptedCount} accepted connections and ${pendingCount} pending invitations`);

    } catch (error) {
        console.error('❌ Error seeding target user:', error);
    }
};

// Run the function
seedTargetUser()
    .then(() => {
        console.log('✅ Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });

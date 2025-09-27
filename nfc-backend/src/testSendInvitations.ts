import { db } from './db';
import { users } from './schema';
import axios from 'axios';
import { eq, and, or } from 'drizzle-orm';

// Load environment variables
require('dotenv').config();

// API URL - adjust as needed for your environment
const API_URL = 'http://localhost:3000';

// Test sending invitations based on preferences
const testSendInvitations = async () => {
    try {
        console.log('🔍 Finding users with different preferences...');

        // Get all users
        const allUsers = await db.select().from(users);
        console.log(`📊 Total users in database: ${allUsers.length}`);

        if (allUsers.length < 5) {
            console.log('❌ Not enough users in database to test invitations');
            return;
        }

        // Group users by preferences
        const hiringUsers = allUsers.filter(user => user.isHiring === 'true');
        const datingUsers = allUsers.filter(user => user.isOpenToRelationships === 'true');
        const bothUsers = allUsers.filter(user => user.isHiring === 'true' && user.isOpenToRelationships === 'true');
        const neitherUsers = allUsers.filter(user => user.isHiring === 'false' && user.isOpenToRelationships === 'false');

        console.log(`👥 Users by preference:`);
        console.log(`   - Hiring only: ${hiringUsers.length - bothUsers.length}`);
        console.log(`   - Dating only: ${datingUsers.length - bothUsers.length}`);
        console.log(`   - Both hiring and dating: ${bothUsers.length}`);
        console.log(`   - Neither hiring nor dating: ${neitherUsers.length}`);

        // Find target user (if provided)
        const targetUserId = process.argv[2];
        let targetUser = null;

        if (targetUserId) {
            targetUser = allUsers.find(user => user.id === targetUserId);
            if (!targetUser) {
                console.log(`❌ Target user with ID ${targetUserId} not found`);
                return;
            }
            console.log(`🎯 Target user found: ${targetUser.firstName} ${targetUser.lastName}`);
            console.log(`   - Hiring: ${targetUser.isHiring}, Dating: ${targetUser.isOpenToRelationships}`);
        } else {
            // Use a random user as target if none specified
            targetUser = allUsers[Math.floor(Math.random() * allUsers.length)];
            console.log(`🎯 Selected random target user: ${targetUser.firstName} ${targetUser.lastName}`);
            console.log(`   - ID: ${targetUser.id}`);
            console.log(`   - Hiring: ${targetUser.isHiring}, Dating: ${targetUser.isOpenToRelationships}`);
        }

        // Define test scenarios
        const testScenarios = [
            {
                name: 'Hiring user inviting candidate',
                condition: targetUser.isHiring === 'true',
                fromUser: targetUser,
                toUser: allUsers.find(user =>
                    user.id !== targetUser.id &&
                    user.isHiring === 'false'
                ),
                interest: 'JavaScript',
                message: 'I noticed your JavaScript skills and would like to connect professionally.'
            },
            {
                name: 'Dating user inviting potential match',
                condition: targetUser.isOpenToRelationships === 'true',
                fromUser: targetUser,
                toUser: allUsers.find(user =>
                    user.id !== targetUser.id &&
                    user.isOpenToRelationships === 'true'
                ),
                interest: 'Basketball',
                message: 'I saw we both like Basketball. Would you like to play sometime?'
            },
            {
                name: 'User receiving invitation from hiring manager',
                condition: targetUser.isHiring === 'false',
                fromUser: allUsers.find(user =>
                    user.id !== targetUser.id &&
                    user.isHiring === 'true'
                ),
                toUser: targetUser,
                interest: 'React',
                message: 'I'm looking for React developers.Would you be interested in discussing opportunities?'
            },
            {
                name: 'User receiving dating invitation',
                condition: true, // Everyone can receive dating invitations
                fromUser: allUsers.find(user =>
                    user.id !== targetUser.id &&
                    user.isOpenToRelationships === 'true'
                ),
                toUser: targetUser,
                interest: 'Tennis',
                message: 'I noticed we both like Tennis. Would you like to play a match sometime?'
            }
        ];

        // Run applicable test scenarios
        for (const scenario of testScenarios) {
            if (!scenario.condition || !scenario.fromUser || !scenario.toUser) {
                console.log(`⏭️ Skipping scenario "${scenario.name}" - conditions not met or users not found`);
                continue;
            }

            console.log(`\n🧪 Testing scenario: ${scenario.name}`);
            console.log(`   - From: ${scenario.fromUser.firstName} ${scenario.fromUser.lastName} (${scenario.fromUser.id})`);
            console.log(`   - To: ${scenario.toUser.firstName} ${scenario.toUser.lastName} (${scenario.toUser.id})`);
            console.log(`   - Interest: ${scenario.interest}`);

            try {
                // Send invitation using the API
                console.log(`   📤 Sending invitation...`);

                // Uncomment to actually send invitations via API
                /*
                const response = await axios.post(`${API_URL}/invitations`, {
                    fromUserId: scenario.fromUser.id,
                    toUserId: scenario.toUser.id,
                    interest: scenario.interest,
                    message: scenario.message
                });
                
                console.log(`   ✅ Invitation sent successfully: ${response.data.id}`);
                */

                // For now, just log what would be sent
                console.log(`   ℹ️ Would send invitation with data:`);
                console.log(`     - From: ${scenario.fromUser.id}`);
                console.log(`     - To: ${scenario.toUser.id}`);
                console.log(`     - Interest: ${scenario.interest}`);
                console.log(`     - Message: ${scenario.message}`);

            } catch (error) {
                console.error(`   ❌ Error sending invitation:`, error.response?.data || error.message);
            }
        }

        console.log('\n✅ Test scenarios completed');

    } catch (error) {
        console.error('❌ Error testing invitations:', error);
    }
};

// Run the function
testSendInvitations()
    .then(() => {
        console.log('✅ Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });

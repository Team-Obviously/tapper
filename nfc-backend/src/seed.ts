import { db } from './db';
import { users, userNfcs, connections, invitations, acceptedConnections } from './schema';
import { faker } from '@faker-js/faker';

// Generate realistic user data
const generateUsers = (count: number) => {
    const userList = [];
    for (let i = 0; i < count; i++) {
        userList.push({
            email: faker.internet.email(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            phone: faker.phone.number(),
            location: faker.location.city(),
            interests: JSON.stringify([
                faker.helpers.arrayElement(['Tennis', 'Basketball', 'Running', 'Swimming', 'Soccer']),
                faker.helpers.arrayElement(['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript']),
                faker.helpers.arrayElement(['Photography', 'Cooking', 'Reading', 'Gaming', 'Music']),
                faker.helpers.arrayElement(['Leadership', 'Public Speaking', 'Writing', 'Design', 'Marketing'])
            ]),
            skillLevel: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
            availability: faker.helpers.arrayElement(['Weekends', 'Evenings', 'Flexible', 'Mornings']),
            company: faker.company.name(),
            position: faker.person.jobTitle(),
            experience: faker.helpers.arrayElement(['0-2 years', '3-5 years', '6-10 years', '10+ years']),
            isHiring: faker.datatype.boolean() ? 'true' : 'false',
            resumeUrl: faker.internet.url(),
            data: JSON.stringify({
                bio: faker.lorem.paragraph(),
                linkedin: faker.internet.url(),
                github: faker.internet.url()
            })
        });
    }
    return userList;
};

// Generate NFC data for users
const generateNFCs = (userIds: string[]) => {
    const nfcList = [];
    for (const userId of userIds) {
        // Each user gets 1-3 NFC tags
        const nfcCount = faker.number.int({ min: 1, max: 3 });
        for (let i = 0; i < nfcCount; i++) {
            nfcList.push({
                userId,
                nfcId: `nfc_${faker.string.alphanumeric(10)}`,
                name: faker.helpers.arrayElement(['Personal', 'Work', 'Event', 'Networking']),
                data: JSON.stringify({
                    type: 'contact',
                    name: faker.person.fullName(),
                    email: faker.internet.email(),
                    phone: faker.phone.number(),
                    company: faker.company.name()
                }),
                isActive: faker.datatype.boolean() ? 'true' : 'false'
            });
        }
    }
    return nfcList;
};

// Generate connections between users
const generateConnections = (userIds: string[], nfcIds: string[]) => {
    const connectionList = [];
    const connectionCount = Math.min(50, userIds.length * 2); // Generate some connections

    for (let i = 0; i < connectionCount; i++) {
        const fromUserId = faker.helpers.arrayElement(userIds);
        const toUserId = faker.helpers.arrayElement(userIds.filter(id => id !== fromUserId));
        const fromNfcId = faker.helpers.arrayElement(nfcIds);
        const toNfcId = faker.helpers.arrayElement(nfcIds.filter(id => id !== fromNfcId));

        connectionList.push({
            fromUserId,
            toUserId,
            fromNfcId,
            toNfcId,
            data: JSON.stringify({
                meetingLocation: faker.location.city(),
                meetingType: faker.helpers.arrayElement(['Conference', 'Meetup', 'Coffee', 'Lunch', 'Event']),
                notes: faker.lorem.sentence()
            })
        });
    }
    return connectionList;
};

// Generate invitations
const generateInvitations = (userIds: string[]) => {
    const invitationList = [];
    const invitationCount = Math.min(30, userIds.length);

    for (let i = 0; i < invitationCount; i++) {
        const fromUserId = faker.helpers.arrayElement(userIds);
        const toUserId = faker.helpers.arrayElement(userIds.filter(id => id !== fromUserId));
        const interest = faker.helpers.arrayElement(['Tennis', 'JavaScript', 'Photography', 'Leadership', 'React', 'Basketball']);
        const status = faker.helpers.arrayElement(['pending', 'accepted', 'rejected']);

        invitationList.push({
            fromUserId,
            toUserId,
            interest,
            message: faker.lorem.sentence(),
            status,
            respondedAt: status !== 'pending' ? faker.date.recent() : null
        });
    }
    return invitationList;
};

// Generate accepted connections
const generateAcceptedConnections = (userIds: string[], invitationIds: string[]) => {
    const acceptedList = [];
    const acceptedCount = Math.min(20, userIds.length);

    for (let i = 0; i < acceptedCount; i++) {
        const userId1 = faker.helpers.arrayElement(userIds);
        const userId2 = faker.helpers.arrayElement(userIds.filter(id => id !== userId1));
        const sharedInterest = faker.helpers.arrayElement(['Tennis', 'JavaScript', 'Photography', 'Leadership', 'React']);

        acceptedList.push({
            userId1,
            userId2,
            sharedInterest,
            invitationId: faker.helpers.arrayElement(invitationIds)
        });
    }
    return acceptedList;
};

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Generate 50 users
        console.log('👥 Generating users...');
        const userData = generateUsers(50);
        const insertedUsers = await db.insert(users).values(userData).returning();
        console.log(`✅ Created ${insertedUsers.length} users`);

        // Generate NFCs for users
        console.log('📱 Generating NFC tags...');
        const userIds = insertedUsers.map(user => user.id);
        const nfcData = generateNFCs(userIds);
        const insertedNFCs = await db.insert(userNfcs).values(nfcData).returning();
        console.log(`✅ Created ${insertedNFCs.length} NFC tags`);

        // Generate connections
        console.log('🔗 Generating connections...');
        const nfcIds = insertedNFCs.map(nfc => nfc.nfcId);
        const connectionData = generateConnections(userIds, nfcIds);
        const insertedConnections = await db.insert(connections).values(connectionData).returning();
        console.log(`✅ Created ${insertedConnections.length} connections`);

        // Generate invitations
        console.log('📨 Generating invitations...');
        const invitationData = generateInvitations(userIds);
        const insertedInvitations = await db.insert(invitations).values(invitationData).returning();
        console.log(`✅ Created ${insertedInvitations.length} invitations`);

        // Generate accepted connections
        console.log('🤝 Generating accepted connections...');
        const invitationIds = insertedInvitations.map(inv => inv.id);
        const acceptedData = generateAcceptedConnections(userIds, invitationIds);
        const insertedAccepted = await db.insert(acceptedConnections).values(acceptedData).returning();
        console.log(`✅ Created ${insertedAccepted.length} accepted connections`);

        console.log('🎉 Database seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Users: ${insertedUsers.length}`);
        console.log(`   - NFC Tags: ${insertedNFCs.length}`);
        console.log(`   - Connections: ${insertedConnections.length}`);
        console.log(`   - Invitations: ${insertedInvitations.length}`);
        console.log(`   - Accepted Connections: ${insertedAccepted.length}`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Run the seed function
seedDatabase()
    .then(() => {
        console.log('✅ Seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });

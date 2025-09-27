import { db } from './scriptDb';
import { users } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

dotenv.config();

// Define categories for users
const categories = {
    DATING_ONLY: 'dating_only',
    HIRING_ONLY: 'hiring_only',
    BOTH: 'both',
    NEITHER: 'neither'
};

// Define sports and professional interests
const sportsInterests = [
    'Basketball', 'Tennis', 'Football', 'Soccer', 'Baseball',
    'Volleyball', 'Swimming', 'Running', 'Cycling', 'Golf',
    'Hockey', 'Cricket', 'Badminton', 'Table Tennis', 'Boxing',
    'MMA', 'Yoga', 'Pilates', 'Rock Climbing', 'Surfing'
];

const professionalInterests = [
    'Leadership', 'Public Speaking', 'Writing', 'Design', 'Marketing',
    'Project Management', 'Data Analysis', 'AI', 'Blockchain', 'Web Development',
    'Mobile Development', 'UX/UI', 'Product Management', 'Sales', 'Finance'
];

const hobbyInterests = [
    'Photography', 'Cooking', 'Reading', 'Gaming', 'Music',
    'Travel', 'Hiking', 'Painting', 'Dancing', 'Gardening',
    'Movies', 'Theater', 'Wine Tasting', 'Craft Beer', 'Coffee'
];

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const availabilityOptions = ['Weekdays', 'Weekends', 'Evenings', 'Flexible'];
const experienceLevels = ['entry', 'mid', 'senior', 'executive'];

// Generate a random user with specific category
const generateUser = (category) => {
    // Determine dating and hiring preferences based on category
    const isOpenToRelationships = category === categories.DATING_ONLY || category === categories.BOTH ? 'true' : 'false';
    const isHiring = category === categories.HIRING_ONLY || category === categories.BOTH ? 'true' : 'false';

    // Generate random interests with at least one from each category if applicable
    const interests = [];

    // Add at least one sport interest
    interests.push(faker.helpers.arrayElement(sportsInterests));

    // Add more random interests
    if (Math.random() > 0.3) interests.push(faker.helpers.arrayElement(sportsInterests));
    if (Math.random() > 0.5) interests.push(faker.helpers.arrayElement(professionalInterests));
    if (Math.random() > 0.4) interests.push(faker.helpers.arrayElement(hobbyInterests));

    // Ensure Basketball is included for some users to match existing data
    if (category === categories.BOTH || Math.random() > 0.7) {
        if (!interests.includes('Basketball')) {
            interests.push('Basketball');
        }
    }

    // Create bio based on preferences
    let bio = faker.lorem.paragraph(2);
    if (isOpenToRelationships === 'true') {
        bio += ' ' + faker.helpers.arrayElement([
            'Looking to meet new people and explore dating opportunities.',
            'Open to meaningful connections and relationships.',
            'Interested in dating and getting to know new people.',
            'Hoping to find someone special to share experiences with.'
        ]);
    }

    if (isHiring === 'true') {
        bio += ' ' + faker.helpers.arrayElement([
            'Currently hiring for my team.',
            'Looking for talented professionals to join our company.',
            'Actively recruiting for open positions.',
            'Seeking skilled individuals for new opportunities.'
        ]);
    }

    return {
        id: uuidv4(),
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        interests: JSON.stringify([...new Set(interests)]), // Remove duplicates
        skillLevel: faker.helpers.arrayElement(skillLevels),
        availability: faker.helpers.arrayElement(availabilityOptions),
        company: faker.company.name(),
        position: faker.person.jobTitle(),
        experience: faker.helpers.arrayElement(experienceLevels),
        isHiring,
        isOpenToRelationships,
        data: JSON.stringify({
            bio,
            linkedin: `https://linkedin.com/in/${faker.internet.userName()}`,
            github: Math.random() > 0.5 ? `https://github.com/${faker.internet.userName()}` : undefined
        })
    };
};

// Generate users for each category
const generateTestUsers = (count = 20) => {
    const users = [];

    // Ensure we have at least 5 users in each category
    const minPerCategory = 5;

    // Dating only users
    for (let i = 0; i < minPerCategory; i++) {
        users.push(generateUser(categories.DATING_ONLY));
    }

    // Hiring only users
    for (let i = 0; i < minPerCategory; i++) {
        users.push(generateUser(categories.HIRING_ONLY));
    }

    // Both dating and hiring
    for (let i = 0; i < minPerCategory; i++) {
        users.push(generateUser(categories.BOTH));
    }

    // Neither dating nor hiring
    for (let i = 0; i < minPerCategory; i++) {
        users.push(generateUser(categories.NEITHER));
    }

    // Add remaining users with random categories
    const remainingCount = count - (minPerCategory * 4);
    for (let i = 0; i < remainingCount; i++) {
        const randomCategory = faker.helpers.arrayElement(Object.values(categories));
        users.push(generateUser(randomCategory));
    }

    return users;
};

// Generate test users
const testUsers = generateTestUsers(30);


const seedTestUsers = async () => {
    try {
        console.log('🌱 Seeding test users with relationship and hiring preferences...');

        // Insert test users into database
        let insertedCount = 0;
        let skippedCount = 0;

        for (const user of testUsers) {
            try {
                await db.insert(users)
                    .values(user)
                    .onConflictDoNothing({ target: users.email });

                // Check if the user was inserted
                const checkUser = await db.select().from(users).where(users.email.equals(user.email));
                if (checkUser.length > 0 && checkUser[0].id === user.id) {
                    insertedCount++;
                    console.log(`✅ Inserted: ${user.firstName} ${user.lastName} (${user.email})`);
                    console.log(`   - Hiring: ${user.isHiring}, Dating: ${user.isOpenToRelationships}`);
                } else {
                    skippedCount++;
                }
            } catch (error) {
                console.error(`❌ Failed to insert user: ${user.email}`, error);
            }
        }

        console.log(`\n✅ Successfully seeded ${insertedCount} new test users`);
        console.log(`ℹ️ Skipped ${skippedCount} existing users`);

    } catch (error) {
        console.error('❌ Error seeding test users:', error);
    }
};

// Run the seed function
seedTestUsers()
    .then(() => {
        console.log('✅ Seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
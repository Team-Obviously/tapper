import { db } from './db';
import { users } from './schema';

const addCurrentUser = async () => {
    try {
        console.log('👤 Adding current user to database...');

        const currentUser = {
            id: 'd0e8d4a2-0b2f-43e0-b1d5-9c20c6c074d7',
            email: 'tempgmail@gmail.cm',
            firstName: 'soham',
            lastName: 'bhoir',
            phone: '+1234567890',
            location: 'Delhi, India',
            interests: JSON.stringify(['Tennis', 'JavaScript', 'React', 'Photography', 'Leadership']),
            skillLevel: 'Advanced',
            availability: 'Flexible',
            company: 'Tech Corp',
            position: 'Full Stack Developer',
            experience: '5+ years',
            isHiring: 'false',
            resumeUrl: 'https://example.com/resume.pdf',
            data: JSON.stringify({
                bio: 'Passionate developer and networking enthusiast',
                linkedin: 'https://linkedin.com/in/soham-bhoir',
                github: 'https://github.com/soham-bhoir'
            })
        };

        const insertedUser = await db.insert(users).values(currentUser).returning();
        console.log('✅ Current user added successfully:', insertedUser[0]);

    } catch (error) {
        console.error('❌ Error adding current user:', error);
        // If user already exists, that's okay
        if (error.message?.includes('duplicate key')) {
            console.log('ℹ️ User already exists in database');
        } else {
            throw error;
        }
    }
};

addCurrentUser()
    .then(() => {
        console.log('✅ Current user setup completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Current user setup failed:', error);
        process.exit(1);
    });

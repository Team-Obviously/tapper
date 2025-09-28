import axios from 'axios';

export class ClaudeService {
    private apiKey: string;
    private baseUrl = 'https://api.anthropic.com/v1/messages';

    constructor() {
        this.apiKey = process.env.CLAUDE_API || '';
        if (!this.apiKey) {
            throw new Error('CLAUDE_API environment variable is required');
        }
    }

    /**
     * Generate a personalized message based on similarity analysis
     */
    async generatePersonalizedMessage(
        fromUser: {
            firstName: string;
            interests: any;
            company: string | null;
            position: string | null;
        },
        toUser: {
            firstName: string;
            interests: any;
            company: string | null;
            position: string | null;
            resumeContent?: string;
        },
        messageType: 'sports' | 'career' | 'relationship',
        sharedInterests: string[]
    ): Promise<string> {
        const prompt = this.buildPrompt(fromUser, toUser, messageType, sharedInterests);

        try {
            const response = await axios.post(this.baseUrl, {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            });

            return response.data.content[0]?.text || 'Hello! I noticed we have some things in common and would love to connect.';
        } catch (error) {
            console.error('Error calling Claude API:', error);
            throw new Error('Failed to generate personalized message');
        }
    }

    private buildPrompt(
        fromUser: any,
        toUser: any,
        messageType: 'sports' | 'career' | 'relationship',
        sharedInterests: string[]
    ): string {
        const fromName = fromUser.firstName || 'there';
        const toName = toUser.firstName || 'there';

        switch (messageType) {
            case 'sports':
                return this.buildSportsPrompt(fromName, toName, sharedInterests);
            case 'career':
                return this.buildCareerPrompt(fromName, toName, fromUser, toUser);
            case 'relationship':
                return this.buildRelationshipPrompt(fromName, toName, sharedInterests);
            default:
                return this.buildDefaultPrompt(fromName, toName);
        }
    }

    private buildSportsPrompt(fromName: string, toName: string, sharedInterests: string[]): string {
        const interests = sharedInterests.join(', ');
        return `Generate a friendly, casual message for ${fromName} to send to ${toName} on Telegram. 

Context:
- ${fromName} wants to connect with ${toName} about shared sports interests
- They both enjoy: ${interests}
- The message should suggest planning a meetup or activity related to these sports
- Keep it casual, friendly, and not pushy
- Make it sound natural and conversational
- Include a specific suggestion for an activity or meetup
- Keep it under 150 words

The message should be ready to send directly on Telegram.`;
    }

    private buildCareerPrompt(fromName: string, toName: string, fromUser: any, toUser: any): string {
        const fromCompany = fromUser.company || 'my company';
        const fromPosition = fromUser.position || 'my role';
        const toCompany = toUser.company || 'your company';
        const toPosition = toUser.position || 'your role';
        
        let resumeContext = '';
        if (toUser.resumeContent) {
            resumeContext = `\n\nAdditional context from ${toName}'s resume:\n${toUser.resumeContent}`;
        }

        return `Generate a professional yet friendly message for ${fromName} to send to ${toName} on Telegram.

Context:
- ${fromName} works as ${fromPosition} at ${fromCompany}
- ${toName} works as ${toPosition} at ${toCompany}
- They want to connect professionally and potentially collaborate
- The message should be professional but not overly formal
- Suggest a specific way to work together or collaborate
- Keep it under 150 words
- Make it sound genuine and not like a sales pitch${resumeContext}

The message should be ready to send directly on Telegram.`;
    }

    private buildRelationshipPrompt(fromName: string, toName: string, sharedInterests: string[]): string {
        const interests = sharedInterests.join(', ');
        return `Generate a warm, friendly message for ${fromName} to send to ${toName} on Telegram.

Context:
- ${fromName} wants to connect with ${toName} on a personal level
- They share interests in: ${interests}
- The message should be warm and friendly but not creepy or overly romantic
- It should break the ice for a potential friendship or relationship
- Keep it casual, genuine, and respectful
- Make it sound natural and not like a pickup line
- Keep it under 150 words
- Focus on shared interests and genuine connection

The message should be ready to send directly on Telegram.`;
    }

    private buildDefaultPrompt(fromName: string, toName: string): string {
        return `Generate a friendly, casual message for ${fromName} to send to ${toName} on Telegram.

Context:
- ${fromName} wants to connect with ${toName}
- The message should be friendly and genuine
- Keep it casual and not pushy
- Make it sound natural and conversational
- Keep it under 150 words

The message should be ready to send directly on Telegram.`;
    }
}

export const claudeService = new ClaudeService();

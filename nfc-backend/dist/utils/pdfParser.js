import axios from 'axios';
import * as pdf from 'pdf-parse';
export class PDFParser {
    /**
     * Parse PDF content from a URL
     */
    async parsePDFFromUrl(url) {
        try {
            // Fetch the PDF file
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30 second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            // Parse the PDF
            const pdfData = await pdf(response.data);
            // Clean up the text
            let text = pdfData.text;
            // Remove excessive whitespace and normalize
            text = text.replace(/\s+/g, ' ').trim();
            // Remove common PDF artifacts
            text = text.replace(/\f/g, ''); // Remove form feeds
            text = text.replace(/\r\n/g, '\n'); // Normalize line endings
            text = text.replace(/\n\s*\n/g, '\n'); // Remove empty lines
            return text;
        }
        catch (error) {
            console.error('Error parsing PDF from URL:', error);
            throw new Error(`Failed to parse PDF from URL: ${url}`);
        }
    }
    /**
     * Extract key information from resume text
     */
    extractResumeInfo(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const skills = [];
        const experience = [];
        const education = [];
        let currentSection = '';
        let summary = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            // Detect sections
            if (line.includes('skills') || line.includes('technical skills') || line.includes('competencies')) {
                currentSection = 'skills';
                continue;
            }
            else if (line.includes('experience') || line.includes('work history') || line.includes('employment')) {
                currentSection = 'experience';
                continue;
            }
            else if (line.includes('education') || line.includes('academic') || line.includes('degree')) {
                currentSection = 'education';
                continue;
            }
            else if (line.includes('summary') || line.includes('profile') || line.includes('objective')) {
                currentSection = 'summary';
                continue;
            }
            // Extract content based on current section
            if (currentSection === 'skills' && lines[i].length > 0) {
                // Split by common delimiters
                const skillItems = lines[i].split(/[,;|•\-\n]/)
                    .map(skill => skill.trim())
                    .filter(skill => skill.length > 0 && skill.length < 50);
                skills.push(...skillItems);
            }
            else if (currentSection === 'experience' && lines[i].length > 0) {
                experience.push(lines[i]);
            }
            else if (currentSection === 'education' && lines[i].length > 0) {
                education.push(lines[i]);
            }
            else if (currentSection === 'summary' && lines[i].length > 0) {
                summary += lines[i] + ' ';
            }
        }
        // Clean up and limit results
        return {
            skills: [...new Set(skills)].slice(0, 20), // Remove duplicates and limit
            experience: experience.slice(0, 10),
            education: education.slice(0, 5),
            summary: summary.trim().substring(0, 500) // Limit summary length
        };
    }
    /**
     * Parse resume and return structured data
     */
    async parseResume(url) {
        try {
            const fullText = await this.parsePDFFromUrl(url);
            const extractedInfo = this.extractResumeInfo(fullText);
            return {
                fullText: fullText.substring(0, 2000), // Limit full text for Claude context
                ...extractedInfo
            };
        }
        catch (error) {
            console.error('Error parsing resume:', error);
            throw error;
        }
    }
}
export const pdfParser = new PDFParser();

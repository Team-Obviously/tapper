import { Tusky } from "@tusky-io/ts-sdk/web";

// Initialize Tusky with API key from environment
const tusky = new Tusky({
    apiKey: import.meta.env.VITE_WALRUS_API_KEY
});

// Cache for vault ID to avoid creating multiple vaults
let resumeVaultId: string | null = null;

export interface UploadResult {
    success: boolean;
    fileBuffer?: ArrayBuffer;
    error?: string;
}

/**
 * Upload a file using Tusky and return the public URL
 * @param file - The file to upload
 * @param fileName - Optional custom filename
 * @returns Promise with upload result
 */
export const uploadFileWithTusky = async (
    file: File,
    _fileName?: string
): Promise<UploadResult> => {
    try {
        console.log('Starting Tusky upload for file:', file.name);

        // Step 1: Get or create a public vault for resume uploads
        // Cache the vault ID to avoid creating multiple vaults
        let vaultId = resumeVaultId;

        if (!vaultId) {
            console.log('Creating new vault for resume uploads...');
            const vaultResult = await tusky.vault.create("Resume Uploads", { encrypted: false });
            vaultId = vaultResult.id;
            resumeVaultId = vaultId; // Cache the vault ID
            console.log('Created vault with ID:', vaultId);
        } else {
            console.log('Using existing vault with ID:', vaultId);
        }

        // Step 2: Upload file to the vault
        // For web environment, we need to handle the File object properly
        // The Tusky SDK expects a file path, but in browser we have a File object
        // We'll need to create a temporary file or use a different approach

        // For now, let's try a different approach - using the file directly
        // This might need adjustment based on the actual SDK implementation
        const uploadId = await tusky.file.upload(vaultId, file);
        console.log('File uploaded with ID:', uploadId);

        // Step 3: Get file metadata to retrieve the public URL
        const fileBuffer = await tusky.file.arrayBuffer(uploadId);
        console.log('File metadata:', fileBuffer);

    
        return {
            success: true,
            fileBuffer: fileBuffer
        };

    } catch (error) {
        console.error('Tusky upload failed:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Validate file before upload
 * @param file - The file to validate
 * @param maxSizeInMB - Maximum file size in MB (default: 10MB)
 * @param allowedTypes - Allowed file types (default: PDF, DOC, DOCX)
 * @returns Validation result
 */
export const validateFile = (
    file: File,
    maxSizeInMB: number = 10,
    allowedTypes: string[] = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
): { valid: boolean; error?: string } => {

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return {
            valid: false,
            error: `File size must be less than ${maxSizeInMB}MB`
        };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Only PDF, DOC, and DOCX files are allowed'
        };
    }

    return { valid: true };
};

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns Human readable file size
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * List all uploaded files (for debugging/admin purposes)
 * @returns Promise with list of files
 */
export const listAllFiles = async () => {
    try {
        const files = await tusky.file.listAll();
        console.log('All files:', files);
        return files;
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
};

/**
 * Download file buffer (for testing purposes)
 * @param uploadId - The upload ID from Tusky
 * @returns Promise with file buffer
 */
export const downloadFileBuffer = async (uploadId: string) => {
    try {
        const fileBuffer = await tusky.file.arrayBuffer(uploadId);
        console.log('Downloaded file buffer:', fileBuffer);
        return fileBuffer;
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
};

/**
 * Get file metadata by upload ID
 * @param uploadId - The upload ID from Tusky
 * @returns Promise with file metadata
 */
export const getFileMetadata = async (uploadId: string) => {
    try {
        const fileMetadata = await tusky.file.get(uploadId);
        console.log('File metadata:', fileMetadata);
        return fileMetadata;
    } catch (error) {
        console.error('Error getting file metadata:', error);
        throw error;
    }
};

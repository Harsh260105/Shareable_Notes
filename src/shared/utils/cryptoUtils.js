import CryptoJS from 'crypto-js';

// Encrypt note content with AES-256
export const encryptContent = (content, password) => {
    try {
        if (!content || !password) {
            throw new Error('Content and password are required for encryption');
        }

        console.log(`Encrypting content of length: ${content.length}`);

        // Ensure we're working with a clean string (no undefined, etc.)
        const cleanContent = String(content);

        // Perform encryption
        const encrypted = CryptoJS.AES.encrypt(cleanContent, password).toString();

        console.log(`Encryption complete. Encrypted length: ${encrypted.length}`);
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt content: ' + error.message);
    }
};

// Decrypt note content
export const decryptContent = (encryptedContent, password) => {
    try {
        if (!encryptedContent || !password) {
            throw new Error('Encrypted content and password are required for decryption');
        }

        console.log(`Decrypting content of length: ${encryptedContent.length}`);

        // Perform decryption
        const bytes = CryptoJS.AES.decrypt(encryptedContent, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        // Validate decrypted content
        if (!decrypted) {
            throw new Error('Decryption produced empty result. The password may be incorrect.');
        }

        console.log(`Decryption complete. Decrypted length: ${decrypted.length}`);
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt content. The password may be incorrect.');
    }
};

// Password strength calculator
export const calculatePasswordStrength = (password) => {
    if (!password) return 0;

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety check
    if (/[a-z]/.test(password)) score += 1; // Has lowercase
    if (/[A-Z]/.test(password)) score += 1; // Has uppercase
    if (/[0-9]/.test(password)) score += 1; // Has numbers
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; // Has special chars

    // Complexity check
    if (
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password)
    ) {
        score += 2;
    }

    // Convert score to a percentage (out of 8 possible points)
    return Math.min(Math.floor((score / 8) * 100), 100);
};

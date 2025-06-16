import CryptoJS from 'crypto-js';

export const encryptContent = (content, password) => {
    try {
        if (!content || !password) {
            throw new Error('Content and password are required for encryption');
        }

        const cleanContent = String(content);
        const encrypted = CryptoJS.AES.encrypt(cleanContent, password).toString();
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt content: ' + error.message);
    }
};

export const decryptContent = (encryptedContent, password) => {
    try {
        if (!encryptedContent || !password) {
            throw new Error('Encrypted content and password are required for decryption');
        }

        const bytes = CryptoJS.AES.decrypt(encryptedContent, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            throw new Error('Decryption produced empty result. The password may be incorrect.');
        }

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt content. The password may be incorrect.');
    }
};

export const calculatePasswordStrength = (password) => {
    if (!password) return 0;

    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password)
    ) {
        score += 2;
    }

    return Math.min(Math.floor((score / 8) * 100), 100);
};

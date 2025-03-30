/**
 * Utility functions for the application
 */
import Config from './Config.js';

class Utils {
    /**
     * Format a phone number
     * @param {string} phoneNumber - Raw phone number
     * @returns {string} Formatted phone number
     */
    static formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';
        
        const cleaned = String(phoneNumber).replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
        } else if (cleaned.length === 11) {
            return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
        }
        
        return cleaned;
    }
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Whether the email is valid
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {boolean} Whether the password is valid
     */
    static isValidPassword(password) {
        // At least 6 characters
        return password && password.length >= 6;
    }
    
    /**
     * Log debug messages
     * @param  {...any} args - Arguments to log
     */
    static debug(...args) {
        if (Config.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    }
}

export default Utils;
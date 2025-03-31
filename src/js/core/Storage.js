/**
 * Storage service for handling localStorage operations
 */
import Config from './Config.js';

class Storage {
    /**
     * Get auth token from local storage
     * @returns {string|null} The token or null
     */
    static getAuthToken() {
        return localStorage.getItem(Config.STORAGE.TOKEN);
    }
    
    /**
     * Set auth token in local storage
     * @param {string} token - The token to store
     */
    static setAuthToken(token) {
        localStorage.setItem(Config.STORAGE.TOKEN, token);
    }
    
    /**
     * Remove auth token from local storage
     */
    static removeAuthToken() {
        localStorage.removeItem(Config.STORAGE.TOKEN);
    }
    
    /**
     * Get user data from local storage
     * @returns {Object|null} User data or null
     */
    static getUser() {
        const userJson = localStorage.getItem(Config.STORAGE.USER);
        return userJson ? JSON.parse(userJson) : null;
    }
    
    /**
     * Set user data in local storage
     * @param {Object} user - User data to store
     */
    static setUser(user) {
        localStorage.setItem(Config.STORAGE.USER, JSON.stringify(user));
    }
    
    /**
     * Remove user data from local storage
     */
    static removeUser() {
        localStorage.removeItem(Config.STORAGE.USER);
    }
    
  /**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
static isAuthenticated() {
    const token = this.getAuthToken();
    return !!token;
}
}

export default Storage;
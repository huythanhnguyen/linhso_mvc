/**
 * User Model
 */
class UserModel {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.email = data.email || '';
        this.createdAt = data.createdAt || null;
        this.lastLogin = data.lastLogin || null;
    }
    
    /**
     * Check if user is valid
     * @returns {boolean} Whether the user is valid
     */
    isValid() {
        return !!this.email;
    }
    
    /**
     * Convert to plain object
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin
        };
    }
}

export default UserModel;
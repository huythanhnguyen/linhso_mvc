/**
 * Authentication Controller
 */
import AuthService from '../services/AuthService.js';
import EventBus from '../core/EventBus.js';
import Utils from '../core/Utils.js';

class AuthController {
    constructor() {
        this.initialized = false;
        this.authenticating = false;
    }
    
    /**
     * Initialize the controller
     */
    async init() {
        if (this.initialized) return;
        
        try {
            this.authenticating = true;
            const result = await AuthService.init();
            this.authenticating = false;
            
            // Notify views about initial auth state
            EventBus.publish('auth:initialized', result);
            
            this.initialized = true;
            return result;
        } catch (error) {
            console.error('Error initializing auth controller:', error);
            this.authenticating = false;
            
            // Publish error event
            EventBus.publish('auth:error', { message: error.message });
            
            return { authenticated: false, error };
        }
    }
    
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                EventBus.publish('auth:error', { message: 'Email và mật khẩu không được trống' });
                return { success: false, error: 'Email và mật khẩu không được trống' };
            }
            
            if (!Utils.isValidEmail(email)) {
                EventBus.publish('auth:error', { message: 'Email không hợp lệ' });
                return { success: false, error: 'Email không hợp lệ' };
            }
            
            // Publish login started event
            EventBus.publish('auth:loginStarted');
            
            const result = await AuthService.login(email, password);
            
            if (result.success) {
                // Login successful, redirect or update UI
                EventBus.publish('auth:loginSuccess', result);
            } else {
                // Login failed, show error
                EventBus.publish('auth:loginFailed', result);
            }
            
            return result;
        } catch (error) {
            const errorResult = { success: false, error: error.message };
            EventBus.publish('auth:loginFailed', errorResult);
            return errorResult;
        }
    }
    
    /**
     * Register a new user
     * @param {string} name - User name
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async register(name, email, password) {
        try {
            // Validate inputs
            if (!name || !email || !password) {
                EventBus.publish('auth:error', { message: 'Vui lòng điền đầy đủ thông tin' });
                return { success: false, error: 'Vui lòng điền đầy đủ thông tin' };
            }
            
            if (!Utils.isValidEmail(email)) {
                EventBus.publish('auth:error', { message: 'Email không hợp lệ' });
                return { success: false, error: 'Email không hợp lệ' };
            }
            
            if (!Utils.isValidPassword(password)) {
                EventBus.publish('auth:error', { message: 'Mật khẩu phải có ít nhất 6 ký tự' });
                return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
            }
            
            // Publish register started event
            EventBus.publish('auth:registerStarted');
            
            const result = await AuthService.register(name, email, password);
            
            if (result.success) {
                // Registration successful, redirect or update UI
                EventBus.publish('auth:registerSuccess', result);
            } else {
                // Registration failed, show error
                EventBus.publish('auth:registerFailed', result);
            }
            
            return result;
        } catch (error) {
            const errorResult = { success: false, error: error.message };
            EventBus.publish('auth:registerFailed', errorResult);
            return errorResult;
        }
    }
    
    /**
     * Logout the current user
     */
    async logout() {
        try {
            // Publish logout started event
            EventBus.publish('auth:logoutStarted');
            
            const result = await AuthService.logout();
            
            // Publish logout success event
            EventBus.publish('auth:logoutSuccess');
            
            return result;
        } catch (error) {
            // Publish logout failed event
            EventBus.publish('auth:logoutFailed', { error: error.message });
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            // Validate inputs
            if (!currentPassword || !newPassword) {
                EventBus.publish('auth:error', { message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
                return { success: false, error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' };
            }
            
            if (!Utils.isValidPassword(newPassword)) {
                EventBus.publish('auth:error', { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
                return { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
            }
            
            // Publish password change started event
            EventBus.publish('auth:passwordChangeStarted');
            
            const result = await AuthService.changePassword(currentPassword, newPassword);
            
            if (result.success) {
                // Password change successful
                EventBus.publish('auth:passwordChangeSuccess');
            } else {
                // Password change failed
                EventBus.publish('auth:passwordChangeFailed', result);
            }
            
            return result;
        } catch (error) {
            const errorResult = { success: false, error: error.message };
            EventBus.publish('auth:passwordChangeFailed', errorResult);
            return errorResult;
        }
    }
    
    /**
     * Get the current authenticated user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return AuthService.getCurrentUser();
    }
    
    /**
     * Check if a user is authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    isAuthenticated() {
        return AuthService.isAuthenticated();
    }
    
    /**
     * Check if authentication is in progress
     * @returns {boolean} True if authenticating, false otherwise
     */
    isAuthenticating() {
        return this.authenticating;
    }
}

// Create a singleton instance
const authController = new AuthController();
export default authController;
/**
 * Authentication Service for Phone Analysis App
 * Handles user authentication, registration, and session management
 */
import ApiService from './ApiService.js';
import Storage from '../core/Storage.js';
import UserModel from '../models/UserModel.js';
import EventBus from '../core/EventBus.js';
import Utils from '../core/Utils.js';

class AuthService {
    // Current authenticated user
    static currentUser = null;
    
    /**
     * Initialize the auth service
     * @returns {Promise} Initialization result
     */
    static async init() {
        try {
            // Get user from local storage
            const storedUser = Storage.getUser();
            const token = Storage.getAuthToken();
            
            if (token && storedUser) {
                this.currentUser = storedUser;
                
                // Thêm xử lý timeout cho verifyToken
                try {
                    // Sử dụng Promise với timeout
                    const verifyPromise = ApiService.verifyToken();
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => {
                            reject(new Error('Token verification timeout'));
                        }, 3000); // 3 giây là đủ cho việc xác thực token
                    });
                    
                    // Chạy cả hai promise với Promise.race
                    const { valid, user } = await Promise.race([verifyPromise, timeoutPromise]);
                    
                    if (valid && user) {
                        // Update the user data with the latest from the server
                        this.currentUser = user;
                        Storage.setUser(user);
                        
                        return { authenticated: true, user };
                    } else {
                        // Token is invalid, log the user out
                        await this.logout(false); // Không gửi request đến server
                        return { authenticated: false };
                    }
                } catch (error) {
                    // Xử lý timeout hoặc lỗi xác thực khác
                    Utils.debug('Error verifying token:', error);
                    
                    // Nếu là lỗi timeout, sử dụng thông tin hiện có
                    if (error.message === 'Token verification timeout' || error.message === 'Request timeout') {
                        Utils.debug('Using cached user data due to server timeout');
                        return { authenticated: true, user: this.currentUser };
                    }
                    
                    // Nếu là lỗi khác, đăng xuất
                    await this.logout(false);
                    return { authenticated: false, error };
                }
            }
            
            return { authenticated: false };
        } catch (error) {
            Utils.debug('Auth init error:', error);
            return { authenticated: false, error };
        }
    }
    
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Login result
     */
    static async login(email, password) {
        try {
            const response = await ApiService.login(email, password);
            
            if (response.success === false) {
                return { success: false, error: response.message || 'Đăng nhập thất bại' };
            }
            
            // Store token and user
            Storage.setAuthToken(response.token);
            Storage.setUser(response.user);
            
            // Update current user
            this.currentUser = response.user;
            
            // Dispatch auth state change event
            EventBus.publish('authStateChanged', { authenticated: true, user: this.currentUser });
            
            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, error: error.message || 'Đăng nhập thất bại' };
        }
    }
    
    /**
     * Register a new user
     * @param {string} name - User name
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Registration result
     */
    static async register(name, email, password) {
        try {
            const response = await ApiService.register(name, email, password);
            
            if (response.success === false) {
                return { success: false, error: response.message || 'Đăng ký thất bại' };
            }
            
            // Store token and user
            Storage.setAuthToken(response.token);
            Storage.setUser(response.user);
            
            // Update current user
            this.currentUser = response.user;
            
            // Dispatch auth state change event
            EventBus.publish('authStateChanged', { authenticated: true, user: this.currentUser });
            
            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, error: error.message || 'Đăng ký thất bại' };
        }
    }
    
    /**
     * Logout the current user
     * @param {boolean} callServer - Whether to call server logout API
     * @returns {Promise} Logout result
     */
    static async logout(callServer = true) {
        try {
            if (callServer) {
                await ApiService.logout();
            }
        } catch (error) {
            Utils.debug('Logout error:', error);
        } finally {
            // Always clear local storage
            Storage.removeAuthToken();
            Storage.removeUser();
            
            // Update current user
            this.currentUser = null;
            
            // Dispatch auth state change event
            EventBus.publish('authStateChanged', { authenticated: false });
        }
        
        return { success: true };
    }
    
    /**
     * Get the current authenticated user
     * @returns {object|null} Current user or null if not authenticated
     */
    static getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Check if a user is authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    static isAuthenticated() {
        return !!this.currentUser && !!Storage.getAuthToken();
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Change password result
     */
    static async changePassword(currentPassword, newPassword) {
        try {
            const response = await ApiService.changePassword(currentPassword, newPassword);
            
            if (response.success === false) {
                return { success: false, error: response.message || 'Không thể thay đổi mật khẩu' };
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message || 'Không thể thay đổi mật khẩu' };
        }
    }
}

export default AuthService;
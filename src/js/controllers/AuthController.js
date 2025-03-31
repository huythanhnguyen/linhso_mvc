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
        
        // Đăng ký các sự kiện xác thực ngay khi controller được tạo
        this.setupEventListeners();
    }
    
    /**
     * Thiết lập các event listeners
     */
    setupEventListeners() {
        console.log('Setting up auth event listeners');
        
        // Đăng ký lắng nghe sự kiện đăng nhập
        EventBus.subscribe('auth:login', async (data) => {
            console.log('Received auth:login event', data);
            
            if (!data || !data.email || !data.password) {
                console.error('Invalid login data received');
                EventBus.publish('auth:loginResult', { 
                    success: false, 
                    error: 'Dữ liệu đăng nhập không hợp lệ' 
                });
                return;
            }
            
            const result = await this.login(data.email, data.password);
            console.log('Login result:', result);
            EventBus.publish('auth:loginResult', result);
        });
        
        // Đăng ký lắng nghe sự kiện đăng ký
        EventBus.subscribe('auth:register', async (data) => {
            console.log('Received auth:register event', data);
            
            if (!data || !data.email || !data.password) {
                console.error('Invalid register data received');
                EventBus.publish('auth:registerResult', { 
                    success: false, 
                    error: 'Dữ liệu đăng ký không hợp lệ' 
                });
                return;
            }
            
            const result = await this.register(data.name, data.email, data.password);
            console.log('Register result:', result);
            EventBus.publish('auth:registerResult', result);
        });
        
        // Đăng ký lắng nghe sự kiện đăng xuất
        EventBus.subscribe('auth:logout', async () => {
            console.log('Received auth:logout event');
            await this.logout();
        });
        
        console.log('Auth event listeners set up successfully');
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
            console.log('AuthController: Attempting login for', email);
            
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
                console.log('Login successful for', email);
                EventBus.publish('auth:loginSuccess', result);
            } else {
                // Login failed, show error
                console.error('Login failed for', email, result.error);
                EventBus.publish('auth:loginFailed', result);
            }
            
            return result;
        } catch (error) {
            console.error('Error during login:', error);
            const errorResult = { success: false, error: error.message };
            EventBus.publish('auth:loginFailed', errorResult);
            return errorResult;
        }
    }
    
    // Các phương thức khác giữ nguyên
    
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
}

// Tạo đối tượng singleton và export
const authController = new AuthController();
export default authController;
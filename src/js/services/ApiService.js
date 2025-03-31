/**
 * API Service for Phone Analysis App
 * Handles all requests to the backend API
 */
import Config from '../core/Config.js';
import Storage from '../core/Storage.js';
import Utils from '../core/Utils.js';
import EventBus from '../core/EventBus.js';

class ApiService {
    /**
     * Khởi tạo ApiService
     * @returns {void}
     */
    static init() {
        console.log('Initializing ApiService...');
        
        // Kiểm tra API base URL
        if (!Config.API_BASE_URL) {
            console.error('API_BASE_URL is not defined in Config');
        } else {
            console.log('Using custom base URL:', Config.API_BASE_URL);
        }
        
        console.log('ApiService initialized successfully');
    }
    
    /**
     * Send a request to the API
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {object} data - Request data
     * @param {boolean} auth - Whether to include auth token
     * @returns {Promise} Response from the API
     */
    static async request(endpoint, method = 'GET', data = null, auth = true) {
        // Construct the full URL
        const url = `${Config.API_BASE_URL}${endpoint}`;
        
        // Ghi log chi tiết request
        console.log(`API ${method} request to:`, url);
        if (data) {
            console.log('Request data:', data);
        }
        
        // Setup request options
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Add authentication token if required
        if (auth) {
            const token = Storage.getAuthToken();
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            } else {
                // Kiểm tra nếu đang ở app page thì chuyển hướng đến trang đăng nhập
                if (window.location.pathname.includes('app.html')) {
                    console.error('Authentication required but token not found');
                    Utils.debug('Authentication token not found, redirecting to login');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                    return Promise.reject(new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'));
                }
                // Return a rejected promise with a clearer message
                console.error('Authentication token not found');
                return Promise.reject(new Error('Không tìm thấy token xác thực'));
            }
        }
        
        // Add request body if data is provided
        if (data) {
            options.body = JSON.stringify(data);
            console.log('Request body:', options.body);
        }
        
        try {
            // Use AbortController for timeout
            const controller = new AbortController();
            options.signal = controller.signal;
            
            // Create a timeout that aborts the fetch
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, Config.REQUEST_TIMEOUT || 30000); // Default to 30 seconds if not configured
            
            // Send the request
            const response = await fetch(url, options);
            
            // Clear timeout
            clearTimeout(timeoutId);
            
            // Đọc response text
            const responseText = await response.text();
            let responseData;
            
            // Parse JSON nếu có thể
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', responseText);
                responseData = { 
                    success: false,
                    message: responseText || 'Invalid response format'
                };
            }
            
            console.log('Response status:', response.status);
            console.log('Response data:', responseData);
            
            // Check for authentication errors 
            if (response.status === 401) {
                Utils.debug('Authentication error: 401 Unauthorized');
                
                // Phát sự kiện thông báo lỗi xác thực
                EventBus.publish('authError', { 
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
                    endpoint: endpoint
                });
                
                // Chuyển hướng về trang đăng nhập nếu ở trang app
                if (window.location.pathname.includes('app.html')) {
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                }
                
                const error = new Error('Phiên đăng nhập đã hết hạn');
                error.status = 401;
                error.isAuthError = true;
                throw error;
            }

            // Check if the request was successful
            if (!response.ok) {
                const error = new Error(responseData.message || 'API request failed');
                error.status = response.status;
                error.response = responseData;
                throw error;
            }
            
            return responseData;
        } catch (error) {
            if (error.name === 'AbortError') {
                Utils.debug('API Request Timeout:', endpoint);
                // Create a more descriptive error for timeout
                const timeoutError = new Error('Request timeout');
                timeoutError.isTimeout = true;
                throw timeoutError;
            }
            
            Utils.debug('API Error:', error);
            throw error;
        }
    }
    
    // Auth API
    
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Login response
     */
    static async login(email, password) {
        try {
            console.log('Login attempt with email:', email);
            
            // Kiểm tra đầu vào
            if (!email || !password) {
                throw new Error('Email và mật khẩu không được trống');
            }
            
            // Tạo đúng định dạng dữ liệu mà API mong đợi
            const requestData = {
                email: email, 
                password: password
            };
            
            console.log('Sending login request with data:', JSON.stringify(requestData));
            
            const response = await this.request(Config.AUTH.LOGIN, 'POST', requestData, false);
            
            // Kiểm tra response
            if (!response.token) {
                console.warn('Login response missing token:', response);
                return {
                    success: false,
                    error: 'Đăng nhập thất bại: Token không hợp lệ',
                    details: response
                };
            }
            
            // Nếu thành công, đảm bảo phản hồi có định dạng nhất quán
            return {
                success: true,
                token: response.token,
                user: response.user || response.userData || null,
                message: response.message || 'Đăng nhập thành công'
            };
        } catch (error) {
            console.error('Login error:', error);
            
            // Trả về đối tượng lỗi với định dạng nhất quán
            return { 
                success: false, 
                error: error.message || 'Đăng nhập thất bại',
                details: error
            };
        }
    }
    
    /**
     * Register a new user
     * @param {string} name - User name
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Register response
     */
    static async register(name, email, password) {
        try {
            console.log('Register attempt for:', email);
            
            // Kiểm tra đầu vào
            if (!name || !email || !password) {
                throw new Error('Tên, email và mật khẩu không được trống');
            }
            
            // Tạo đúng định dạng dữ liệu mà API mong đợi
            const requestData = {
                name: name,
                email: email, 
                password: password
            };
            
            console.log('Sending register request');
            
            const response = await this.request(Config.AUTH.REGISTER, 'POST', requestData, false);
            
            // Kiểm tra response
            if (!response.token) {
                console.warn('Register response missing token:', response);
                return {
                    success: false,
                    error: 'Đăng ký thất bại: Token không hợp lệ',
                    details: response
                };
            }
            
            // Nếu thành công, đảm bảo phản hồi có định dạng nhất quán
            return {
                success: true,
                token: response.token,
                user: response.user || response.userData || null,
                message: response.message || 'Đăng ký thành công'
            };
        } catch (error) {
            console.error('Register error:', error);
            
            // Trả về đối tượng lỗi với định dạng nhất quán
            return { 
                success: false, 
                error: error.message || 'Đăng ký thất bại',
                details: error
            };
        }
    }
    
    /**
     * Logout the current user
     * @returns {Promise} Logout response
     */
    static async logout() {
        try {
            console.log('Logging out user');
            
            try {
                // Gửi request logout đến server
                await this.request(Config.AUTH.LOGOUT, 'POST');
            } catch (error) {
                // Vẫn tiếp tục xử lý ngay cả khi server request thất bại
                console.warn('Server logout failed, but continuing local logout:', error);
            }
            
            console.log('Logout successful, clearing local storage');
            
            return { success: true, message: 'Đăng xuất thành công' };
        } catch (error) {
            console.error('Logout error:', error);
            
            // Vẫn trả về thành công vì chúng ta muốn người dùng đăng xuất ngay cả khi có lỗi
            return { success: true, message: 'Đăng xuất thành công' };
        }
    }
    
    /**
     * Verify the authentication token
     * @returns {Promise} Verification response
     */
    static async verifyToken() {
        try {
            console.log('Verifying authentication token');
            
            const response = await this.request(Config.AUTH.VERIFY_TOKEN, 'GET');
            
            return { 
                valid: true, 
                user: response.user || response.userData || null 
            };
        } catch (error) {
            console.error('Token verification error:', error);
            
            return { 
                valid: false, 
                error: error.message || 'Xác thực token thất bại' 
            };
        }
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Change password response
     */
    static async changePassword(currentPassword, newPassword) {
        try {
            console.log('Changing user password');
            
            // Kiểm tra đầu vào
            if (!currentPassword || !newPassword) {
                throw new Error('Mật khẩu hiện tại và mật khẩu mới không được trống');
            }
            
            const requestData = {
                currentPassword,
                newPassword
            };
            
            const response = await this.request(Config.AUTH.CHANGE_PASSWORD, 'POST', requestData);
            
            return {
                success: true,
                message: response.message || 'Đổi mật khẩu thành công'
            };
        } catch (error) {
            console.error('Change password error:', error);
            
            return { 
                success: false, 
                error: error.message || 'Đổi mật khẩu thất bại' 
            };
        }
    }
    
    // Analysis API
    
    /**
     * Analyze a phone number or any input
     * @param {string} input - User input to analyze
     * @returns {Promise} Analysis response
     */
    static async analyzePhoneNumber(input) {
        try {
            console.log('Analyzing phone number:', input);
            
            // Kiểm tra đầu vào
            if (!input) {
                throw new Error('Vui lòng nhập số điện thoại');
            }
            
            // Gửi input trực tiếp mà không xử lý
            const requestData = { phoneNumber: input };
            
            console.log('Sending analysis request');
            
            const response = await this.request(Config.ANALYSIS.ANALYZE, 'POST', requestData);
            
            console.log('Received analysis response', response);
            
            return response;
        } catch (error) {
            console.error('Error in analyzePhoneNumber API call:', error);
            throw error;
        }
    }
    
    /**
     * Get analysis history with comprehensive error handling
     * @param {number} limit - Maximum number of records to retrieve
     * @param {number} page - Page number for pagination
     * @returns {Promise} Analysis history object with data property containing records
     */
    static async getAnalysisHistory(limit = 20, page = 1) {
        try {
            console.log('Getting analysis history, page:', page, 'limit:', limit);
            
            // Tạo query parameters nếu có
            const queryParams = new URLSearchParams();
            if (limit) queryParams.append('limit', limit);
            if (page) queryParams.append('page', page);
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const endpoint = `${Config.ANALYSIS.HISTORY}${queryString}`;
            
            const response = await this.request(endpoint, 'GET');
            
            // Chuẩn hóa dữ liệu, chuyển history -> data
            if (response.success && response.history && Array.isArray(response.history)) {
                response.data = response.history;
            }
            
            // Đảm bảo response có định dạng chuẩn
            if (!response.success && !response.data) {
                // Cố gắng bình thường hóa dữ liệu
                if (Array.isArray(response)) {
                    // Nếu response là mảng, giả định đó là dữ liệu
                    return { success: true, data: response };
                } else {
                    // Nếu response là object nhưng không có data, bọc nó
                    return { 
                        success: response.success !== false, 
                        message: response.message || 'Định dạng dữ liệu không đúng', 
                        data: response.data || []
                    };
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error retrieving analysis history:', error);
            
            // Đảm bảo trả về object có cấu trúc nhất quán trong trường hợp lỗi
            return {
                success: false,
                message: error.message || 'Lỗi khi lấy lịch sử phân tích',
                error: error.toString(),
                data: []
            };
        }
    }
    
    /**
     * Delete analysis history
     * @returns {Promise} Delete response
     */
    static async deleteAnalysisHistory() {
        try {
            console.log('Deleting analysis history');
            
            const response = await this.request(Config.ANALYSIS.DELETE_HISTORY, 'DELETE');
            
            return {
                success: true,
                message: response.message || 'Xóa lịch sử thành công'
            };
        } catch (error) {
            console.error('Error deleting analysis history:', error);
            
            return {
                success: false,
                error: error.message || 'Không thể xóa lịch sử phân tích'
            };
        }
    }
    
    /**
     * Send feedback for an analysis
     * @param {string} analysisId - Analysis ID
     * @param {string} feedbackType - Feedback type (positive/negative)
     * @param {string} comment - Optional feedback comment
     * @returns {Promise} Feedback response
     */
    static async sendFeedback(analysisId, feedbackType, comment = '') {
        try {
            console.log('Sending feedback for analysis:', analysisId, 'type:', feedbackType);
            
            const requestData = {
                analysisId,
                feedbackType,
                comment
            };
            
            const response = await this.request(Config.ANALYSIS.FEEDBACK, 'POST', requestData);
            
            return {
                success: true,
                message: response.message || 'Gửi phản hồi thành công'
            };
        } catch (error) {
            console.error('Error sending feedback:', error);
            
            return {
                success: false,
                error: error.message || 'Không thể gửi phản hồi'
            };
        }
    }
    
    /**
     * Ask a question about a phone number with enhanced capabilities
     * @param {string|object} options - Phone number or options object
     * @param {string} [questionText] - User's question when first param is phoneNumber
     * @returns {Promise} Question response
     */
    static async askQuestion(options, questionText) {
        try {
            console.log('Asking question:', options, questionText);
            
            // Xử lý cú pháp cũ: askQuestion(phoneNumber, question)
            if (typeof options === 'string') {
                console.log('Using old syntax for askQuestion');
                return await this.request(Config.ANALYSIS.QUESTION, 'POST', {
                    phoneNumber: options,
                    question: questionText,
                    type: 'question'
                });
            }
            
            // Xử lý cú pháp mới: askQuestion({...})
            const payload = {
                question: options.question,
                type: options.type || 'question'
            };
            
            // Thêm các tham số tùy theo loại câu hỏi
            switch(payload.type) {
                case 'question':
                    payload.phoneNumber = options.phoneNumber;
                    break;
                    
                case 'followup':
                    // Có thể thêm phoneNumber tùy chọn để chỉ định context
                    if (options.phoneNumber) {
                        payload.phoneNumber = options.phoneNumber;
                    }
                    break;
                    
                case 'compare':
                    if (!options.phoneNumbers || !Array.isArray(options.phoneNumbers)) {
                        throw new Error('Cần cung cấp mảng phoneNumbers để so sánh');
                    }
                    payload.phoneNumbers = options.phoneNumbers;
                    break;
                    
                case 'general':
                    // Không cần tham số đặc biệt
                    break;
                    
                default:
                    console.warn('Không nhận dạng được loại câu hỏi, sử dụng mặc định: question');
                    payload.type = 'question';
                    if (options.phoneNumber) {
                        payload.phoneNumber = options.phoneNumber;
                    }
            }
            
            console.log('Sending question with payload:', payload);
            return await this.request(Config.ANALYSIS.QUESTION, 'POST', payload);
        } catch (error) {
            console.error('Error in askQuestion API call:', error);
            throw error;
        }
    }
    
    /**
     * Get recent analyses for the current user
     * @param {number} limit - Maximum number of items to return
     * @returns {Promise} Recent analyses
     */
    static async getRecentAnalyses(limit = 5) {
        try {
            console.log('Getting recent analyses, limit:', limit);
            
            const response = await this.request(`${Config.ANALYSIS.RECENT}?limit=${limit}`, 'GET');
            
            return {
                success: true,
                data: response.data || response.analyses || response,
                message: response.message || 'Lấy dữ liệu thành công'
            };
        } catch (error) {
            console.error('Error getting recent analyses:', error);
            
            return {
                success: false,
                error: error.message || 'Không thể lấy dữ liệu phân tích gần đây',
                data: []
            };
        }
    }
}

export default ApiService;
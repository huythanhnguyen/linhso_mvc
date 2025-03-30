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
            } else if (auth) {
                // Return a rejected promise instead of throwing an error immediately
                return Promise.reject(new Error('Không tìm thấy token xác thực'));
            }
        }
        
        // Add request body if data is provided
        if (data) {
            options.body = JSON.stringify(data);
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
            
            // Check for authentication errors 
            if (response.status === 401) {
                // Token không hợp lệ hoặc đã hết hạn
                Utils.debug('Authentication error: 401 Unauthorized');
                
                // Phát sự kiện thông báo lỗi xác thực
                EventBus.publish('authError', { 
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
                    endpoint: endpoint
                });
                
                const error = new Error('Phiên đăng nhập đã hết hạn');
                error.status = 401;
                error.isAuthError = true;
                throw error;
            }

            // Parse the response
            const responseData = await response.json();
            
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
            const response = await this.request(Config.AUTH.LOGIN, 'POST', { email, password }, false);
            return response;
        } catch (error) {
            Utils.debug('Login error:', error);
            throw error;
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
            const response = await this.request(Config.AUTH.REGISTER, 'POST', { name, email, password }, false);
            return response;
        } catch (error) {
            Utils.debug('Register error:', error);
            throw error;
        }
    }
    
    /**
     * Logout the current user
     * @returns {Promise} Logout response
     */
    static async logout() {
        try {
            await this.request(Config.AUTH.LOGOUT, 'POST');
        } catch (error) {
            // Even if the server request fails, we still want to clear local storage
            Utils.debug('Logout error:', error);
        }
        
        return { success: true };
    }
    
    /**
     * Verify the authentication token
     * @returns {Promise} Verification response
     */
    static async verifyToken() {
        try {
            const response = await this.request(Config.AUTH.VERIFY_TOKEN, 'GET');
            return { valid: true, user: response.user };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise} Change password response
     */
    static async changePassword(currentPassword, newPassword) {
        return await this.request(Config.AUTH.CHANGE_PASSWORD, 'POST', {
            currentPassword,
            newPassword
        });
    }
    
    // Analysis API
    
    /**
     * Analyze a phone number or any input
     * @param {string} input - User input to analyze
     * @returns {Promise} Analysis response
     */
    static async analyzePhoneNumber(input) {
        try {
            // Gửi input trực tiếp mà không xử lý
            const response = await this.request(Config.ANALYSIS.ANALYZE, 'POST', { phoneNumber: input });
            Utils.debug('Received analysis response:', response);
            return response;
        } catch (error) {
            Utils.debug('Error in analyzePhoneNumber API call:', error);
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
            Utils.debug('Error retrieving analysis history:', error);
            
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
        return await this.request(Config.ANALYSIS.DELETE_HISTORY, 'DELETE');
    }
    
    /**
     * Send feedback for an analysis
     * @param {string} analysisId - Analysis ID
     * @param {string} feedbackType - Feedback type (positive/negative)
     * @param {string} comment - Optional feedback comment
     * @returns {Promise} Feedback response
     */
    static async sendFeedback(analysisId, feedbackType, comment = '') {
        return await this.request(Config.ANALYSIS.FEEDBACK, 'POST', {
            analysisId,
            feedbackType,
            comment
        });
    }
    
    /**
     * Ask a question about a phone number with enhanced capabilities
     * @param {string|object} options - Phone number or options object
     * @param {string} [questionText] - User's question when first param is phoneNumber
     * @returns {Promise} Question response
     */
    static async askQuestion(options, questionText) {
        try {
            // Xử lý cú pháp cũ: askQuestion(phoneNumber, question)
            if (typeof options === 'string') {
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
                    Utils.debug('Không nhận dạng được loại câu hỏi, sử dụng mặc định: question');
                    payload.type = 'question';
                    if (options.phoneNumber) {
                        payload.phoneNumber = options.phoneNumber;
                    }
            }
            
            Utils.debug('Sending question with payload:', payload);
            return await this.request(Config.ANALYSIS.QUESTION, 'POST', payload);
        } catch (error) {
            Utils.debug('Error in askQuestion API call:', error);
            throw error;
        }
    }
    
    /**
     * Get recent analyses for the current user
     * @param {number} limit - Maximum number of items to return
     * @returns {Promise} Recent analyses
     */
    static async getRecentAnalyses(limit = 5) {
        return await this.request(`${Config.ANALYSIS.RECENT}?limit=${limit}`, 'GET');
    }
}

export default ApiService;
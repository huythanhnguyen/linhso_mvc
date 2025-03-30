/**
 * Analysis Controller
 */
import AnalysisService from '../services/AnalysisService.js';
import EventBus from '../core/EventBus.js';
import Utils from '../core/Utils.js';

class AnalysisController {
    constructor() {
        this.initialized = false;
        this.history = [];
        this.currentAnalysis = null;
        this.historyPagination = {
            currentPage: 1,
            totalPages: 1,
            limit: 20,
            total: 0
        };
    }
    
    /**
     * Initialize the controller
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Load initial history
            await this.loadHistory();
            
            // Set up event subscriptions
            this.setupEventListeners();
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing analysis controller:', error);
            return false;
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for chat message events to extract analysis data
        EventBus.subscribe('chat:messageReceived', (message) => {
            if (message.analysisData) {
                this.currentAnalysis = message.analysisData;
                EventBus.publish('analysis:updated', this.currentAnalysis);
            }
        });
    }
    
    /**
     * Load analysis history
     * @param {number} page - Page number
     * @param {boolean} append - Whether to append to existing history
     */
    async loadHistory(page = 1, append = false) {
        try {
            // Publish loading event
            EventBus.publish('analysis:historyLoading', { page, append });
            
            const response = await AnalysisService.getAnalysisHistory(
                this.historyPagination.limit, 
                page
            );
            
            // Update pagination
            if (response.pagination) {
                this.historyPagination = response.pagination;
            } else {
                this.historyPagination.currentPage = page;
            }
            
            // Update history
            if (append && response.data) {
                this.history = [...this.history, ...response.data];
            } else if (response.data) {
                this.history = response.data;
            }
            
            // Publish loaded event
            EventBus.publish('analysis:historyLoaded', {
                history: this.history,
                pagination: this.historyPagination,
                append
            });
            
            return {
                success: true,
                data: this.history,
                pagination: this.historyPagination
            };
        } catch (error) {
            Utils.debug('Error loading history:', error);
            
            // Publish error event
            EventBus.publish('analysis:historyError', {
                error: error.message || 'Không thể tải lịch sử phân tích'
            });
            
            return {
                success: false,
                error: error.message || 'Không thể tải lịch sử phân tích'
            };
        }
    }
    
    /**
     * Load more history
     */
    async loadMoreHistory() {
        if (this.historyPagination.currentPage >= this.historyPagination.totalPages) {
            return { success: false, message: 'Không còn dữ liệu để tải' };
        }
        
        return await this.loadHistory(this.historyPagination.currentPage + 1, true);
    }
    
    /**
     * Delete analysis history
     */
    async deleteHistory() {
        try {
            // Publish deleting event
            EventBus.publish('analysis:historyDeleting');
            
            const response = await AnalysisService.deleteAnalysisHistory();
            
            // Clear local history
            this.history = [];
            this.historyPagination.currentPage = 1;
            this.historyPagination.totalPages = 1;
            this.historyPagination.total = 0;
            
            // Publish deleted event
            EventBus.publish('analysis:historyDeleted');
            
            return { success: true };
        } catch (error) {
            Utils.debug('Error deleting history:', error);
            
            // Publish error event
            EventBus.publish('analysis:historyError', {
                error: error.message || 'Không thể xóa lịch sử phân tích'
            });
            
            return {
                success: false,
                error: error.message || 'Không thể xóa lịch sử phân tích'
            };
        }
    }
    
    /**
     * Analyze a phone number
     * @param {string} phoneNumber - Phone number to analyze
     */
    async analyzePhoneNumber(phoneNumber) {
        try {
            // Publish analyzing event
            EventBus.publish('analysis:analyzing', { phoneNumber });
            
            const analysis = await AnalysisService.analyzePhoneNumber(phoneNumber);
            
            // Update current analysis
            this.currentAnalysis = analysis;
            
            // Publish analyzed event
            EventBus.publish('analysis:analyzed', analysis);
            
            return {
                success: true,
                analysis
            };
        } catch (error) {
            Utils.debug('Error analyzing phone number:', error);
            
            // Publish error event
            EventBus.publish('analysis:error', {
                error: error.message || 'Không thể phân tích số điện thoại'
            });
            
            return {
                success: false,
                error: error.message || 'Không thể phân tích số điện thoại'
            };
        }
    }
    
    /**
     * Ask a question about a phone number
     * @param {object} options - Question options
     */
    async askQuestion(options) {
        try {
            // Publish asking event
            EventBus.publish('analysis:questionAsking', options);
            
            const response = await AnalysisService.askQuestion(options);
            
            // Publish answered event
            EventBus.publish('analysis:questionAnswered', response);
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            Utils.debug('Error asking question:', error);
            
            // Publish error event
            EventBus.publish('analysis:error', {
                error: error.message || 'Không thể trả lời câu hỏi'
            });
            
            return {
                success: false,
                error: error.message || 'Không thể trả lời câu hỏi'
            };
        }
    }
    
    /**
     * Get current analysis
     * @returns {object|null} Current analysis data or null
     */
    getCurrentAnalysis() {
        return this.currentAnalysis;
    }
    
    /**
     * Get analysis history
     * @returns {array} Analysis history
     */
    getHistory() {
        return this.history;
    }
}

// Create a singleton instance
const analysisController = new AnalysisController();
export default analysisController;
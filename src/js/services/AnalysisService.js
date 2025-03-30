/**
 * Analysis Service - Phone Analysis App
 * Handles analysis of phone numbers
 */
import ApiService from './ApiService.js';
import AnalysisModel from '../models/AnalysisModel.js';
import Utils from '../core/Utils.js';

class AnalysisService {
    /**
     * Analyze a phone number
     * @param {string} phoneNumber - Phone number to analyze
     * @returns {Promise<AnalysisModel>} Analysis result
     */
    static async analyzePhoneNumber(phoneNumber) {
        try {
            const response = await ApiService.analyzePhoneNumber(phoneNumber);
            
            if (!response.success) {
                throw new Error(response.message || 'Không thể phân tích số điện thoại');
            }
            
            // Create and normalize analysis model
            const analysisData = response.analysis || response.data || response;
            const analysis = new AnalysisModel({
                phoneNumber,
                ...analysisData
            });
            
            return analysis.normalize();
        } catch (error) {
            Utils.debug('Analysis error:', error);
            throw error;
        }
    }
    
    /**
     * Ask a question about a phone number
     * @param {object} options - Question options
     * @returns {Promise<object>} Question response
     */
    static async askQuestion(options) {
        try {
            const response = await ApiService.askQuestion(options);
            
            if (!response.success) {
                throw new Error(response.message || 'Không thể trả lời câu hỏi');
            }
            
            return response;
        } catch (error) {
            Utils.debug('Question error:', error);
            throw error;
        }
    }
    
    /**
     * Get analysis history
     * @param {number} limit - Maximum number of records to retrieve
     * @param {number} page - Page number for pagination
     * @returns {Promise<Array<AnalysisModel>>} Analysis history
     */
    static async getAnalysisHistory(limit = 20, page = 1) {
        try {
            const response = await ApiService.getAnalysisHistory(limit, page);
            
            if (!response.success && !response.data) {
                return { 
                    success: false, 
                    message: response.message || 'Không thể lấy lịch sử phân tích',
                    data: []
                };
            }
            
            // Convert data to AnalysisModel objects
            const analysisItems = response.data.map(item => new AnalysisModel(item).normalize());
            
            return {
                success: true,
                data: analysisItems,
                pagination: response.pagination || {
                    page,
                    limit,
                    total: analysisItems.length,
                    pages: Math.ceil(analysisItems.length / limit)
                }
            };
        } catch (error) {
            Utils.debug('History error:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi lấy lịch sử phân tích',
                data: []
            };
        }
    }
    
    /**
     * Delete analysis history
     * @returns {Promise<object>} Delete response
     */
    static async deleteAnalysisHistory() {
        try {
            const response = await ApiService.deleteAnalysisHistory();
            return { success: true };
        } catch (error) {
            Utils.debug('Delete history error:', error);
            return {
                success: false,
                message: error.message || 'Không thể xóa lịch sử phân tích'
            };
        }
    }
    
    /**
     * Send feedback for an analysis
     * @param {string} analysisId - Analysis ID
     * @param {string} feedbackType - Feedback type (positive/negative)
     * @param {string} comment - Optional feedback comment
     * @returns {Promise<object>} Feedback response
     */
    static async sendFeedback(analysisId, feedbackType, comment = '') {
        try {
            const response = await ApiService.sendFeedback(analysisId, feedbackType, comment);
            return { success: true };
        } catch (error) {
            Utils.debug('Feedback error:', error);
            return {
                success: false,
                message: error.message || 'Không thể gửi phản hồi'
            };
        }
    }
    
    /**
     * Format analysis data for display
     * @param {AnalysisModel} analysis - Analysis data
     * @returns {object} Formatted analysis data
     */
    static formatForDisplay(analysis) {
        // Returning a simple display object with the most important info
        return {
            phoneNumber: Utils.formatPhoneNumber(analysis.phoneNumber),
            balance: this.getBalanceText(analysis),
            energySummary: this.getEnergySummary(analysis),
            topStars: analysis.getTopStars(3),
            hasWarnings: analysis.dangerousCombinations && analysis.dangerousCombinations.length > 0
        };
    }
    
    /**
     * Get balance text based on analysis
     * @param {AnalysisModel} analysis - Analysis data
     * @returns {string} Balance description
     */
    static getBalanceText(analysis) {
        if (!analysis.balance) return 'Cân bằng không xác định';
        
        switch(analysis.balance) {
            case 'BALANCED':
                return 'Cân bằng tốt giữa sao cát và hung';
            case 'CAT_HEAVY':
                return 'Thiên về sao cát (>70%)';
            case 'HUNG_HEAVY':
                return 'Thiên về sao hung (>70%)';
            default:
                return 'Cân bằng không xác định';
        }
    }
    
    /**
     * Get energy summary text
     * @param {AnalysisModel} analysis - Analysis data
     * @returns {string} Energy summary text
     */
    static getEnergySummary(analysis) {
        if (!analysis.energyLevel) return '';
        
        const total = analysis.energyLevel.total || 0;
        const cat = analysis.energyLevel.cat || 0;
        const hung = Math.abs(analysis.energyLevel.hung || 0);
        
        return `Tổng: ${total} (Cát: ${cat}, Hung: ${hung})`;
    }
}

export default AnalysisService;
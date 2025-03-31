/**
 * History Controller
 * Quản lý lịch sử phân tích số điện thoại
 */
import EventBus from '../core/EventBus.js';
import AnalysisService from '../services/AnalysisService.js';
import AnalysisController from './AnalysisController.js';
import ChatController from './ChatController.js';

class HistoryController {
    constructor() {
        console.log('Initializing HistoryController...');
        
        this.analysisService = new AnalysisService();
        this.history = [];
        this.pagination = {
            currentPage: 1,
            totalPages: 1,
            limit: 20,
            total: 0
        };
        
        // Đăng ký các sự kiện liên quan đến lịch sử
        this.registerEvents();
        
        console.log('HistoryController initialized successfully');
    }
    
    registerEvents() {
        console.log('Registering history events...');
        
        // Đăng ký lắng nghe các sự kiện lịch sử
        EventBus.subscribe('history:load', this.loadHistory.bind(this));
        EventBus.subscribe('history:load-more', this.loadMoreHistory.bind(this));
        EventBus.subscribe('history:clear', this.clearHistory.bind(this));
        EventBus.subscribe('history:select-item', this.selectHistoryItem.bind(this));
        EventBus.subscribe('analysis:history-updated', this.updateHistory.bind(this));
        
        console.log('History events registered');
    }
    
    async loadHistory(page = 1, limit = 20) {
        console.log('Loading history page:', page, 'limit:', limit);
        
        try {
            // Gọi controller phân tích để lấy lịch sử
            const result = await AnalysisController.getAnalysisHistory(page, limit);
            
            if (result.success && result.data) {
                // Cập nhật danh sách lịch sử
                this.history = result.data;
                
                // Cập nhật thông tin phân trang
                if (result.pagination) {
                    this.pagination = {
                        currentPage: page,
                        totalPages: result.pagination.pages || 1,
                        limit: result.pagination.limit || 20,
                        total: result.pagination.total || 0
                    };
                }
                
                // Thông báo lịch sử đã tải
                EventBus.publish('history:loaded', {
                    history: this.history,
                    pagination: this.pagination
                });
                
                console.log('History loaded successfully, items:', this.history.length);
                return {
                    success: true,
                    data: this.history,
                    pagination: this.pagination
                };
            } else {
                // Thông báo lỗi
                const errorMsg = result.message || 'Không thể tải lịch sử phân tích.';
                EventBus.publish('history:load-failed', errorMsg);
                console.error('Failed to load history:', errorMsg);
                
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error) {
            // Thông báo lỗi
            const errorMsg = error.message || 'Lỗi không xác định khi tải lịch sử';
            EventBus.publish('history:load-error', errorMsg);
            console.error('Error loading history:', error);
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    
    async loadMoreHistory() {
        console.log('Loading more history from page:', this.pagination.currentPage, 'to page:', this.pagination.currentPage + 1);
        
        if (this.pagination.currentPage >= this.pagination.totalPages) {
            console.log('No more history pages to load');
            return { 
                success: false, 
                message: 'Không còn dữ liệu để tải' 
            };
        }
        
        const nextPage = this.pagination.currentPage + 1;
        
        try {
            // Gọi controller phân tích để lấy lịch sử trang tiếp theo
            const result = await AnalysisController.getAnalysisHistory(nextPage, this.pagination.limit);
            
            if (result.success && result.data) {
                // Thêm vào danh sách lịch sử hiện tại
                this.history = [...this.history, ...result.data];
                
                // Cập nhật thông tin phân trang
                if (result.pagination) {
                    this.pagination = {
                        currentPage: nextPage,
                        totalPages: result.pagination.pages || 1,
                        limit: result.pagination.limit || 20,
                        total: result.pagination.total || 0
                    };
                }
                
                // Thông báo đã tải thêm lịch sử
                EventBus.publish('history:more-loaded', {
                    history: result.data,
                    pagination: this.pagination
                });
                
                console.log('Loaded more history successfully, new items:', result.data.length);
                return {
                    success: true,
                    data: result.data,
                    pagination: this.pagination
                };
            } else {
                // Thông báo lỗi
                const errorMsg = result.message || 'Không thể tải thêm lịch sử phân tích.';
                EventBus.publish('history:load-more-failed', errorMsg);
                console.error('Failed to load more history:', errorMsg);
                
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error) {
            // Thông báo lỗi
            const errorMsg = error.message || 'Lỗi không xác định khi tải thêm lịch sử';
            EventBus.publish('history:load-error', errorMsg);
            console.error('Error loading more history:', error);
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    
    async clearHistory() {
        console.log('Clearing history...');
        
        try {
            // Gọi controller phân tích để xóa lịch sử
            const result = await AnalysisController.clearAnalysisHistory();
            
            if (result.success) {
                // Đặt lại danh sách lịch sử và phân trang
                this.history = [];
                this.pagination = {
                    currentPage: 1,
                    totalPages: 1,
                    limit: 20,
                    total: 0
                };
                
                // Thông báo đã xóa lịch sử
                EventBus.publish('history:cleared');
                console.log('History cleared successfully');
                
                return { success: true };
            } else {
                // Thông báo lỗi
                const errorMsg = result.message || 'Không thể xóa lịch sử phân tích.';
                EventBus.publish('history:clear-failed', errorMsg);
                console.error('Failed to clear history:', errorMsg);
                
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error) {
            // Thông báo lỗi
            const errorMsg = error.message || 'Lỗi không xác định khi xóa lịch sử';
            EventBus.publish('history:clear-error', errorMsg);
            console.error('Error clearing history:', error);
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    
    async selectHistoryItem(phoneNumber) {
        console.log('Selecting history item with phone number:', phoneNumber);
        
        try {
            // Thông báo đang chọn mục lịch sử
            EventBus.publish('history:item-selecting', phoneNumber);
            console.log('Published history:item-selecting event');
            
            // Khi chọn một mục lịch sử, tạo tin nhắn người dùng và phân tích
            ChatController.processUserMessage(phoneNumber);
            
            // Thông báo đã chọn mục lịch sử
            EventBus.publish('history:item-selected', phoneNumber);
            console.log('Published history:item-selected event');
            
            return { success: true };
        } catch (error) {
            // Thông báo lỗi
            const errorMsg = error.message || 'Lỗi không xác định khi chọn mục lịch sử';
            EventBus.publish('history:selection-error', errorMsg);
            console.error('Error selecting history item:', error);
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    
    async updateHistory() {
        console.log('Updating history...');
        
        // Tải lại lịch sử khi có cập nhật
        await this.loadHistory(1, this.pagination.limit);
        console.log('History updated');
    }
    
    getHistory() {
        return {
            history: this.history,
            pagination: this.pagination
        };
    }
}

// Tạo một singleton instance
const historyController = new HistoryController();
export default historyController;
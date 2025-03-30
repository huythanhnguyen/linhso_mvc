import { EventBus } from '../core/EventBus.js';
import AnalysisService from '../services/AnalysisService.js';
import AnalysisController from './AnalysisController.js';
import ChatController from './ChatController.js';

class HistoryController {
    constructor() {
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
    }
    
    registerEvents() {
        // Đăng ký lắng nghe các sự kiện lịch sử
        EventBus.subscribe('history:load', this.loadHistory.bind(this));
        EventBus.subscribe('history:load-more', this.loadMoreHistory.bind(this));
        EventBus.subscribe('history:clear', this.clearHistory.bind(this));
        EventBus.subscribe('history:select-item', this.selectHistoryItem.bind(this));
        EventBus.subscribe('analysis:history-updated', this.updateHistory.bind(this));
    }
    
    async loadHistory(page = 1, limit = 20) {
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
            } else {
                // Thông báo lỗi
                EventBus.publish('history:load-failed', result.message || 'Không thể tải lịch sử phân tích.');
            }
        } catch (error) {
            // Thông báo lỗi
            EventBus.publish('history:load-error', error.message);
        }
    }
    
    async loadMoreHistory() {
        if (this.pagination.currentPage < this.pagination.totalPages) {
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
                } else {
                    // Thông báo lỗi
                    EventBus.publish('history:load-more-failed', result.message || 'Không thể tải thêm lịch sử phân tích.');
                }
            } catch (error) {
                // Thông báo lỗi
                EventBus.publish('history:load-error', error.message);
            }
        }
    }
    
    async clearHistory() {
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
            } else {
                // Thông báo lỗi
                EventBus.publish('history:clear-failed', result.message || 'Không thể xóa lịch sử phân tích.');
            }
        } catch (error) {
            // Thông báo lỗi
            EventBus.publish('history:clear-error', error.message);
        }
    }
    
    async selectHistoryItem(phoneNumber) {
        try {
            // Thông báo đang chọn mục lịch sử
            EventBus.publish('history:item-selecting', phoneNumber);
            
            // Khi chọn một mục lịch sử, tạo tin nhắn người dùng và phân tích
            ChatController.processUserMessage(phoneNumber);
            
            // Thông báo đã chọn mục lịch sử
            EventBus.publish('history:item-selected', phoneNumber);
        } catch (error) {
            // Thông báo lỗi
            EventBus.publish('history:selection-error', error.message);
        }
    }
    
    async updateHistory() {
        // Tải lại lịch sử khi có cập nhật
        this.loadHistory(1, this.pagination.limit);
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
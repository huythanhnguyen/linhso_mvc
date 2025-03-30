import { EventBus } from '../core/EventBus.js';
import MessageModel from '../models/MessageModel.js';
import ChatService from '../services/ChatService.js';
import AnalysisController from './AnalysisController.js';

class ChatController {
    constructor() {
        this.chatService = new ChatService();
        this.messages = [];
        this.isProcessing = false;
        
        // Khởi tạo controller
        this.init();
        
        // Đăng ký các sự kiện liên quan đến chat
        this.registerEvents();
    }
    
    init() {
        // Khởi tạo chat history từ local storage nếu có
        this.messages = this.chatService.loadConversationHistory();
        
        // Thông báo khởi tạo hoàn tất
        EventBus.publish('chat:initialized', this.messages);
    }
    
    registerEvents() {
        // Đăng ký lắng nghe các sự kiện chat
        EventBus.subscribe('chat:send-message', this.processUserMessage.bind(this));
        EventBus.subscribe('chat:clear', this.clearChat.bind(this));
        EventBus.subscribe('chat:category-selected', this.handleCategorySelection.bind(this));
    }
    
    async processUserMessage(message) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            // Thêm tin nhắn người dùng vào danh sách
            const userMessage = new MessageModel({
                id: `msg_user_${Date.now()}`,
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
            
            this.messages.push(userMessage);
            
            // Thông báo đã thêm tin nhắn người dùng
            EventBus.publish('chat:user-message-added', userMessage.getData());
            
            // Báo hiệu đang nhập
            EventBus.publish('chat:typing-started');
            
            // Phân tích loại đầu vào (số điện thoại, câu hỏi, v.v.)
            const inputType = this.chatService.detectInputType(message);
            
            let response;
            
            // Xử lý theo loại đầu vào
            switch (inputType) {
                case 'phone':
                    // Gọi AnalysisController để phân tích số điện thoại
                    response = await AnalysisController.analyzePhoneNumber(message);
                    break;
                    
                case 'followup':
                case 'question':
                    // Gọi service để xử lý câu hỏi
                    response = await this.chatService.processQuestion(message, inputType);
                    break;
                    
                case 'compare':
                    // Xử lý so sánh số điện thoại
                    const phoneNumbers = this.chatService.extractPhoneNumbers(message);
                    response = await this.chatService.comparePhoneNumbers(phoneNumbers, message);
                    break;
                    
                case 'general':
                default:
                    // Xử lý các câu hỏi chung
                    response = await this.chatService.processGeneralQuestion(message);
                    break;
            }
            
            // Tạo tin nhắn bot
            const botMessage = new MessageModel({
                id: `msg_bot_${Date.now()}`,
                role: 'assistant',
                content: response.content || 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn.',
                timestamp: new Date().toISOString(),
                analysisData: response.analysisData || null
            });
            
            // Thêm tin nhắn bot vào danh sách
            this.messages.push(botMessage);
            
            // Lưu lịch sử trò chuyện
            this.chatService.saveConversationHistory(this.messages);
            
            // Báo hiệu đã ngừng nhập
            EventBus.publish('chat:typing-ended');
            
            // Thông báo đã thêm tin nhắn bot
            EventBus.publish('chat:bot-message-added', botMessage.getData());
            
        } catch (error) {
            console.error('Error processing user message:', error);
            
            // Báo hiệu đã ngừng nhập
            EventBus.publish('chat:typing-ended');
            
            // Thông báo lỗi cho người dùng
            const errorMessage = new MessageModel({
                id: `msg_bot_${Date.now()}`,
                role: 'assistant',
                content: 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
                timestamp: new Date().toISOString()
            });
            
            this.messages.push(errorMessage);
            EventBus.publish('chat:bot-message-added', errorMessage.getData());
        } finally {
            this.isProcessing = false;
        }
    }
    
    handleCategorySelection(category) {
        // Tạo câu hỏi dựa trên danh mục được chọn
        let question = '';
        
        switch (category) {
            case 'business':
                question = 'Số điện thoại này ảnh hưởng thế nào đến công việc kinh doanh?';
                break;
            case 'love':
                question = 'Số điện thoại này có ý nghĩa gì về tình duyên của tôi?';
                break;
            case 'wealth':
                question = 'Số điện thoại này ảnh hưởng thế nào đến tài chính của tôi?';
                break;
            case 'health':
                question = 'Số điện thoại này có liên quan đến sức khỏe của tôi không?';
                break;
            default:
                question = 'Hãy phân tích thêm về ' + category;
        }
        
        // Xử lý câu hỏi
        this.processUserMessage(question);
    }
    
    clearChat() {
        // Xóa tất cả tin nhắn trừ tin nhắn chào ban đầu
        const welcomeMessage = this.chatService.getWelcomeMessage();
        this.messages = [welcomeMessage];
        
        // Lưu lịch sử trò chuyện đã xóa
        this.chatService.saveConversationHistory(this.messages);
        
        // Thông báo đã xóa chat
        EventBus.publish('chat:cleared', this.messages);
    }
    
    getMessages() {
        return this.messages.map(message => message.getData());
    }
}

// Tạo một singleton instance
const chatController = new ChatController();
export default chatController;
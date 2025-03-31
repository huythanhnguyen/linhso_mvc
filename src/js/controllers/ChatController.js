/**
 * Chat Controller
 * Quản lý các tương tác chat và xử lý tin nhắn
 */
import EventBus from '../core/EventBus.js';
import MessageModel from '../models/MessageModel.js';
import ChatService from '../services/ChatService.js';
import AnalysisController from './AnalysisController.js';

class ChatController {
    constructor() {
        // Trạng thái chat
        this.messages = [];
        this.isProcessing = false;
        this.initialized = false;
        
        // Khởi tạo controller
        this.init();
        
        // Đăng ký các sự kiện liên quan đến chat
        this.registerEvents();
    }
    
    init() {
        console.log('Initializing ChatController...');
        
        try {
            // Khởi tạo chat history từ local storage nếu có
            this.messages = ChatService.loadConversationHistory() || [];
            console.log('Loaded conversation history:', this.messages.length, 'messages');
            
            this.initialized = true;
            
            // Thông báo khởi tạo hoàn tất
            EventBus.publish('chat:initialized', this.messages);
            console.log('ChatController initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Error initializing ChatController:', error);
            this.messages = [];
            
            // Thêm tin nhắn chào mừng
            const welcomeMessage = ChatService.getWelcomeMessage();
            if (welcomeMessage) {
                this.messages.push(welcomeMessage);
            }
            
            this.initialized = true;
            console.log('ChatController initialized with default welcome message');
            return false;
        }
    }
    
    registerEvents() {
        // Đăng ký lắng nghe các sự kiện chat
        EventBus.subscribe('chat:send-message', this.processUserMessage.bind(this));
        EventBus.subscribe('chat:clear', this.clearChat.bind(this));
        EventBus.subscribe('chat:category-selected', this.handleCategorySelection.bind(this));
        
        // Đảm bảo lắng nghe sự kiện từ ChatView
        EventBus.subscribe('user:message', this.processUserMessage.bind(this));
        
        // Thông báo rằng chat controller đã sẵn sàng
        EventBus.publish('chat:ready', this.getMessages());
        
        console.log('Chat events registered');
    }
    
    async processUserMessage(message) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            // Kiểm tra trạng thái xác thực nếu ở trang app
            if (!Storage.isAuthenticated() && window.location.pathname.includes('app.html')) {
                // Hiển thị thông báo lỗi
                const errorMessage = new MessageModel({
                    id: `msg_bot_${Date.now()}`,
                    role: 'assistant',
                    content: 'Vui lòng đăng nhập để sử dụng tính năng này.',
                    timestamp: new Date().toISOString()
                });
                
                this.messages.push(errorMessage);
                
                // Thông báo lỗi và chuyển hướng
                EventBus.publish('chat:bot-message-added', errorMessage.getData());
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
                this.isProcessing = false;
                return;
            }
        
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
            
            try {
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
            } catch (error) {
                console.error('Error processing message:', error);
                
                // Xử lý lỗi - kiểm tra xem có phải lỗi xác thực không
                if (error.message && (
                    error.message.includes('token') || 
                    error.message.includes('xác thực') || 
                    error.message.includes('đăng nhập') ||
                    error.status === 401
                )) {
                    response = {
                        content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                        analysisData: null
                    };
                    
                    // Chuyển hướng về trang đăng nhập
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    response = {
                        content: 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
                        analysisData: null
                    };
                }
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
        console.log('Handling category selection:', category);
        
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
        
        console.log('Generated question from category:', question);
        
        // Xử lý câu hỏi
        this.processUserMessage(question);
    }
    
    clearChat() {
        console.log('Clearing chat history...');
        
        // Xóa tất cả tin nhắn trừ tin nhắn chào ban đầu
        const welcomeMessage = ChatService.getWelcomeMessage();
        this.messages = [welcomeMessage];
        console.log('Chat history cleared, kept welcome message');
        
        // Lưu lịch sử trò chuyện đã xóa
        ChatService.saveConversationHistory(this.messages);
        console.log('Saved cleared conversation history');
        
        // Thông báo đã xóa chat
        EventBus.publish('chat:cleared', this.messages);
        console.log('Published chat:cleared event');
    }
    
    getMessages() {
        return this.messages;
    }
}

// Tạo một singleton instance
const chatController = new ChatController();
export default chatController;
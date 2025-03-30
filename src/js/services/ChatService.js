/**
 * Chat Service for Phone Analysis App
 * Handles chat interactions and phone number analysis
 */
import ApiService from './ApiService.js';
import AnalysisService from './AnalysisService.js';
import MessageModel from '../models/MessageModel.js';
import EventBus from '../core/EventBus.js';
import Utils from '../core/Utils.js';

class ChatService {
    // Chat state
    static state = {
        conversationHistory: [],
        currentAnalysis: null,
        processingInput: false,
        context: {
            lastInputType: null,  // 'phone', 'question', 'followup', 'general'
            lastPhoneNumber: null,
            questionCount: 0
        }
    };
    
    /**
     * Initialize the chat service
     * @returns {boolean} Success status
     */
    static init() {
        try {
            // Add welcome message to history
            this.addToHistory('assistant', 'Xin chào! Tôi là trợ lý phân tích số điện thoại theo phương pháp Tứ Cát Tứ Hung. Bạn có thể nhập số điện thoại để tôi phân tích hoặc đặt câu hỏi về ý nghĩa các con số.');
            
            return true;
        } catch (error) {
            Utils.debug('Error initializing chat:', error);
            return false;
        }
    }
    
    /**
     * Process user input (message or phone number)
     * @param {string} input - User input text
     */
    static async processUserInput(input) {
        if (this.state.processingInput) return;
        
        this.state.processingInput = true;
        
        // Show typing indicator
        EventBus.publish('chat:typingStarted');
        
        try {
            // Thêm vào lịch sử trò chuyện
            this.addToHistory('user', input);
            
            // Phân tích loại đầu vào
            const inputType = this.detectInputType(input);
            Utils.debug('Detected input type:', inputType);
            
            // Xử lý dựa vào loại input
            switch(inputType) {
                case 'phone':
                    // Lưu số điện thoại hiện tại và loại đầu vào
                    this.state.context.lastInputType = 'phone';
                    this.state.context.lastPhoneNumber = input.replace(/\D/g, '');
                    this.state.context.questionCount = 0;
                    
                    await this.processPhoneNumber(input);
                    break;
                    
                case 'followup':
                    // Tăng số lượng câu hỏi đã hỏi
                    this.state.context.questionCount++;
                    this.state.context.lastInputType = 'followup';
                    
                    await this.processFollowUpQuestion(input);
                    break;
                    
                case 'general':
                    this.state.context.lastInputType = 'general';
                    await this.processGeneralQuestion(input);
                    break;
                    
                case 'compare':
                    this.state.context.lastInputType = 'compare';
                    await this.processCompareRequest(input);
                    break;
                    
                default:
                    // Mặc định xử lý như câu hỏi dựa trên ngữ cảnh
                    if (this.state.context.lastPhoneNumber) {
                        this.state.context.questionCount++;
                        this.state.context.lastInputType = 'question';
                        await this.processQuestion(input);
                    } else {
                        this.state.context.lastInputType = 'general';
                        await this.processGeneralQuestion(input);
                    }
                    break;
            }
        } catch (error) {
            Utils.debug('Error processing input:', error);
            
            // Create message model for the error
            const errorMessage = new MessageModel({
                role: 'assistant',
                content: 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', errorMessage);
            
            // Add to history
            this.addToHistory('assistant', errorMessage.content);
        } finally {
            // Hide typing indicator
            EventBus.publish('chat:typingEnded');
            
            // Reset processing state
            this.state.processingInput = false;
        }
    }
    
    /**
     * Phát hiện loại đầu vào của người dùng
     * @param {string} input - Đầu vào người dùng
     * @returns {string} Loại đầu vào ('phone', 'followup', 'general', 'compare')
     */
    static detectInputType(input) {
        // Chuẩn hóa đầu vào
        const cleanInput = input.trim().toLowerCase();
        
        // Kiểm tra nếu là số điện thoại
        const phonePattern = /^[0-9\s\.\-\+\(\)]{8,15}$/;
        if (phonePattern.test(cleanInput.replace(/\D/g, ''))) {
            return 'phone';
        }
        
        // Kiểm tra nếu là yêu cầu so sánh
        const compareKeywords = [
            'so sánh', 'đối chiếu', 'so với', 'so với nhau', 'so le',
            'số nào tốt hơn', 'số nào hay hơn', 'số nào phù hợp hơn',
            'số nào thích hợp hơn', 'số nào mạnh hơn'
        ];
        
        // Kiểm tra xem có chứa từ khóa so sánh và ít nhất hai số điện thoại
        const hasCompareKeyword = compareKeywords.some(keyword => cleanInput.includes(keyword));
        const phoneNumbers = this.extractPhoneNumbers(cleanInput);
        
        if (hasCompareKeyword && phoneNumbers.length >= 2) {
            return 'compare';
        }
        
        // Kiểm tra nếu là câu hỏi tiếp theo dựa vào từ khóa
        const followupKeywords = [
            'vậy còn', 'thế còn', 'vậy thì', 'liên quan đến', 
            'điểm mạnh', 'điểm yếu', 'vậy', 'thế', 'tiếp theo', 
            'còn nữa', 'thêm', 'chi tiết hơn', 'nói thêm', 
            'giải thích thêm', 'ngoài ra'
        ];
        
        const questionKeywords = [
            'tại sao', 'vì sao', 'như thế nào', 'có ý nghĩa gì',
            'là gì', 'có nghĩa gì', 'để làm gì', 'nên làm gì',
            'làm sao', 'cách nào', 'cải thiện', 'giải quyết'
        ];
        
        // Nếu ngữ cảnh trước đó là về số điện thoại và câu hiện tại có vẻ là follow-up
        if (this.state.context.lastInputType && 
            (this.state.context.lastInputType === 'phone' || this.state.context.lastInputType === 'question' || this.state.context.lastInputType === 'followup') &&
            (followupKeywords.some(keyword => cleanInput.includes(keyword)) || 
             questionKeywords.some(keyword => cleanInput.includes(keyword)))) {
            return 'followup';
        }
        
        // Kiểm tra nếu là câu hỏi chung về chiêm tinh học số
        const generalKeywords = [
            'ý nghĩa số', 'con số', 'các số', 'ba số', 'tứ cát', 'tứ hung', 'bát tinh',
            'chiêm tinh học số', 'phong thủy số', 'phương pháp', 'nguyên lý',
            'phân tích số', 'quy tắc', 'cách xem', 'ý nghĩa bát tinh'
        ];
        
        if (generalKeywords.some(keyword => cleanInput.includes(keyword))) {
            return 'general';
        }
        
        // Mặc định dựa vào ngữ cảnh
        return this.state.context.lastInputType ? 'followup' : 'general';
    }
    
    /**
     * Trích xuất các số điện thoại từ một chuỗi
     * @param {string} text - Văn bản đầu vào
     * @returns {Array} Mảng các số điện thoại tìm thấy
     */
    static extractPhoneNumbers(text) {
        // Tìm các mẫu có thể là số điện thoại
        const phonePattern = /(\b\d{10}\b|\b\d{4}[\s\.-]?\d{3}[\s\.-]?\d{3}\b|\b\d{3}[\s\.-]?\d{3}[\s\.-]?\d{4}\b)/g;
        const matches = text.match(phonePattern) || [];
        
        // Lọc và chuẩn hóa các kết quả
        return matches.map(match => match.replace(/\D/g, ''));
    }
    
    /**
     * Process a phone number
     * @param {string} phoneNumber - Phone number to process
     */
    static async processPhoneNumber(phoneNumber) {
        try {
            // Analyze the phone number
            const analysis = await AnalysisService.analyzePhoneNumber(phoneNumber);
            
            // Store current analysis
            this.state.currentAnalysis = analysis;
            
            // Get response text
            let responseText = '';
            if (analysis.geminiResponse) {
                responseText = analysis.geminiResponse;
            } else {
                responseText = `Đã phân tích số điện thoại ${phoneNumber}.`;
            }
            
            // Create message model
            const message = new MessageModel({
                role: 'assistant',
                content: responseText,
                analysisData: analysis
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', message);
            
            // Add to history
            this.addToHistory('assistant', responseText, analysis);
            
        } catch (error) {
            Utils.debug('Error analyzing phone number:', error);
            
            // Create error message
            const errorMessage = new MessageModel({
                role: 'assistant',
                content: 'Xin lỗi, đã xảy ra lỗi khi phân tích số điện thoại. Vui lòng thử lại sau.'
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', errorMessage);
            
            // Add to history
            this.addToHistory('assistant', errorMessage.content);
        }
    }
    
    /**
     * Process a question about a phone number
     * @param {string} question - Question to process
     */
    static async processQuestion(question) {
        try {
            // Đảm bảo rằng chúng ta có một số điện thoại trong ngữ cảnh
            if (!this.state.context.lastPhoneNumber) {
                const message = new MessageModel({
                    role: 'assistant',
                    content: 'Bạn cần nhập số điện thoại trước khi hỏi câu hỏi về nó. Hãy nhập một số điện thoại để tôi phân tích.'
                });
                
                EventBus.publish('chat:messageReceived', message);
                this.addToHistory('assistant', message.content);
                return;
            }
            
            // Ask the question
            const response = await AnalysisService.askQuestion({
                question: question,
                phoneNumber: this.state.context.lastPhoneNumber,
                type: 'question'
            });
            
            // Extract the answer
            let answer = '';
            if (response.analysis && response.analysis.answer) {
                answer = response.analysis.answer;
            } else if (response.data && response.data.answer) {
                answer = response.data.answer;
            } else if (typeof response.data === 'string') {
                answer = response.data;
            } else {
                answer = 'Đã xử lý câu hỏi của bạn, nhưng không tìm thấy câu trả lời cụ thể.';
            }
            
            // Create message model
            const message = new MessageModel({
                role: 'assistant',
                content: answer
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', message);
            
            // Add to history
            this.addToHistory('assistant', answer);
        } catch (error) {
            Utils.debug('Error processing question:', error);
            
            // Create error message
            const errorMessage = new MessageModel({
                role: 'assistant',
                content: 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', errorMessage);
            
            // Add to history
            this.addToHistory('assistant', errorMessage.content);
        }
    }
    
    /**
     * Process a follow-up question
     * @param {string} question - Follow-up question to process
     */
    static async processFollowUpQuestion(question) {
        try {
            // Tạo payload cho câu hỏi follow-up
            const options = {
                question: question,
                type: 'followup'
            };
            
            // Thêm số điện thoại hiện tại nếu có
            if (this.state.context.lastPhoneNumber) {
                options.phoneNumber = this.state.context.lastPhoneNumber;
            }
            
            // Ask the question
            const response = await AnalysisService.askQuestion(options);
            
            // Extract the answer
            let answer = '';
            if (response.analysis && response.analysis.answer) {
                answer = response.analysis.answer;
            } else if (response.data && response.data.answer) {
                answer = response.data.answer;
            } else if (typeof response.data === 'string') {
                answer = response.data;
            } else {
                answer = 'Đã xử lý câu hỏi của bạn, nhưng không tìm thấy câu trả lời cụ thể.';
            }
            
            // Create message model
            const message = new MessageModel({
                role: 'assistant',
                content: answer
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', message);
            
            // Add to history
            this.addToHistory('assistant', answer);
        } catch (error) {
            Utils.debug('Error processing follow-up question:', error);
            
            // Try fallback to general question
            try {
                Utils.debug('Falling back to general question processing');
                await this.processGeneralQuestion(question);
            } catch (fallbackError) {
                Utils.debug('Fallback also failed:', fallbackError);
                
                // Create error message
                const errorMessage = new MessageModel({
                    role: 'assistant',
                    content: 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
                });
                
                // Publish message
                EventBus.publish('chat:messageReceived', errorMessage);
                
                // Add to history
                this.addToHistory('assistant', errorMessage.content);
            }
        }
    }
    
    /**
     * Process a general question about numerology
     * @param {string} question - General question to process
     */
    static async processGeneralQuestion(question) {
        try {
            // Ask the question
            const response = await AnalysisService.askQuestion({
                question: question,
                type: 'general'
            });
            
            // Extract the answer
            let answer = '';
            if (response.analysis && response.analysis.answer) {
                answer = response.analysis.answer;
            } else if (response.data && response.data.answer) {
                answer = response.data.answer;
            } else if (typeof response.data === 'string') {
                answer = response.data;
            } else {
                answer = 'Đã xử lý câu hỏi của bạn, nhưng không tìm thấy câu trả lời cụ thể.';
            }
            
            // Create message model
            const message = new MessageModel({
                role: 'assistant',
                content: answer
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', message);
            
            // Add to history
            this.addToHistory('assistant', answer);
        } catch (error) {
            Utils.debug('Error processing general question:', error);
            
            // Create error message
            const errorMessage = new MessageModel({
                role: 'assistant',
                content: 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', errorMessage);
            
            // Add to history
            this.addToHistory('assistant', errorMessage.content);
        }
    }
    
    /**
     * Process a request to compare phone numbers
     * @param {string} input - User input containing phone numbers to compare
     */
    static async processCompareRequest(input) {
        try {
            // Extract phone numbers
            const phoneNumbers = this.extractPhoneNumbers(input);
            
            if (phoneNumbers.length < 2) {
                const message = new MessageModel({
                    role: 'assistant',
                    content: 'Để so sánh số điện thoại, vui lòng cung cấp ít nhất 2 số điện thoại.'
                });
                
                EventBus.publish('chat:messageReceived', message);
                this.addToHistory('assistant', message.content);
                return;
            }
            
            // Ask the comparison question
            const response = await AnalysisService.askQuestion({
                question: input,
                phoneNumbers: phoneNumbers,
                type: 'compare'
            });
            
            // Extract the answer
            let answer = '';
            if (response.analysis && response.analysis.answer) {
                answer = response.analysis.answer;
            } else if (response.data && response.data.answer) {
                answer = response.data.answer;
            } else if (typeof response.data === 'string') {
                answer = response.data;
            } else {
                answer = `Đã so sánh các số điện thoại: ${phoneNumbers.join(', ')}. Không tìm thấy thông tin chi tiết về so sánh.`;
            }
            
            // Create message model
            const message = new MessageModel({
                role: 'assistant',
                content: answer
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', message);
            
            // Add to history
            this.addToHistory('assistant', answer);
        } catch (error) {
            Utils.debug('Error processing compare request:', error);
            
            // Create error message
            const errorMessage = new MessageModel({
                role: 'assistant',
                content: 'Xin lỗi, đã xảy ra lỗi khi so sánh các số điện thoại. Vui lòng thử lại sau.'
            });
            
            // Publish message
            EventBus.publish('chat:messageReceived', errorMessage);
            
            // Add to history
            this.addToHistory('assistant', errorMessage.content);
        }
    }
    
    /**
     * Add a message to the conversation history
     * @param {string} role - Message role ('user' or 'assistant')
     * @param {string} content - Message content
     * @param {object} data - Optional additional data
     */
    static addToHistory(role, content, data = null) {
        const message = {
            role,
            content,
            timestamp: new Date().toISOString(),
            data
        };
        
        this.state.conversationHistory.push(message);
        
        // Keep history to a reasonable size
        if (this.state.conversationHistory.length > 20) {
            this.state.conversationHistory = this.state.conversationHistory.slice(-20);
        }
    }
    
    /**
     * Get recent conversation history
     * @param {number} count - Number of recent messages to retrieve
     * @returns {Array} Recent conversation history
     */
    static getRecentHistory(count = 5) {
        return this.state.conversationHistory.slice(-count);
    }
    
    /**
     * Get current analysis
     * @returns {object|null} Current analysis data or null
     */
    static getCurrentAnalysis() {
        return this.state.currentAnalysis;
    }
    
    /**
     * Clear conversation history
     */
    static clearHistory() {
        this.state.conversationHistory = [];
        this.state.currentAnalysis = null;
        this.state.context = {
            lastInputType: null,
            lastPhoneNumber: null,
            questionCount: 0
        };
        
        Utils.debug('Conversation history and context cleared');
        
        // Publish event for views to update
        EventBus.publish('chat:cleared');
    }
}

export default ChatService;
/**
 * Chat Service for Phone Analysis App
 * Handles chat interactions and phone number analysis
 */
import ApiService from './ApiService.js';
import AnalysisService from './AnalysisService.js';
import MessageModel from '../models/MessageModel.js';
import EventBus from '../core/EventBus.js';
import Utils from '../core/Utils.js';
import Storage from '../core/Storage.js';

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
        console.log('Initializing ChatService...');
        try {
            // Try to load conversation history from storage
            const history = this.loadConversationHistory();
            if (history && history.length) {
                this.state.conversationHistory = history;
                console.log('Loaded conversation history:', history.length, 'messages');
            } else {
                // Add welcome message to history if no history exists
                this.addToHistory('assistant', 'Xin chào! Tôi là trợ lý phân tích số điện thoại theo phương pháp Tứ Cát Tứ Hung. Bạn có thể nhập số điện thoại để tôi phân tích hoặc đặt câu hỏi về ý nghĩa các con số.');
                console.log('Added welcome message to empty history');
            }
            
            console.log('ChatService initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing chat:', error);
            return false;
        }
    }
    
    /**
     * Process user input (message or phone number)
     * @param {string} input - User input text
     */
    static async processUserInput(input) {
        console.log('Processing user input:', input);
        
        if (this.state.processingInput) {
            console.log('Already processing input, ignoring new input');
            return;
        }
        
        this.state.processingInput = true;
        
        // Show typing indicator
        EventBus.publish('chat:typingStarted');
        
        try {
            // Thêm vào lịch sử trò chuyện
            this.addToHistory('user', input);
            
            // Phân tích loại đầu vào
            const inputType = this.detectInputType(input);
            console.log('Detected input type:', inputType);
            
            // Xử lý dựa vào loại input
            let responseContent = '';
            let analysisData = null;
            
            switch(inputType) {
                case 'phone':
                    // Lưu số điện thoại hiện tại và loại đầu vào
                    this.state.context.lastInputType = 'phone';
                    this.state.context.lastPhoneNumber = input.replace(/\D/g, '');
                    this.state.context.questionCount = 0;
                    
                    const phoneResult = await this.processPhoneNumber(input);
                    responseContent = phoneResult.content;
                    analysisData = phoneResult.analysisData;
                    break;
                    
                case 'followup':
                    // Tăng số lượng câu hỏi đã hỏi
                    this.state.context.questionCount++;
                    this.state.context.lastInputType = 'followup';
                    
                    const followupResult = await this.processFollowUpQuestion(input);
                    responseContent = followupResult.content;
                    analysisData = followupResult.analysisData;
                    break;
                    
                case 'general':
                    this.state.context.lastInputType = 'general';
                    const generalResult = await this.processGeneralQuestion(input);
                    responseContent = generalResult.content;
                    break;
                    
                case 'compare':
                    this.state.context.lastInputType = 'compare';
                    const compareResult = await this.processCompareRequest(input);
                    responseContent = compareResult.content;
                    break;
                    
                default:
                    // Mặc định xử lý như câu hỏi dựa trên ngữ cảnh
                    if (this.state.context.lastPhoneNumber) {
                        this.state.context.questionCount++;
                        this.state.context.lastInputType = 'question';
                        const questionResult = await this.processQuestion(input);
                        responseContent = questionResult.content;
                    } else {
                        this.state.context.lastInputType = 'general';
                        const unknownResult = await this.processGeneralQuestion(input);
                        responseContent = unknownResult.content;
                    }
                    break;
            }
            
            // Create message object for the response
            const message = {
                content: responseContent || 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn.',
                analysisData: analysisData
            };
            
            // Thêm vào lịch sử trò chuyện
            this.addToHistory('assistant', message.content, message.analysisData);
            
            // Publish message
            EventBus.publish('chat:messageReceived', message);
            
            return message;
        } catch (error) {
            console.error('Error processing input:', error);
            
            // Create message model for the error
            const errorMessage = {
                content: 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
                analysisData: null
            };
            
            // Publish message
            EventBus.publish('chat:messageReceived', errorMessage);
            
            // Add to history
            this.addToHistory('assistant', errorMessage.content);
            
            return errorMessage;
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
     * @returns {Object} Processing result
     */
    static async processPhoneNumber(phoneNumber) {
        console.log('Processing phone number:', phoneNumber);
        
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
            
            console.log('Phone number analyzed successfully');
            
            return {
                content: responseText,
                analysisData: analysis
            };
            
        } catch (error) {
            console.error('Error analyzing phone number:', error);
            throw error;
        }
    }
    
    /**
     * Process a question about a phone number
     * @param {string} question - Question to process
     * @returns {Object} Processing result
     */
    static async processQuestion(question) {
        console.log('Processing question:', question);
        
        try {
            // Đảm bảo rằng chúng ta có một số điện thoại trong ngữ cảnh
            if (!this.state.context.lastPhoneNumber) {
                return {
                    content: 'Bạn cần nhập số điện thoại trước khi hỏi câu hỏi về nó. Hãy nhập một số điện thoại để tôi phân tích.',
                    analysisData: null
                };
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
            
            console.log('Question processed successfully');
            
            return {
                content: answer,
                analysisData: null
            };
        } catch (error) {
            console.error('Error processing question:', error);
            throw error;
        }
    }
    
    /**
     * Process a follow-up question
     * @param {string} question - Follow-up question to process
     * @returns {Object} Processing result
     */
    static async processFollowUpQuestion(question) {
        console.log('Processing follow-up question:', question);
        
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
            
            console.log('Follow-up question processed successfully');
            
            return {
                content: answer,
                analysisData: null
            };
        } catch (error) {
            console.error('Error processing follow-up question:', error);
            
            // Fallback to general question
            console.log('Falling back to general question processing');
            return await this.processGeneralQuestion(question);
        }
    }
    
    /**
     * Process a general question about numerology
     * @param {string} question - General question to process
     * @returns {Object} Processing result
     */
    static async processGeneralQuestion(question) {
        console.log('Processing general question:', question);
        
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
            
            console.log('General question processed successfully');
            
            return {
                content: answer,
                analysisData: null
            };
        } catch (error) {
            console.error('Error processing general question:', error);
            throw error;
        }
    }
    
    /**
     * Process a request to compare phone numbers
     * @param {string} input - User input containing phone numbers to compare
     * @returns {Object} Processing result
     */
    static async processCompareRequest(input) {
        console.log('Processing compare request:', input);
        
        try {
            // Extract phone numbers
            const phoneNumbers = this.extractPhoneNumbers(input);
            
            if (phoneNumbers.length < 2) {
                return {
                    content: 'Để so sánh số điện thoại, vui lòng cung cấp ít nhất 2 số điện thoại.',
                    analysisData: null
                };
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
            
            console.log('Compare request processed successfully');
            
            return {
                content: answer,
                analysisData: null
            };
        } catch (error) {
            console.error('Error processing compare request:', error);
            throw error;
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
        if (this.state.conversationHistory.length > 50) {
            this.state.conversationHistory = this.state.conversationHistory.slice(-50);
        }
        
        // Save to local storage
        this.saveConversationHistory(this.state.conversationHistory);
        
        return message;
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
     * Load conversation history from localStorage
     * @returns {Array} Conversation history or empty array
     */
    static loadConversationHistory() {
        try {
            const historyString = localStorage.getItem('phone_analysis_chat_history');
            if (historyString) {
                return JSON.parse(historyString);
            }
        } catch (error) {
            console.error('Error loading conversation history from localStorage:', error);
        }
        return [];
    }
    
    /**
     * Save conversation history to localStorage
     * @param {Array} history - Conversation history to save
     */
    static saveConversationHistory(history) {
        try {
            localStorage.setItem('phone_analysis_chat_history', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving conversation history to localStorage:', error);
        }
    }
    
    /**
     * Get current analysis
     * @returns {object|null} Current analysis data or null
     */
    static getCurrentAnalysis() {
        return this.state.currentAnalysis;
    }
    
    /**
     * Get welcome message
     * @returns {object} Welcome message object
     */
    static getWelcomeMessage() {
        return {
            role: 'assistant',
            content: 'Xin chào! Tôi là trợ lý phân tích số điện thoại theo phương pháp Tứ Cát Tứ Hung. Bạn có thể nhập số điện thoại để tôi phân tích hoặc đặt câu hỏi về ý nghĩa các con số.',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Clear conversation history
     */
    static clearHistory() {
        this.state.conversationHistory = [this.getWelcomeMessage()];
        this.state.currentAnalysis = null;
        this.state.context = {
            lastInputType: null,
            lastPhoneNumber: null,
            questionCount: 0
        };
        
        // Save to local storage
        this.saveConversationHistory(this.state.conversationHistory);
        
        console.log('Conversation history and context cleared');
    }
}

export default ChatService;
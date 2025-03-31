/**
 * ChatView Component
 * Quản lý hiển thị và tương tác với phần chat
 */

import Templates from '../Templates.js';
import EventBus from '../../core/EventBus.js';
import Utils from '../../core/Utils.js';

const ChatView = (function() {
    // Cache DOM elements
    let elements = {};
    let initialized = false;
    
    /**
     * Khởi tạo view
     */
    function init() {
        console.log('ChatView initializing...');
        
        if (initialized) {
            console.log('ChatView already initialized');
            return;
        }
        
        // Check if we're on the app page
        if (!document.getElementById('app-container')) {
            console.log('Not on app page, skipping ChatView initialization');
            return;
        }
        
        // Cache DOM elements
        elements = {
            chatContainer: document.getElementById('chat-container'),
            chatMessages: document.getElementById('chat-messages'),
            userInput: document.getElementById('user-input'),
            sendButton: document.getElementById('send-button'),
            typingIndicator: document.getElementById('typing-indicator'),
            welcomeBanner: document.getElementById('welcome-banner')
        };
        
        console.log('ChatView elements:', elements);
        
        // Check if elements were found
        if (!elements.chatMessages || !elements.userInput) {
            console.warn('Chat elements not found in the DOM. Make sure the IDs match those in the HTML.');
            return;
        }
        
        // Set up event listeners
        if (elements.sendButton) {
            elements.sendButton.addEventListener('click', handleSendMessage);
            console.log('Set up send button listener');
        }
        
        if (elements.userInput) {
            elements.userInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            });
            
            // Auto-resize textarea
            elements.userInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
            
            console.log('Set up user input listeners');
        }
        
        // Subscribe to events
        EventBus.subscribe('chat:user-message-added', handleUserMessageAdded);
        EventBus.subscribe('chat:bot-message-added', handleBotMessageAdded);
        EventBus.subscribe('chat:typing-started', showTypingIndicator);
        EventBus.subscribe('chat:typing-ended', hideTypingIndicator);
        EventBus.subscribe('chat:cleared', handleChatCleared);
        console.log('Subscribed to chat events');
        
        initialized = true;
        console.log('ChatView initialized successfully');
    }
    
    /**
     * Xử lý khi nhấn nút gửi tin nhắn
     * @private
     */
    function handleSendMessage() {
        console.log('Send message button clicked');
        
        if (!elements.userInput) {
            console.error('User input element not found');
            return;
        }
        
        const text = elements.userInput.value.trim();
        if (!text) {
            console.log('Empty message, ignoring');
            return;
        }
        
        console.log('Sending message:', text);
        
        // Clear input
        elements.userInput.value = '';
        elements.userInput.style.height = 'auto';
        
        // Emit event
        EventBus.publish('chat:send-message', text);
    }
    
    /**
     * Xử lý khi có tin nhắn người dùng được thêm vào
     * @param {Object} message - Đối tượng tin nhắn
     */
    function handleUserMessageAdded(message) {
        console.log('Adding user message to chat:', message);
        addUserMessage(message);
    }
    
    /**
     * Xử lý khi có tin nhắn bot được thêm vào
     * @param {Object} message - Đối tượng tin nhắn
     */
    function handleBotMessageAdded(message) {
        console.log('Adding bot message to chat:', message);
        addBotMessage(message);
    }
    
    /**
     * Thêm tin nhắn của người dùng vào chat
     * @param {Object} message - Đối tượng tin nhắn
     */
    function addUserMessage(message) {
        console.log('Adding user message to DOM:', message);
        
        if (!elements.chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        // Hide welcome banner if visible
        if (elements.welcomeBanner) {
            elements.welcomeBanner.style.display = 'none';
        }
        
        try {
            // Create message element
            const messageHTML = Templates.userMessage(message);
            elements.chatMessages.insertAdjacentHTML('beforeend', messageHTML);
            console.log('User message added to DOM');
            
            // Scroll to bottom
            scrollToBottom();
        } catch (error) {
            console.error('Error adding user message:', error);
        }
    }
    
    /**
     * Thêm tin nhắn của bot vào chat
     * @param {Object} message - Đối tượng tin nhắn
     */
    function addBotMessage(message) {
        console.log('Adding bot message to DOM:', message);
        
        if (!elements.chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        // Hide welcome banner if visible
        if (elements.welcomeBanner) {
            elements.welcomeBanner.style.display = 'none';
        }
        
        try {
            // Create message element
            const messageHTML = Templates.botMessage(message);
            elements.chatMessages.insertAdjacentHTML('beforeend', messageHTML);
            console.log('Bot message added to DOM');
            
            // Get the added message element
            const messageElement = document.getElementById(message.id);
            
            // Add analysis data if provided
            if (message.analysisData && messageElement) {
                const analysisHTML = Templates.analysisContainer(message.analysisData);
                
                const analysisDataElement = messageElement.querySelector('.analysis-data');
                if (analysisDataElement) {
                    analysisDataElement.innerHTML = analysisHTML;
                    analysisDataElement.classList.remove('hidden');
                    console.log('Analysis data added to message');
                }
                
                // Set up details toggle
                setupAnalysisInteractions(messageElement, message.analysisData);
            }
            
            // Scroll to bottom
            scrollToBottom();
        } catch (error) {
            console.error('Error adding bot message:', error);
        }
    }
    
    /**
     * Thiết lập tương tác cho phân tích
     * @param {HTMLElement} messageElement - Phần tử tin nhắn
     * @param {Object} analysisData - Dữ liệu phân tích
     */
    function setupAnalysisInteractions(messageElement, analysisData) {
        // Set up details toggle
        const detailsToggle = messageElement.querySelector('.details-toggle');
        if (detailsToggle) {
            detailsToggle.addEventListener('click', function() {
                const expanded = this.getAttribute('data-expanded') === 'true';
                const detailsSection = messageElement.querySelector('.analysis-details');
                
                if (expanded) {
                    detailsSection.style.display = 'none';
                    this.setAttribute('data-expanded', 'false');
                    this.textContent = 'Xem chi tiết';
                } else {
                    detailsSection.style.display = 'block';
                    this.setAttribute('data-expanded', 'true');
                    this.textContent = 'Ẩn chi tiết';
                    
                    // Load details content if empty
                    if (detailsSection.innerHTML.trim() === '') {
                        EventBus.publish('analysis:loadDetails', {
                            element: detailsSection,
                            data: analysisData
                        });
                    }
                }
            });
        }
        
        // Set up category buttons
        const categoryButtons = messageElement.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                EventBus.publish('chat:category-selected', category);
            });
        });
        
        // Show suggestions
        const suggestionText = messageElement.querySelector('.suggestion-text');
        const suggestionChips = messageElement.querySelector('.suggestion-chips');
        
        if (suggestionText) suggestionText.classList.remove('hidden');
        if (suggestionChips) suggestionChips.classList.remove('hidden');
        
        // Set up example questions
        setupExampleQuestions(messageElement, analysisData);
    }
    
    /**
     * Thiết lập câu hỏi mẫu dựa trên dữ liệu phân tích
     * @param {HTMLElement} messageElement - Phần tử tin nhắn
     * @param {Object} analysisData - Dữ liệu phân tích
     */
    function setupExampleQuestions(messageElement, analysisData) {
        const questionContainer = messageElement.querySelector('.question-examples');
        if (!questionContainer) return;
        
        // Default questions
        const questions = [
            "Số này ảnh hưởng thế nào đến sự nghiệp của tôi?",
            "Mối quan hệ với người khác có tốt không?", 
            "Số này có phải là số may mắn không?",
            "Tôi có nên giữ số điện thoại này không?"
        ];
        
        // Add data-specific questions
        if (analysisData.balance === 'HUNG_HEAVY') {
            questions.push("Làm thế nào để hóa giải sao hung?");
        }
        
        // Clear and populate container
        questionContainer.innerHTML = '';
        questions.forEach(question => {
            const button = document.createElement('button');
            button.className = 'example-question-btn';
            button.textContent = question;
            button.addEventListener('click', () => {
                if (elements.userInput) {
                    elements.userInput.value = question;
                    elements.userInput.focus();
                }
            });
            questionContainer.appendChild(button);
        });
        
        questionContainer.classList.remove('hidden');
    }
    
    /**
     * Xử lý khi chat được xóa
     * @param {Array} messages - Mảng tin nhắn còn lại (nếu có)
     */
    function handleChatCleared(messages) {
        console.log('Clearing chat display, remaining messages:', messages);
        
        if (!elements.chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        // Clear all messages
        elements.chatMessages.innerHTML = '';
        
        // Add back welcome message if provided
        if (messages && messages.length > 0) {
            // Usually the first message is the welcome message
            const welcomeMessage = messages[0];
            if (welcomeMessage && welcomeMessage.role === 'assistant') {
                addBotMessage(welcomeMessage);
            }
        }
        
        // Show welcome banner if it exists
        if (elements.welcomeBanner) {
            elements.welcomeBanner.style.display = 'flex';
        }
        
        console.log('Chat display cleared');
    }
    
    /**
     * Hiển thị typing indicator
     */
    function showTypingIndicator() {
        console.log('Showing typing indicator');
        
        if (elements.typingIndicator) {
            elements.typingIndicator.classList.remove('hidden');
        }
    }
    
    /**
     * Ẩn typing indicator
     */
    function hideTypingIndicator() {
        console.log('Hiding typing indicator');
        
        if (elements.typingIndicator) {
            elements.typingIndicator.classList.add('hidden');
        }
    }
    
    /**
     * Cuộn chat xuống dưới cùng
     */
    function scrollToBottom() {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    return {
        init,
        addUserMessage,
        addBotMessage,
        showTypingIndicator,
        hideTypingIndicator
    };
})();

export default ChatView;
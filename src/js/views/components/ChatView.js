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
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements
        elements = {
            chatContainer: document.getElementById('chat-container'),
            chatMessages: document.getElementById('chat-messages'),
            userInput: document.getElementById('user-input'),
            sendButton: document.getElementById('send-button'),
            typingIndicator: document.getElementById('typing-indicator'),
            welcomeBanner: document.getElementById('welcome-banner')
        };
        
        // Set up event listeners
        if (elements.sendButton) {
            elements.sendButton.addEventListener('click', handleSendMessage);
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
        }
        
        // Subscribe to events
        EventBus.subscribe('message:user', addUserMessage);
        EventBus.subscribe('message:bot', addBotMessage);
        EventBus.subscribe('chat:clear', clearChat);
        EventBus.subscribe('typing:start', showTypingIndicator);
        EventBus.subscribe('typing:stop', hideTypingIndicator);
    }
    
    /**
     * Xử lý khi nhấn nút gửi tin nhắn
     * @private
     */
    function handleSendMessage() {
        if (!elements.userInput) return;
        
        const text = elements.userInput.value.trim();
        if (!text) return;
        
        // Clear input
        elements.userInput.value = '';
        elements.userInput.style.height = 'auto';
        
        // Emit event
        EventBus.publish('user:message', text);
    }
    
    /**
     * Thêm tin nhắn của người dùng vào chat
     * @param {Object} message - Đối tượng tin nhắn
     */
    function addUserMessage(message) {
        if (!elements.chatMessages) return;
        
        // Hide welcome banner if visible
        if (elements.welcomeBanner) {
            elements.welcomeBanner.style.display = 'none';
        }
        
        const messageHTML = Templates.userMessage(message);
        elements.chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        
        scrollToBottom();
    }
    
    /**
     * Thêm tin nhắn của bot vào chat
     * @param {Object} message - Đối tượng tin nhắn
     * @param {Object} analysisData - Dữ liệu phân tích (nếu có)
     */
    function addBotMessage(message, analysisData = null) {
        if (!elements.chatMessages) return;
        
        // Hide welcome banner if visible
        if (elements.welcomeBanner) {
            elements.welcomeBanner.style.display = 'none';
        }
        
        const messageHTML = Templates.botMessage(message);
        elements.chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        
        // Get the added message element
        const messageElement = document.getElementById(message.id);
        
        // Add analysis data if provided
        if (analysisData && messageElement) {
            const analysisHTML = Templates.analysisContainer(analysisData);
            messageElement.querySelector('.analysis-data').innerHTML = analysisHTML;
            messageElement.querySelector('.analysis-data').classList.remove('hidden');
            
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
                    EventBus.publish('category:selected', category);
                });
            });
            
            // Show suggestions
            messageElement.querySelector('.suggestion-text').classList.remove('hidden');
            messageElement.querySelector('.suggestion-chips').classList.remove('hidden');
            
            // Set up example questions
            setupExampleQuestions(messageElement, analysisData);
        }
        
        scrollToBottom();
    }
    
    /**
     * Thiết lập câu hỏi mẫu dựa trên dữ liệu phân tích
     * @private
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
     * Hiển thị typing indicator
     */
    function showTypingIndicator() {
        if (elements.typingIndicator) {
            elements.typingIndicator.classList.remove('hidden');
        }
    }
    
    /**
     * Ẩn typing indicator
     */
    function hideTypingIndicator() {
        if (elements.typingIndicator) {
            elements.typingIndicator.classList.add('hidden');
        }
    }
    
    /**
     * Xóa tất cả tin nhắn chat
     */
    function clearChat() {
        if (elements.chatMessages) {
            elements.chatMessages.innerHTML = '';
        }
        
        // Show welcome banner
        if (elements.welcomeBanner) {
            elements.welcomeBanner.style.display = 'flex';
        }
    }
    
    /**
     * Cuộn chat xuống dưới cùng
     * @private
     */
    function scrollToBottom() {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    }
    
    return {
        init,
        addUserMessage,
        addBotMessage,
        showTypingIndicator,
        hideTypingIndicator,
        clearChat
    };
})();

export default ChatView;
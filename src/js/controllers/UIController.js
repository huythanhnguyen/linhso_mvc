// src/controllers/UIController.js

/**
 * UIController - Quản lý giao diện người dùng
 */
class UIController {
    /**
     * Khởi tạo UIController
     * @param {ApiService} apiService - Service gọi API
     */
    constructor(apiService) {
        this.apiService = apiService;
        
        // Trạng thái UI
        this.state = {
            loading: false,
            currentAnalysis: null,
            analysisHistory: [],
            isInfoPanelVisible: false,
            historyPagination: {
                currentPage: 1,
                totalPages: 1,
                limit: 20,
                total: 0
            }
        };
    }

    /**
     * Khởi tạo controller
     */
    init() {
        // Kiểm tra các template
        this._checkTemplates();
        
        // Thiết lập sự kiện
        this._setupEventListeners();
        
        // Thiết lập tabs
        this._setupTabs();
        
        // Cải thiện giao diện chat
        this._enhanceChatDisplay();
    }

    /**
     * Kiểm tra các template cần thiết
     * @private
     */
    _checkTemplates() {
        const botTemplate = document.getElementById('bot-message-template');
        const userTemplate = document.getElementById('user-message-template');
        
        if (!botTemplate || !userTemplate) {
            console.error('Chat templates not found. Please check HTML structure.');
        }
    }

    /**
     * Thiết lập các sự kiện
     * @private
     */
    _setupEventListeners() {
        // Nút gửi tin nhắn
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
        }
        
        // Input người dùng - Nhấn Enter
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
            
            // Auto-resize textarea
            userInput.addEventListener('input', this._resizeTextarea.bind(this, userInput));
        }
        
        // Nút xóa chat
        const clearChatBtn = document.getElementById('clear-chat-mobile');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện hiện tại?')) {
                    this.clearChat();
                }
            });
        }
        
        // Nút xóa lịch sử
        const clearHistoryBtn = document.getElementById('clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Bạn có chắc muốn xóa lịch sử phân tích?')) {
                    this.clearAnalysisHistory();
                }
            });
        }
        
        // Nút chat mới
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.clearChat();
                
                // Hiển thị welcome banner
                const welcomeBanner = document.getElementById('welcome-banner');
                if (welcomeBanner) {
                    welcomeBanner.style.display = 'flex';
                }
                
                // Đóng sidebar trên mobile
                if (window.innerWidth <= 992) {
                    this.toggleSidebar();
                }
                
                // Focus vào input
                if (userInput) {
                    userInput.focus();
                }
            });
        }
        
        // Toggle sidebar
        const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
        const closeSidebarBtn = document.getElementById('close-sidebar-btn');
        
        if (toggleSidebarBtn) {
            toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Toggle info panel
        const infoButtons = document.querySelectorAll('[data-toggle="info-panel"]');
        infoButtons.forEach(btn => {
            btn.addEventListener('click', () => this.toggleInfoPanel());
        });
        
        // Đóng info panel
        const closeInfoBtn = document.querySelector('.close-info-btn');
        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', () => this.closeInfoPanel());
        }
        
        // Xử lý category buttons (suggestion chips)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn') || 
                e.target.parentElement.classList.contains('category-btn')) {
                const button = e.target.closest('.category-btn');
                if (button) {
                    this._handleCategoryClick(button);
                }
            }
        });
        
        // Xử lý feedback buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('feedback-btn') || 
                e.target.parentElement.classList.contains('feedback-btn')) {
                const button = e.target.closest('.feedback-btn');
                if (button) {
                    this._handleFeedbackClick(button);
                }
            }
        });
        
        // Xử lý toggle chi tiết phân tích
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('details-toggle')) {
                this._toggleAnalysisDetails(e.target);
            }
        });
        
        // Xử lý overlay
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeInfoPanel());
        }
        
        // Xử lý resize cửa sổ
        window.addEventListener('resize', this._handleResize.bind(this));
    }

    /**
     * Thiết lập tabs
     * @private
     */
    _setupTabs() {
        const tabButtons = document.querySelectorAll('.info-tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchInfoTab(tabName);
            });
        });
    }

    /**
     * Chuyển đổi tab trong info panel
     * @param {string} tabName - Tên tab cần chuyển đến
     */
    switchInfoTab(tabName) {
        // Cập nhật trạng thái nút tab
        const tabButtons = document.querySelectorAll('.info-tab-button');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetButton = document.querySelector(`.info-tab-button[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Cập nhật nội dung tab
        const tabContents = document.querySelectorAll('.info-tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`${tabName}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Di chuyển lịch sử phân tích về đúng tab
        if (tabName === 'account') {
            // Xóa history container nếu vô tình được thêm vào tab account
            const historyInAccountTab = document.querySelector('#account-tab .analysis-history-container');
            if (historyInAccountTab) {
                historyInAccountTab.remove();
            }
            
            // Đảm bảo analysis-history nằm trong history-tab
            const analysisHistory = document.getElementById('analysis-history');
            const historyTab = document.getElementById('history-tab');
            
            if (analysisHistory && historyTab && analysisHistory.parentElement !== historyTab) {
                const existingHistory = historyTab.querySelector('#analysis-history');
                if (!existingHistory) {
                    historyTab.appendChild(analysisHistory);
                }
            }
        }
        
        // Tải lịch sử nếu chuyển đến tab history và đã xác thực
        if (tabName === 'history' && this._isAuthenticated()) {
            this.state.historyPagination.currentPage = 1;
            this.loadAnalysisHistory(1, false);
        }
    }
    
    /**
     * Kiểm tra xác thực
     * @returns {boolean} Đã xác thực hay chưa
     * @private
     */
    _isAuthenticated() {
        // Kiểm tra token trong localStorage
        return !!localStorage.getItem('phone_analysis_token');
    }

    /**
     * Xử lý việc gửi tin nhắn
     */
    handleSendMessage() {
        const userInput = document.getElementById('user-input');
        if (!userInput) return;
        
        const text = userInput.value.trim();
        if (!text) return;
        
        // Thêm tin nhắn người dùng
        const messageId = this.addUserMessage(text);
        
        if (messageId === null) {
            console.error('Failed to add user message - skipping processing');
            return;
        }
        
        // Xóa nội dung input
        userInput.value = '';
        this._resizeTextarea(userInput);
        
        // Gửi sự kiện để xử lý tin nhắn
        const messageSentEvent = new CustomEvent('messageSent', {
            detail: { text }
        });
        document.dispatchEvent(messageSentEvent);
    }

    /**
     * Thêm tin nhắn người dùng vào chat
     * @param {string} text - Nội dung tin nhắn
     * @returns {string|null} ID tin nhắn
     */
    addUserMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        const userMessageTemplate = document.getElementById('user-message-template');
        
        if (!chatMessages || !userMessageTemplate) {
            console.error('Cannot add user message - missing DOM elements');
            return null;
        }

        try {
            const messageId = `msg_user_${Date.now()}`;
            const messageElement = userMessageTemplate.content.cloneNode(true);
            const messageDiv = messageElement.querySelector('.message');
            
            if (!messageDiv) {
                console.error('Cannot add user message - template structure issue');
                // src/controllers/UIController.js (tiếp tục)

                return null;
            }
            
            messageDiv.id = messageId;
            
            const messageContentDiv = messageDiv.querySelector('.message-content');
            if (messageContentDiv) {
                // Định dạng văn bản để dễ đọc hơn
                const formattedText = this._formatBotMessage(text);
                messageContentDiv.innerHTML = formattedText;
            }
            
            chatMessages.appendChild(messageElement);
            this.scrollToBottom();
            
            // Ẩn welcome banner nếu đang hiển thị
            const welcomeBanner = document.getElementById('welcome-banner');
            if (welcomeBanner) {
                welcomeBanner.style.display = 'none';
            }
            
            return messageId;
        } catch (error) {
            console.error('Error adding user message:', error);
            return null;
        }
    }

    /**
     * Thêm tin nhắn bot vào chat
     * @param {string} text - Nội dung tin nhắn
     * @param {Object} analysisData - Dữ liệu phân tích (nếu có)
     * @returns {string|null} ID tin nhắn
     */
    addBotMessage(text, analysisData = null) {
        const chatMessages = document.getElementById('chat-messages');
        const botMessageTemplate = document.getElementById('bot-message-template');
        
        if (!chatMessages || !botMessageTemplate) {
            console.error('Cannot add bot message - missing DOM elements');
            return null;
        }

        try {
            const messageId = `msg_bot_${Date.now()}`;
            const messageElement = botMessageTemplate.content.cloneNode(true);
            const messageDiv = messageElement.querySelector('.message');
            
            if (!messageDiv) {
                console.error('Cannot add bot message - template structure issue');
                return null;
            }
            
            messageDiv.id = messageId;
            
            const messageContentDiv = messageDiv.querySelector('.message-content');
            if (messageContentDiv) {
                const formattedText = this._formatBotMessage(text);
                messageContentDiv.innerHTML = formattedText;
            }
            
            // Thêm nút phản hồi
            const feedbackButtons = messageDiv.querySelector('.feedback-buttons');
            if (feedbackButtons) {
                feedbackButtons.classList.remove('hidden');
            }
            
            if (analysisData) {
                // Lấy dữ liệu phân tích (sử dụng result nếu có)
                const data = analysisData.result || analysisData;
                
                // Hiển thị các câu hỏi mẫu
                const suggestionTextElem = messageDiv.querySelector('.suggestion-text');
                const questionContainer = messageDiv.querySelector('.question-examples');
                
                // Hiển thị các phần tử gợi ý
                if (suggestionTextElem) suggestionTextElem.classList.remove('hidden');
                if (questionContainer) questionContainer.classList.remove('hidden');
                
                // Tạo danh sách câu hỏi mẫu
                const questionExamples = [
                    "Số này ảnh hưởng thế nào đến sự nghiệp của tôi?",
                    "Mối quan hệ với người khác có tốt không?", 
                    "Số này có phải là số may mắn không?",
                    "Tôi có nên giữ số điện thoại này không?",
                    "Cặp sao cuối thể hiện gì?",
                    "Số nào ảnh hưởng nhiều nhất đến tình duyên?"
                ];
                
                // Thêm câu hỏi động
                if (data.balance === 'HUNG_HEAVY') {
                    questionExamples.push("Làm thế nào để hóa giải sao hung?");
                }
                
                // Xóa nội dung cũ và thêm các nút câu hỏi mẫu
                if (questionContainer) {
                    questionContainer.innerHTML = '';
                    
                    questionExamples.forEach(q => {
                        const exampleBtn = document.createElement('button');
                        exampleBtn.className = 'example-question-btn';
                        exampleBtn.textContent = q;
                        exampleBtn.addEventListener('click', () => {
                            const userInput = document.getElementById('user-input');
                            if (userInput) {
                                userInput.value = q;
                                userInput.focus();
                            }
                        });
                        questionContainer.appendChild(exampleBtn);
                    });
                }
                
                // Hiển thị các nút gợi ý chính
                const suggestionChips = messageDiv.querySelector('.suggestion-chips');
                if (suggestionChips) {
                    suggestionChips.classList.remove('hidden');
                }
                
                // Thêm các nút nhấn nhanh động
                const quickButtonsContainer = document.createElement('div');
                quickButtonsContainer.className = 'quick-buttons';
                
                // Tạo mảng các nút
                const buttonData = [
                    { text: 'Sự nghiệp', icon: 'fa-briefcase', question: 'Số điện thoại này ảnh hưởng thế nào đến sự nghiệp?' },
                    { text: 'Tài lộc', icon: 'fa-coins', question: 'Số điện thoại này có ý nghĩa gì về tài chính?' },
                    { text: 'Tình duyên', icon: 'fa-heart', question: 'Số điện thoại này nói gì về tình duyên của tôi?' },
                    { text: 'Sức khỏe', icon: 'fa-heartbeat', question: 'Số điện thoại này ảnh hưởng thế nào đến sức khỏe?' }
                ];
                
                // Thêm nút theo cân bằng
                if (data.balance === 'CAT_HEAVY') {
                    buttonData.push({
                        text: 'Điểm mạnh',
                        icon: 'fa-star',
                        question: 'Điểm mạnh nổi bật của số điện thoại này là gì?'
                    });
                } else if (data.balance === 'HUNG_HEAVY') {
                    buttonData.push({
                        text: 'Điểm cần lưu ý',
                        icon: 'fa-exclamation-circle',
                        question: 'Những điểm cần lưu ý của số điện thoại này là gì?'
                    });
                }
                
                // Thêm nút "nên giữ số này"
                buttonData.push({
                    text: 'Nên giữ số này?',
                    icon: 'fa-question-circle',
                    question: 'Tôi có nên giữ số điện thoại này không?'
                });
                
                // Tạo các nút từ dữ liệu
                buttonData.forEach(button => {
                    const buttonElement = document.createElement('button');
                    buttonElement.className = 'quick-btn';
                    buttonElement.innerHTML = `<i class="fas ${button.icon}"></i> ${button.text}`;
                    
                    // Sự kiện click
                    buttonElement.addEventListener('click', () => {
                        // Thêm tin nhắn người dùng
                        this.addUserMessage(button.question);
                        
                        // Phát sự kiện messageSent
                        const messageSentEvent = new CustomEvent('messageSent', {
                            detail: { text: button.question }
                        });
                        document.dispatchEvent(messageSentEvent);
                    });
                    
                    quickButtonsContainer.appendChild(buttonElement);
                });
                
                // Thêm container vào tin nhắn
                messageDiv.appendChild(quickButtonsContainer);
                
                // Lưu phân tích hiện tại
                this.state.currentAnalysis = analysisData;
                
                // Hiển thị phân tích
                this._addAnalysisToMessage(messageDiv, analysisData);
                
                // Cải thiện hiển thị
                setTimeout(() => {
                    this._enhanceAnalysisDisplay(analysisData);
                    this._enhanceSuggestions();
                }, 100);
            }
            
            chatMessages.appendChild(messageElement);
            this.scrollToBottom();
            
            // Ẩn welcome banner nếu đang hiển thị
            const welcomeBanner = document.getElementById('welcome-banner');
            if (welcomeBanner) {
                welcomeBanner.style.display = 'none';
            }
            
            return messageId;
        } catch (error) {
            console.error('Error adding bot message:', error);
            return null;
        }
    }

    /**
     * Thêm phân tích vào tin nhắn
     * @param {HTMLElement} messageElement - Phần tử tin nhắn
     * @param {Object} analysisData - Dữ liệu phân tích
     * @private
     */
    _addAnalysisToMessage(messageElement, analysisData) {
        if (!messageElement || !analysisData) return;
        
        // Tìm phần tử phân tích hiện có và xóa
        const existingAnalysis = messageElement.querySelector('.analysis-container');
        if (existingAnalysis) {
            existingAnalysis.remove();
        }
        
        // Tạo phần tử phân tích mới
        const analysisContainer = this._createAnalysisElement(analysisData);
        if (!analysisContainer) return;
        
        // Thêm vào sau message-content
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent) {
            messageContent.insertAdjacentElement('afterend', analysisContainer);
        } else {
            messageElement.appendChild(analysisContainer);
        }
    }

    /**
     * Tạo phần tử hiển thị phân tích
     * @param {Object} analysisData - Dữ liệu phân tích
     * @returns {HTMLElement} Phần tử phân tích
     * @private
     */
    _createAnalysisElement(analysisData) {
        // Chuẩn hóa dữ liệu
        analysisData = this._normalizeAnalysisData(analysisData);
        
        // Tạo phần tử từ template
        const template = document.getElementById('analysis-container-template');
        if (!template) {
            console.error('Template phân tích không tìm thấy');
            return null;
        }
        
        const analysisElement = template.content.cloneNode(true);
        const container = analysisElement.querySelector('.analysis-container');
        
        // Điền số điện thoại
        container.querySelector('.phone-number').textContent = this.formatPhoneNumber(analysisData.phoneNumber);
        
        // Render các sao chủ đạo
        this._renderStars(container, analysisData.starSequence);
        
        // Render tổ hợp sao
        this._renderStarCombinations(container, analysisData.starCombinations);
        
        // Render cân bằng năng lượng
        this._renderEnergyBalance(container, analysisData);
        
        // Thiết lập sự kiện cho nút toggle chi tiết
        const toggleBtn = container.querySelector('.details-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', this._toggleAnalysisDetails.bind(this, toggleBtn));
        }
        
        // Thêm lớp CSS để hiển thị animation
        container.classList.add('highlight-new');
        
        // Xóa lớp CSS sau 2 giây
        setTimeout(() => {
            container.classList.remove('highlight-new');
        }, 2000);
        
        return container;
    }

    /**
     * Chuẩn hóa dữ liệu phân tích
     * @param {Object} data - Dữ liệu phân tích
     * @returns {Object} Dữ liệu đã chuẩn hóa
     * @private
     */
    _normalizeAnalysisData(data) {
        // Tạo bản sao để không ảnh hưởng đến dữ liệu gốc
        const normalized = { ...data };
        
        // 1. Đảm bảo có phoneNumber
        if (!normalized.phoneNumber && data.result && data.result.phoneNumber) {
            normalized.phoneNumber = data.result.phoneNumber;
        }
        
        // 2. Đảm bảo có các thuộc tính quan trọng
        if (data.result) {
            // Lấy dữ liệu từ result nếu không có trực tiếp
            if (!normalized.balance && data.result.balance) {
                normalized.balance = data.result.balance;
            }
            
            if (!normalized.energyLevel && data.result.energyLevel) {
                normalized.energyLevel = data.result.energyLevel;
            }
            
            if (!normalized.starSequence && data.result.starSequence) {
                normalized.starSequence = data.result.starSequence;
            }
            
            if (!normalized.starCombinations && data.result.starCombinations) {
                normalized.starCombinations = data.result.starCombinations;
            }
            
            if (!normalized.keyCombinations && data.result.keyCombinations) {
                normalized.keyCombinations = data.result.keyCombinations;
            }
            
            if (!normalized.dangerousCombinations && data.result.dangerousCombinations) {
                normalized.dangerousCombinations = data.result.dangerousCombinations;
            }
        }
        
        // 3. Đảm bảo các mảng không undefined
        if (!normalized.starSequence) normalized.starSequence = [];
        if (!normalized.starCombinations) normalized.starCombinations = [];
        if (!normalized.keyCombinations) normalized.keyCombinations = [];
        if (!normalized.dangerousCombinations) normalized.dangerousCombinations = [];
        
        return normalized;
    }

    /**
     * Hiển thị các sao
     * @param {HTMLElement} container - Container phân tích
     * @param {Array} stars - Mảng các sao
     * @private
     */
    _renderStars(container, stars) {
        if (!stars || !stars.length) return;
        
        const starList = container.querySelector('.star-list');
        if (!starList) return;
        
        // Xóa nội dung cũ
        starList.innerHTML = '';
        
        // Sắp xếp sao theo năng lượng
        const sortedStars = [...stars].sort((a, b) => b.energyLevel - a.energyLevel);
        
        // Hiển thị tối đa 3 sao
        const displayStars = sortedStars.slice(0, 3);
        
        displayStars.forEach(star => {
            const starItem = document.createElement('div');
            starItem.className = `star-item ${star.nature === 'Cát' ? 'cat' : star.nature === 'Hung' ? 'hung' : ''}`;
            
            // Xác định màu cho energy dots dựa trên nature
            const dotType = star.nature === 'Cát' ? 'cat' : 
                          (star.nature === 'Hung' ? 'hung' : 
                          (star.nature === 'Cát hóa hung' ? 'cat-hung' : 'neutral'));
            
            // Tạo HTML cho dots hiển thị năng lượng
            let energyDotsHTML = '';
            for (let i = 0; i < 4; i++) {
                energyDotsHTML += `<div class="energy-dot ${dotType} ${i < star.energyLevel ? 'active' : ''}"></div>`;
            }
            
            // Nội dung star item
            starItem.innerHTML = `
                <div class="star-header">
                    <div class="star-name">${star.name}</div>
                    <div class="star-pair">${star.originalPair}</div>
                </div>
                <div class="star-energy">
                    <div class="energy-label">Năng lượng:</div>
                    <div class="energy-indicator">
                        ${energyDotsHTML}
                    </div>
                </div>
            `;
            
            // Thêm vào danh sách
            starList.appendChild(starItem);
        });
    }

    /**
     * Hiển thị tổ hợp sao
     * @param {HTMLElement} container - Container phân tích
     * @param {Array} starCombinations - Mảng tổ hợp sao
     * @private
     */
    _renderStarCombinations(container, starCombinations) {
        if (!starCombinations || !starCombinations.length) return;
        
        const starCombosContainer = container.querySelector('.star-combinations-list');
        if (!starCombosContainer) return;
        
        // Xóa nội dung cũ
        starCombosContainer.innerHTML = '';
        
        // Hiển thị tối đa 2 tổ hợp
        const displayCombos = starCombinations.slice(0, 2);
        
        // Thêm từng tổ hợp sao
        displayCombos.forEach(combo => {
            const comboItem = document.createElement('div');
            comboItem.className = 'star-combo-item';
            
            const firstStarNature = combo.firstStar && combo.firstStar.nature === 'Cát' ? 'auspicious' : 
                                 (combo.firstStar && combo.firstStar.nature === 'Hung' ? 'inauspicious' : '');
                                 
            const secondStarNature = combo.secondStar && combo.secondStar.nature === 'Cát' ? 'auspicious' : 
                                  (combo.secondStar && combo.secondStar.nature === 'Hung' ? 'inauspicious' : '');
            
            // Tính tổng năng lượng
            const firstStarEnergy = combo.firstStar ? combo.firstStar.energyLevel || 0 : 0;
            const secondStarEnergy = combo.secondStar ? combo.secondStar.energyLevel || 0 : 0;
            const totalEnergy = combo.totalEnergy || (firstStarEnergy + secondStarEnergy);
            
            // Xác định màu dựa vào tính chất của tổ hợp
            const isPositive = combo.isPositive || 
                             (combo.firstStar && combo.secondStar && 
                              combo.firstStar.nature === 'Cát' && 
                              combo.secondStar.nature === 'Cát');
                              
            const isNegative = combo.isNegative || 
                             (combo.firstStar && combo.secondStar && 
                              combo.firstStar.nature === 'Hung' && 
                              combo.secondStar.nature === 'Hung');
                              
            const dotType = isPositive ? 'cat' : (isNegative ? 'hung' : 'mixed');
            
            // Tạo HTML cho dots hiển thị năng lượng
            let energyDotsHTML = '';
            const maxDots = 8; // Max là 8 dots
            const energyLevel = Math.min(totalEnergy, maxDots);
            
            for (let i = 0; i < maxDots; i++) {
                energyDotsHTML += `<div class="energy-dot ${dotType} ${i < energyLevel ? 'active' : ''}"></div>`;
            }
            
            // HTML cho tổ hợp
            comboItem.innerHTML = `
                <div class="star-combo-header">
                    <span class="star-name ${firstStarNature}">${combo.firstStar ? combo.firstStar.name : ''}</span>
                    <span class="combo-plus">+</span>
                    <span class="star-name ${secondStarNature}">${combo.secondStar ? combo.secondStar.name : ''}</span>
                </div>
                <div class="star-combo-energy">
                    <div class="energy-label">Tổng năng lượng: ${totalEnergy}</div>
                    <div class="energy-indicator">
                        ${energyDotsHTML}
                    </div>
                </div>
                <div class="star-combo-desc">${combo.description || ''}</div>
            `;
            
            // Thêm vào container
            starCombosContainer.appendChild(comboItem);
        });
    }

    /**
     * Hiển thị cân bằng năng lượng
     * @param {HTMLElement} container - Container phân tích
     * @param {Object} analysisData - Dữ liệu phân tích
     * @private
     */
    _renderEnergyBalance(container, analysisData) {
        if (!analysisData || !analysisData.energyLevel) return;
        
        const energyBalance = container.querySelector('.energy-balance');
        if (!energyBalance) return;
        
        // Xóa nội dung cũ
        energyBalance.innerHTML = '';
        
        // Tạo text hiển thị cân bằng
        const balanceText = document.createElement('div');
        
        // Kiểm tra và sử dụng giá trị balance
        if (analysisData.balance) {
            switch(analysisData.balance) {
                case 'BALANCED':
                    balanceText.textContent = 'Cân bằng tốt giữa sao cát và hung';
                    balanceText.className = 'balance-text balanced';
                    break;
                case 'CAT_HEAVY':
                    balanceText.textContent = 'Thiên về sao cát (>70%)';
                    balanceText.className = 'balance-text cat-heavy';
                    break;
                case 'HUNG_HEAVY':
                    balanceText.textContent = 'Thiên về sao hung (>70%)';
                    balanceText.className = 'balance-text hung-heavy';
                    break;
                default:
                    balanceText.textContent = 'Cân bằng không xác định';
                    balanceText.className = 'balance-text unknown';
            }
        } else {
            balanceText.textContent = 'Cân bằng không xác định';
            balanceText.className = 'balance-text unknown';
        }
        
        energyBalance.appendChild(balanceText);
        
        // Thêm mức năng lượng
        const totalEnergy = analysisData.energyLevel.total || 0;
        const catEnergy = analysisData.energyLevel.cat || 0;
        const hungEnergy = Math.abs(analysisData.energyLevel.hung || 0);
        
        // HTML cho energy levels
        const energyLevelsHtml = `
            <div class="energy-levels">
                <div class="energy-item">
                    <span class="energy-label">Tổng:</span>
                    <span class="energy-value">${totalEnergy}</span>
                </div>
                <div class="energy-item">
                    <span class="energy-label">Cát:</span>
                    <span class="energy-value positive">${catEnergy}</span>
                </div>
                <div class="energy-item">
                    <span class="energy-label">Hung:</span>
                    <span class="energy-value negative">${hungEnergy}</span>
                </div>
                ${analysisData.energyLevel.ratio ? `
                <div class="energy-item">
                    <span class="energy-label">Tỷ lệ:</span>
                    <span class="energy-value">${analysisData.energyLevel.ratio.toFixed(2)}</span>
                </div>` : ''}
            </div>
        `;
        
        energyBalance.innerHTML += energyLevelsHtml;
    }

    /**
     * Định dạng tin nhắn bot
     * @param {string} text - Nội dung tin nhắn
     * @returns {string} Nội dung đã định dạng
     * @private
     */
    _formatBotMessage(text) {
        if (!text) return '';
        
        // Thay thế định dạng đậm **text** bằng thẻ <strong>
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Thêm class cho các đoạn có chứa tiêu đề in đậm
        formattedText = formattedText.replace(/(<strong>.*?<\/strong>)/g, '<span class="section-title">$1</span>');
        
        // Chia thành các đoạn và thêm class
        let paragraphs = formattedText.split('\n\n');
        
        // Xử lý từng đoạn
        paragraphs = paragraphs.map((paragraph, index) => {
            if (!paragraph.trim()) return '';
            
            // Kiểm tra nếu đoạn bắt đầu bằng tiêu đề
            if (paragraph.includes('<span class="section-title">')) {
                return `<p class="section-paragraph">${paragraph}</p>`;
            }
            
            return `<p>${paragraph}</p>`;
        });
        
        formattedText = paragraphs.join('');
        
        // Xử lý danh sách nếu có
        formattedText = formattedText.replace(/<p>- (.*?)<\/p>/g, '<li>$1</li>');
        formattedText = formattedText.replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
        formattedText = formattedText.replace(/<\/ul><ul>/g, '');
        
        return formattedText;
    }

    /**
     * Hiển thị trạng thái đang nhập
     */
    showTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
        }
    }

    /**
     * Ẩn trạng thái đang nhập
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    }

    /**
     * Cuộn xuống dưới cùng của chat
     */
    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    /**
     * Xóa nội dung chat
     */
    clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            
            // Thêm tin nhắn chào mừng
            this.addBotMessage('Xin chào! Tôi là trợ lý phân tích số điện thoại theo phương pháp Tứ Cát Tứ Hung. Bạn có thể nhập số điện thoại để tôi phân tích hoặc đặt câu hỏi về ý nghĩa các con số.');
        } 
        
        // Reset current analysis
        this.state.currentAnalysis = null;
        
        // Phát sự kiện clearChat
        const clearChatEvent = new CustomEvent('clearChat');
        document.dispatchEvent(clearChatEvent);
    }

    /**
     * Tải lịch sử phân tích
     * @param {number} page - Số trang
     * @param {boolean} append - Có thêm vào lịch sử hiện tại không
     * @returns {Promise} Kết quả tải lịch sử
     */
    async loadAnalysisHistory(page = 1, append = false) {
        try {
            // Kiểm tra xác thực
            if (!this._isAuthenticated()) {
                console.warn('Not loading history - user not authenticated');
                return;
            }

            const historyContainer = document.getElementById('analysis-history');
            
            // Hiển thị thông báo đang tải
            if (historyContainer && !append) {
                historyContainer.innerHTML = '<div class="empty-history-message">Đang tải lịch sử...</div>';
            }
            
            // Hiển thị trạng thái loading cho nút Load More
            if (append) {
                const loadMoreBtn = document.getElementById('load-more-history');
                if (loadMoreBtn) {
                    loadMoreBtn.textContent = 'Đang tải...';
                    loadMoreBtn.disabled = true;
                }
            }

            // Xác định số mục cần tải
            const limit = this.state.historyPagination.limit;
            
            // Gọi API với tham số phân trang
            const historyResponse = await this.apiService.getAnalysisHistory(limit, page);
            
            // Cập nhật thông tin phân trang
            if (historyResponse.success && historyResponse.pagination) {
                this.state.historyPagination = {
                    currentPage: page,
                    totalPages: historyResponse.pagination.pages || 1,
                    limit: historyResponse.pagination.limit || 20,
                    total: historyResponse.pagination.total || 0
                };
            }
            
            // Xử lý dữ liệu
            if (historyResponse.success && historyResponse.data && historyResponse.data.length > 0) {
                if (append) {
                    // Nếu append, thêm vào danh sách hiện tại
                    this.state.analysisHistory = [...this.state.analysisHistory, ...historyResponse.data];
                } else {
                    // Nếu không, thay thế hoàn toàn
                    this.state.analysisHistory = historyResponse.data;
                }
                
                // Render lịch sử
                this._renderAnalysisHistory(append);
            } else if (!append) {
                // Nếu không có dữ liệu và không phải append
                if (historyContainer) {
                    historyContainer.innerHTML = '<div class="empty-history-message">Chưa có lịch sử phân tích.</div>';
                }
                // src/controllers/UIController.js (tiếp tục)

            }
            
            // Reset trạng thái nút Load More
            const loadMoreBtn = document.getElementById('load-more-history');
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Tải thêm';
                loadMoreBtn.disabled = false;
                
                // Ẩn nút nếu đã tải hết
                if (this.state.historyPagination.currentPage >= this.state.historyPagination.totalPages) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
            }
            
        } catch (error) {
            console.error('Error loading history:', error);
            
            const historyContainer = document.getElementById('analysis-history');
            if (historyContainer && !append) {
                historyContainer.innerHTML = '<div class="empty-history-message">Không thể tải lịch sử. Vui lòng thử lại sau.</div>';
            }
            
            // Reset trạng thái nút Load More khi lỗi
            const loadMoreBtn = document.getElementById('load-more-history');
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Tải thêm';
                loadMoreBtn.disabled = false;
            }
        }
    }

    /**
     * Render lịch sử phân tích
     * @param {boolean} append - Có thêm vào hiện tại không
     * @private
     */
    _renderAnalysisHistory(append = false) {
        const historyContainer = document.getElementById('analysis-history');
        if (!historyContainer) return;
        
        // Nếu không phải append, xóa nội dung cũ
        if (!append) {
            historyContainer.innerHTML = '';
        } else {
            // Nếu append, xóa nút Load More cũ
            const oldLoadMoreBtn = document.getElementById('load-more-history');
            if (oldLoadMoreBtn) {
                oldLoadMoreBtn.remove();
            }
        }
        
        // Kiểm tra lịch sử trống
        if (!this.state.analysisHistory || this.state.analysisHistory.length === 0) {
            historyContainer.innerHTML = '<div class="empty-history-message">Chưa có lịch sử phân tích.</div>';
            return;
        }
        
        // Lấy các mục cần hiển thị
        const displayHistory = append ? this.state.analysisHistory : 
            [...this.state.analysisHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (!append) {
            // Cập nhật state nếu không phải append
            this.state.analysisHistory = displayHistory;
        }
        
        // Hiển thị các mục lịch sử
        const startIndex = append ? displayHistory.length - this.state.historyPagination.limit : 0;
        const itemsToDisplay = append ? displayHistory.slice(startIndex) : displayHistory;
        
        itemsToDisplay.forEach(analysis => {
            const historyTemplate = document.getElementById('history-item-template');
            if (!historyTemplate) return;
            
            const historyElement = historyTemplate.content.cloneNode(true);
            const historyItem = historyElement.querySelector('.history-item');
            
            // Format phone number
            historyItem.querySelector('.history-phone').textContent = this.formatPhoneNumber(analysis.phoneNumber);
            
            // Format date
            const date = new Date(analysis.createdAt);
            
            const timeContainer = historyItem.querySelector('.history-time');
            timeContainer.innerHTML = '';
            
            // Hiển thị thời gian
            const timeSpan = document.createElement('span');
            timeSpan.textContent = this._formatDate(date);
            timeContainer.appendChild(timeSpan);
            
            // Hiển thị thông tin cân bằng nếu có
            if (analysis.result && analysis.result.balance) {
                const balanceSpan = document.createElement('span');
                balanceSpan.className = 'history-balance';
                
                switch(analysis.result.balance) {
                    case 'BALANCED':
                        balanceSpan.classList.add('balanced');
                        balanceSpan.innerHTML = '<i class="fas fa-balance-scale"></i> Cân bằng';
                        break;
                    case 'CAT_HEAVY':
                        balanceSpan.classList.add('cat-heavy');
                        balanceSpan.innerHTML = '<i class="fas fa-sun"></i> Thiên cát';
                        break;
                    case 'HUNG_HEAVY':
                        balanceSpan.classList.add('hung-heavy');
                        balanceSpan.innerHTML = '<i class="fas fa-cloud"></i> Thiên hung';
                        break;
                }
                
                timeContainer.appendChild(balanceSpan);
            }
            
            // Thêm thông tin về năng lượng
            if (analysis.result && analysis.result.energyLevel) {
                const metaDiv = document.createElement('div');
                metaDiv.className = 'history-meta';
                
                // Stars info
                if (analysis.result.starSequence && analysis.result.starSequence.length > 0) {
                    const starCount = analysis.result.starSequence.length;
                    metaDiv.innerHTML += `<span><i class="fas fa-star"></i> ${starCount} sao</span>`;
                }
                
                // Energy rating
                const ratingDiv = document.createElement('div');
                ratingDiv.className = 'rating';
                
                const catDiv = document.createElement('span');
                catDiv.className = 'cat-rating';
                catDiv.innerHTML = `<i class="fas fa-plus-circle"></i> ${analysis.result.energyLevel.cat || 0}`;
                
                const hungDiv = document.createElement('span');
                hungDiv.className = 'hung-rating';
                hungDiv.innerHTML = `<i class="fas fa-minus-circle"></i> ${Math.abs(analysis.result.energyLevel.hung || 0)}`;
                
                ratingDiv.appendChild(catDiv);
                ratingDiv.appendChild(hungDiv);
                metaDiv.appendChild(ratingDiv);
                
                historyItem.appendChild(metaDiv);
            }
            
            // Add click handler
            historyItem.addEventListener('click', () => {
                // Phát sự kiện historyItemClicked
                const historyItemClickedEvent = new CustomEvent('historyItemClicked', {
                    detail: { phoneNumber: analysis.phoneNumber }
                });
                document.dispatchEvent(historyItemClickedEvent);
                
                // Thêm tin nhắn vào chat
                this.addUserMessage(analysis.phoneNumber);
                
                if (window.innerWidth <= 992) {
                    this.closeInfoPanel();
                }
            });
            
            historyContainer.appendChild(historyElement);
        });
        
        // Thêm nút Load More nếu còn trang để tải
        if (this.state.historyPagination.currentPage < this.state.historyPagination.totalPages) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'load-more-history';
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.textContent = 'Tải thêm';
            loadMoreBtn.addEventListener('click', () => {
                this.loadAnalysisHistory(this.state.historyPagination.currentPage + 1, true);
            });
            
            historyContainer.appendChild(loadMoreBtn);
        }
    }

    /**
     * Xóa lịch sử phân tích
     */
    async clearAnalysisHistory() {
        try {
            await this.apiService.deleteAnalysisHistory();
            
            // Clear history display
            const historyContainer = document.getElementById('analysis-history');
            if (historyContainer) {
                historyContainer.innerHTML = '<div class="empty-history-message">Chưa có lịch sử phân tích.</div>';
            }
            
            // Clear state
            this.state.analysisHistory = [];
            
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('Không thể xóa lịch sử. Vui lòng thử lại sau.');
        }
    }

    /**
     * Định dạng ngày tháng hiển thị
     * @param {Date} date - Ngày cần định dạng
     * @returns {string} Chuỗi đã định dạng
     * @private
     */
    _formatDate(date) {
        if (!date) return '';
        
        // Get today and yesterday for comparison
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format time
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;
        
        // Format date
        if (date.toDateString() === today.toDateString()) {
            return `Hôm nay, ${time}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Hôm qua, ${time}`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }

    /**
     * Điều chỉnh kích thước textarea
     * @param {HTMLElement} textarea - Phần tử textarea
     * @private
     */
    _resizeTextarea(textarea) {
        // Reset chiều cao
        textarea.style.height = 'auto';
        
        // Đặt chiều cao mới (giới hạn 200px)
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = newHeight + 'px';
    }

    /**
     * Xử lý khi cửa sổ thay đổi kích thước
     * @private
     */
    _handleResize() {
        // Close info panel on mobile when resizing to desktop
        if (window.innerWidth > 992) {
            this.closeInfoPanel();
        }
    }

    /**
     * Chuyển đổi hiển thị sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.querySelector('.mobile-overlay');
        
        if (sidebar) {
            sidebar.classList.toggle('active');
            
            if (mobileOverlay) {
                mobileOverlay.classList.toggle('active');
            }
            
            document.body.classList.toggle('sidebar-active');
        }
    }

    /**
     * Chuyển đổi hiển thị info panel
     */
    toggleInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        const overlay = document.getElementById('overlay');
        
        if (infoPanel && overlay) {
            this.state.isInfoPanelVisible = !this.state.isInfoPanelVisible;
            
            infoPanel.classList.toggle('visible', this.state.isInfoPanelVisible);
            overlay.classList.toggle('visible', this.state.isInfoPanelVisible);
        }
    }

    /**
     * Đóng info panel
     */
    closeInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        const overlay = document.getElementById('overlay');
        
        if (infoPanel && overlay) {
            this.state.isInfoPanelVisible = false;
            
            infoPanel.classList.remove('visible');
            overlay.classList.remove('visible');
        }
    }

    /**
     * Xử lý khi click vào category button
     * @param {HTMLElement} button - Button được click
     * @private
     */
    _handleCategoryClick(button) {
        const category = button.getAttribute('data-category');
        
        // Check if this button is already selected
        if (button.classList.contains('selected')) {
            return;
        }
        
        // Highlight the selected button
        const parentContainer = button.closest('.suggestion-chips');
        if (parentContainer) {
            const buttons = parentContainer.querySelectorAll('.category-btn');
            buttons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        }
        
        // Choose appropriate question based on category
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
        
        // Thêm tin nhắn và phát sự kiện
        this.addUserMessage(question);
        
        const messageSentEvent = new CustomEvent('messageSent', {
            detail: { text: question }
        });
        document.dispatchEvent(messageSentEvent);
    }

    /**
     * Xử lý khi click vào feedback button
     * @param {HTMLElement} button - Button được click
     * @private
     */
    _handleFeedbackClick(button) {
        // Get feedback type (positive/negative)
        const isPositive = button.classList.contains('positive');
        const feedbackType = isPositive ? 'positive' : 'negative';
        
        // Get message ID
        const messageContainer = button.closest('.message');
        const messageId = messageContainer ? messageContainer.id : null;
        
        if (!messageId) return;
        
        // Disable all buttons in the feedback group
        const feedbackContainer = button.closest('.feedback-buttons');
        if (feedbackContainer) {
            const buttons = feedbackContainer.querySelectorAll('.feedback-btn');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
            
            // Highlight the selected button
            button.classList.add('selected');
            
            // Add thank you message
            const thankYouMsg = document.createElement('div');
            thankYouMsg.className = 'feedback-thanks';
            thankYouMsg.textContent = 'Cảm ơn phản hồi của bạn!';
            feedbackContainer.appendChild(thankYouMsg);
        }
        
        // Submit feedback to the server
        if (this.state.currentAnalysis) {
            this.apiService.sendFeedback(this.state.currentAnalysis._id, feedbackType).catch(error => {
                console.error('Error sending feedback:', error);
            });
        }
        
        // If negative feedback, prompt for more details
        if (feedbackType === 'negative') {
            setTimeout(() => {
                this.addBotMessage('Bạn có thể cho biết điều gì chưa chính xác để tôi cải thiện không?');
            }, 500);
        }
    }

    /**
     * Chuyển đổi hiển thị chi tiết phân tích
     * @param {HTMLElement} button - Button toggle
     * @private
     */
    _toggleAnalysisDetails(button) {
        const isExpanded = button.getAttribute('data-expanded') === 'true';
        const analysisContainer = button.closest('.analysis-container');
        
        if (!analysisContainer) return;
        
        if (isExpanded) {
            // Hide details
            const detailedView = analysisContainer.querySelector('.detailed-view');
            if (detailedView) {
                detailedView.remove();
            }
            
            button.textContent = 'Xem chi tiết';
            button.setAttribute('data-expanded', 'false');
        } else {
            // Show details
            if (this.state.currentAnalysis) {
                const detailedView = this._createDetailedView(this.state.currentAnalysis);
                analysisContainer.appendChild(detailedView);
            }
            
            button.textContent = 'Ẩn chi tiết';
            button.setAttribute('data-expanded', 'true');
        }
    }

    /**
     * Tạo view chi tiết cho phân tích
     * @param {Object} analysisData - Dữ liệu phân tích
     * @returns {HTMLElement} Phần tử chi tiết
     * @private
     */
    _createDetailedView(analysisData) {
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'detailed-view';
        
        // Chuẩn hóa dữ liệu
        analysisData = this._normalizeAnalysisData(analysisData);
        
        // 1. Full Star Sequence
        const starsSection = document.createElement('div');
        starsSection.className = 'detail-section';
        starsSection.innerHTML = '<h4>Tất cả các sao</h4>';
        
        const starTable = document.createElement('table');
        starTable.className = 'star-table';
        starTable.innerHTML = `
            <thead>
                <tr>
                    <th>Cặp số</th>
                    <th>Tên sao</th>
                    <th>Tính chất</th>
                    <th>Năng lượng</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tableBody = starTable.querySelector('tbody');
        
        if (analysisData.starSequence && analysisData.starSequence.length > 0) {
            analysisData.starSequence.forEach(star => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${star.originalPair || ''}</td>
                    <td>${star.name || 'Không xác định'}</td>
                    <td class="${star.nature === 'Cát' ? 'auspicious' : (star.nature === 'Hung' ? 'inauspicious' : 'unknown')}">
                        ${star.nature || 'Không xác định'}
                    </td>
                    <td>${star.energyLevel || 0}</td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        starsSection.appendChild(starTable);
        detailsContainer.appendChild(starsSection);
        
        // 2. Key Combinations
        if (analysisData.keyCombinations && analysisData.keyCombinations.length > 0) {
            const combosSection = document.createElement('div');
            combosSection.className = 'detail-section';
            combosSection.innerHTML = '<h4>Tổ hợp số đặc biệt</h4>';
            
            const combosList = document.createElement('ul');
            combosList.className = 'combos-list';
            
            analysisData.keyCombinations.forEach(combo => {
                const item = document.createElement('li');
                item.className = 'combo-item';
                item.innerHTML = `
                    <div class="combo-value">${combo.value || ''}</div>
                    <div class="combo-desc">${combo.description || ''}</div>
                `;
                combosList.appendChild(item);
            });
            
            combosSection.appendChild(combosList);
            detailsContainer.appendChild(combosSection);
        }
        
        // 3. Warning Combinations
        if (analysisData.dangerousCombinations && analysisData.dangerousCombinations.length > 0) {
            const warningsSection = document.createElement('div');
            warningsSection.className = 'detail-section warnings';
            warningsSection.innerHTML = '<h4>Cảnh báo</h4>';
            
            const warningsList = document.createElement('ul');
            warningsList.className = 'warnings-list';
            
            analysisData.dangerousCombinations.forEach(warning => {
                const item = document.createElement('li');
                item.className = 'warning-item';
                item.innerHTML = `
                    <div class="warning-value">${warning.combination || ''}</div>
                    <div class="warning-desc">${warning.description || ''}</div>
                `;
                warningsList.appendChild(item);
            });
            
            warningsSection.appendChild(warningsList);
            detailsContainer.appendChild(warningsSection);
        }
        
        // 4. Key Positions
        if (analysisData.keyPositions) {
            const positionsSection = document.createElement('div');
            positionsSection.className = 'detail-section';
            positionsSection.innerHTML = '<h4>Vị trí quan trọng</h4>';
            
            const positionsList = document.createElement('ul');
            positionsList.className = 'positions-list';
            
            if (analysisData.keyPositions.lastDigit) {
                const item = document.createElement('li');
                item.innerHTML = `<strong>Số cuối (${analysisData.keyPositions.lastDigit.value}):</strong> ${analysisData.keyPositions.lastDigit.meaning || ''}`;
                positionsList.appendChild(item);
            }
            
            if (analysisData.keyPositions.thirdFromEnd) {
                const item = document.createElement('li');
                item.innerHTML = `<strong>Số thứ 3 từ cuối (${analysisData.keyPositions.thirdFromEnd.value}):</strong> ${analysisData.keyPositions.thirdFromEnd.meaning || ''}`;
                positionsList.appendChild(item);
            }
            
            if (analysisData.keyPositions.fifthFromEnd) {
                const item = document.createElement('li');
                item.innerHTML = `<strong>Số thứ 5 từ cuối (${analysisData.keyPositions.fifthFromEnd.value}):</strong> ${analysisData.keyPositions.fifthFromEnd.meaning || ''}`;
                positionsList.appendChild(item);
            }
            
            positionsSection.appendChild(positionsList);
            detailsContainer.appendChild(positionsSection);
        }
        
        return detailsContainer;
    }

    /**
     * Cải thiện hiển thị phân tích
     * @param {Object} analysisData - Dữ liệu phân tích
     * @private
     */
    _enhanceAnalysisDisplay(analysisData) {
        // Thêm hiệu ứng khi có kết quả phân tích mới
        const analysisContainers = document.querySelectorAll('.analysis-container');
        if (analysisContainers.length > 0) {
            const lastContainer = analysisContainers[analysisContainers.length - 1];
            lastContainer.classList.add('highlight-new');
            
            // Xóa hiệu ứng sau 2 giây
            setTimeout(() => {
                lastContainer.classList.remove('highlight-new');
            }, 2000);
        }
        
        // Thêm biểu đồ trực quan cho cân bằng năng lượng
        if (analysisData && analysisData.energyLevel) {
            this._addEnergyChart(analysisData.energyLevel);
        }
    }

    /**
     * Thêm biểu đồ năng lượng
     * @param {Object} energyLevel - Thông tin năng lượng
     * @private
     */
    _addEnergyChart(energyLevel) {
        const energyBalance = document.querySelector('.energy-balance');
        if (!energyBalance) return;
        
        // Tạo phần tử canvas cho biểu đồ
        const chartContainer = document.createElement('div');
        chartContainer.className = 'energy-chart-container';
        chartContainer.style.marginTop = '15px';
        chartContainer.style.height = '120px';
        
        // Thêm canvas vào container
        const canvas = document.createElement('canvas');
        canvas.id = 'energy-chart';
        canvas.height = 120;
        chartContainer.appendChild(canvas);
        
        // Thêm container vào energy balance
        energyBalance.appendChild(chartContainer);
        
        // Vẽ biểu đồ đơn giản bằng canvas
        const ctx = canvas.getContext('2d');
        const totalWidth = canvas.width;
        const height = 30;
        const y = 30;
        
        // Tính tỷ lệ
        const total = energyLevel.cat + Math.abs(energyLevel.hung);
        const catWidth = total > 0 ? (energyLevel.cat / total) * totalWidth : 0;
        
        // Vẽ thanh Cát (màu xanh)
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, y, catWidth, height);
        
        // Vẽ thanh Hung (màu đỏ)
        ctx.fillStyle = '#f44336';
        ctx.fillRect(catWidth, y, totalWidth - catWidth, height);
        
        // Thêm nhãn
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(`Cát: ${energyLevel.cat}`, 10, y - 5);
        ctx.fillText(`Hung: ${energyLevel.hung}`, totalWidth - 80, y - 5);
        
        // Thêm đường phân chia giữa
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(catWidth, y - 10);
        ctx.lineTo(catWidth, y + height + 10);
        ctx.stroke();
        
        // Thêm nhãn phần trăm
        const catPercent = total > 0 ? Math.round((energyLevel.cat / total) * 100) : 0;
        const hungPercent = 100 - catPercent;
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${catPercent}%`, catWidth / 2 - 15, y + height / 2 + 5);
        ctx.fillText(`${hungPercent}%`, catWidth + (totalWidth - catWidth) / 2 - 15, y + height / 2 + 5);
    }

    /**
     * Cải thiện hiển thị gợi ý
     * @private
     */
    _enhanceSuggestions() {
        const suggestionChips = document.querySelectorAll('.suggestion-chips');
        
        suggestionChips.forEach(container => {
            // Thêm gợi ý về cách sử dụng
            const helpText = document.createElement('div');
            helpText.className = 'suggestion-help';
            helpText.textContent = 'Nhấn vào các gợi ý dưới đây để xem thêm thông tin:';
            helpText.style.fontSize = '0.9rem';
            helpText.style.color = '#666';
            helpText.style.marginBottom = '8px';
            
            container.insertBefore(helpText, container.firstChild);
            
            // Thêm hiệu ứng nhấp nháy để thu hút sự chú ý
            const buttons = container.querySelectorAll('.category-btn');
            
            buttons.forEach((btn, index) => {
                setTimeout(() => {
                    btn.classList.add('pulse-animation');
                    
                    setTimeout(() => {
                        btn.classList.remove('pulse-animation');
                    }, 1000);
                }, index * 300);
            });
        });
    }

    /**
     * Cải thiện hiển thị chat
     * @private
     */
    _enhanceChatDisplay() {
        // Thêm hướng dẫn nhanh vào đầu chat
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && chatMessages.children.length === 0) {
            const guideElement = document.createElement('div');
            guideElement.className = 'quick-guide';
            guideElement.innerHTML = `
                <div class="guide-title">
                    <i class="fas fa-lightbulb"></i> Hướng dẫn nhanh
                </div>
                <div class="guide-content">
                    <p>Nhập số điện thoại (VD: 0931328218) và nhấn Enter để phân tích.</p>
                    <p>Bạn cũng có thể đặt các câu hỏi về ý nghĩa của số.</p>
                </div>
            `;
            
            chatMessages.appendChild(guideElement);
        }
    }

    /**
     * Định dạng số điện thoại hiển thị
     * @param {string} phoneNumber - Số điện thoại
     * @returns {string} Số điện thoại đã định dạng
     */
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';
        
        const cleaned = String(phoneNumber).replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
        } else if (cleaned.length === 11) {
            return cleaned.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
        }
        
        return cleaned;
    }

    /**
     * Thiết lập trạng thái loading
     * @param {boolean} isLoading - Đang loading hay không
     */
    setLoading(isLoading) {
        this.state.loading = isLoading;
        
        // Disable interactive elements during loading
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        
        buttons.forEach(button => {
            button.disabled = isLoading;
        });
        
        inputs.forEach(input => {
            input.disabled = isLoading;
        });
    }
}

export default UIController;
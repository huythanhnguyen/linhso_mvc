/**
 * Templates Module
 * Chứa các HTML templates cho ứng dụng
 */

const Templates = (function() {
    /**
     * Template cho tin nhắn người dùng
     * @param {Object} message - Đối tượng tin nhắn
     * @returns {string} HTML string
     */
    function userMessage(message) {
        return `
        <div class="message user-message" id="${message.id}">
            <div class="message-content">${message.content}</div>
        </div>
        `;
    }

    /**
     * Template cho tin nhắn bot
     * @param {Object} message - Đối tượng tin nhắn 
     * @returns {string} HTML string
     */
    function botMessage(message) {
        return `
        <div class="message bot-message" id="${message.id}">
            <div class="message-content">${message.content}</div>
            <div class="analysis-data hidden"></div>
            
            <div class="suggestion-text hidden">
                <p>Bạn có thể hỏi thêm về:</p>
            </div>
            <div class="question-examples hidden"></div>
            
            <div class="suggestion-chips hidden">
                <button class="category-btn" data-category="business">
                    <i class="fas fa-briefcase"></i> Kinh doanh
                </button>
                <button class="category-btn" data-category="love">
                    <i class="fas fa-heart"></i> Tình duyên
                </button>
                <button class="category-btn" data-category="wealth">
                    <i class="fas fa-coins"></i> Tài lộc
                </button>
                <button class="category-btn" data-category="health">
                    <i class="fas fa-heartbeat"></i> Sức khỏe
                </button>
            </div>
        </div>
        `;
    }

    /**
     * Template cho container phân tích
     * @param {Object} analysis - Dữ liệu phân tích
     * @returns {string} HTML string
     */
    function analysisContainer(analysis) {
        return `
        <div class="analysis-container">
            <div class="analysis-title">Phân tích số: <span class="phone-number">${analysis.phoneNumber}</span></div>
            <div class="analysis-content">
                <div class="analysis-section">
                    <h4>Các sao chủ đạo</h4>
                    <div class="star-list">
                        ${renderStarList(analysis)}
                    </div>
                </div>
                
                <div class="analysis-section star-combinations-section">
                    <h4>Tổ hợp sao</h4>
                    <div class="star-combinations-list">
                        ${renderStarCombinations(analysis)}
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h4>Cân bằng năng lượng</h4>
                    <div class="energy-balance">
                        ${renderEnergyBalance(analysis)}
                    </div>
                </div>
                
                <div class="analysis-details">
                </div>
                
                <button class="details-toggle" data-expanded="false">Xem chi tiết</button>
            </div>
        </div>
        `;
    }

    /**
     * Template cho mục lịch sử phân tích
     * @param {Object} historyItem - Item lịch sử
     * @returns {string} HTML string
     */
    function historyItem(historyItem) {
        return `
        <div class="history-item" data-phone="${historyItem.phoneNumber}">
            <div class="history-phone">${historyItem.phoneNumber}</div>
            <div class="history-time">${formatDate(new Date(historyItem.createdAt))}</div>
        </div>
        `;
    }

    /**
     * Render danh sách sao
     * @private
     * @param {Object} analysis - Dữ liệu phân tích
     * @returns {string} HTML string
     */
    function renderStarList(analysis) {
        if (!analysis.starSequence || !analysis.starSequence.length) {
            return '<div class="empty-list">Không có sao nào được tìm thấy</div>';
        }

        // Sắp xếp sao theo năng lượng
        const sortedStars = [...analysis.starSequence]
            .sort((a, b) => b.energyLevel - a.energyLevel)
            .slice(0, 3); // Hiển thị 3 sao hàng đầu

        return sortedStars.map(star => `
            <div class="star-item ${star.nature === 'Cát' ? 'cat' : star.nature === 'Hung' ? 'hung' : ''}">
                <div class="star-header">
                    <div class="star-name">${star.name}</div>
                    <div class="star-pair">${star.originalPair}</div>
                </div>
                <div class="star-energy">
                    <div class="energy-label">Năng lượng: ${star.energyLevel}/4</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render tổ hợp sao
     * @private
     * @param {Object} analysis - Dữ liệu phân tích
     * @returns {string} HTML string
     */
    function renderStarCombinations(analysis) {
        if (!analysis.starCombinations || !analysis.starCombinations.length) {
            return '<div class="empty-list">Không có tổ hợp sao nào</div>';
        }

        return analysis.starCombinations.slice(0, 2).map(combo => `
            <div class="star-combo-item">
                <div class="star-combo-header">
                    <span class="star-name ${combo.firstStar && combo.firstStar.nature === 'Cát' ? 'auspicious' : 'inauspicious'}">
                        ${combo.firstStar ? combo.firstStar.name : ''}
                    </span>
                    <span class="combo-plus">+</span>
                    <span class="star-name ${combo.secondStar && combo.secondStar.nature === 'Cát' ? 'auspicious' : 'inauspicious'}">
                        ${combo.secondStar ? combo.secondStar.name : ''}
                    </span>
                </div>
                <div class="star-combo-desc">${combo.description || ''}</div>
            </div>
        `).join('');
    }

    /**
     * Render cân bằng năng lượng
     * @private
     * @param {Object} analysis - Dữ liệu phân tích
     * @returns {string} HTML string
     */
    function renderEnergyBalance(analysis) {
        if (!analysis.energyLevel) {
            return '<div class="empty-list">Không có thông tin về năng lượng</div>';
        }

        let balanceClass = 'unknown';
        let balanceText = 'Cân bằng không xác định';
        
        if (analysis.balance) {
            switch(analysis.balance) {
                case 'BALANCED':
                    balanceClass = 'balanced';
                    balanceText = 'Cân bằng tốt giữa sao cát và hung';
                    break;
                case 'CAT_HEAVY':
                    balanceClass = 'cat-heavy';
                    balanceText = 'Thiên về sao cát (>70%)';
                    break;
                case 'HUNG_HEAVY':
                    balanceClass = 'hung-heavy';
                    balanceText = 'Thiên về sao hung (>70%)';
                    break;
            }
        }

        return `
            <div class="balance-text ${balanceClass}">
                ${balanceText}
            </div>
            <div class="energy-levels">
                <div class="energy-item">
                    <span class="energy-label">Tổng:</span>
                    <span class="energy-value">${analysis.energyLevel.total || 0}</span>
                </div>
                <div class="energy-item">
                    <span class="energy-label">Cát:</span>
                    <span class="energy-value positive">${analysis.energyLevel.cat || 0}</span>
                </div>
                <div class="energy-item">
                    <span class="energy-label">Hung:</span>
                    <span class="energy-value negative">${Math.abs(analysis.energyLevel.hung || 0)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Format date
     * @private
     * @param {Date} date - Đối tượng Date
     * @returns {string} Chuỗi ngày đã định dạng
     */
    function formatDate(date) {
        if (!date) return '';
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;
        
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

    return {
        userMessage,
        botMessage,
        analysisContainer,
        historyItem
    };
})();

export default Templates;
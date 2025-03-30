/**
 * LandingView
 * Quản lý hiển thị và tương tác trên trang giới thiệu (landing page)
 */

import EventBus from '../../core/EventBus.js';

const LandingView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements
        elements = {
            landingPage: document.getElementById('landing-page'),
            loginBtn: document.getElementById('landing-login-btn'),
            signupBtn: document.getElementById('landing-signup-btn'),
            demoInput: document.querySelector('.demo-input input'),
            demoButton: document.querySelector('.demo-input button'),
            loadingContainer: document.getElementById('loading-container')
        };
        
        // Hide loading screen
        if (elements.loadingContainer) {
            elements.loadingContainer.style.display = 'none';
        }
        
        // Set up event listeners
        if (elements.loginBtn) {
            elements.loginBtn.addEventListener('click', function() {
                window.location.href = 'login.html?tab=login';
            });
        }
        
        if (elements.signupBtn) {
            elements.signupBtn.addEventListener('click', function() {
                window.location.href = 'login.html?tab=register';
            });
        }
        
        // Set up demo input
        if (elements.demoInput) {
            elements.demoInput.addEventListener('click', function() {
                window.location.href = 'login.html?tab=login';
            });
        }
        
        if (elements.demoButton) {
            elements.demoButton.addEventListener('click', function() {
                window.location.href = 'login.html?tab=login';
            });
        }
        
        // Check authentication status
        checkAuthStatus();
    }
    
    /**
     * Kiểm tra trạng thái xác thực và chuyển hướng nếu cần
     * @private
     */
    function checkAuthStatus() {
        // Check if token exists in localStorage
        const token = localStorage.getItem('phone_analysis_token');
        if (token) {
            // Redirect to app page
            window.location.href = 'app.html';
        } else {
            // Show landing page
            if (elements.landingPage) {
                elements.landingPage.style.display = 'flex';
            }
        }
    }
    
    /**
     * Hiển thị các tính năng được giới thiệu
     * @param {Array} features - Mảng các tính năng để hiển thị
     */
    function renderFeatures(features) {
        const featureGrid = document.querySelector('.feature-grid');
        if (!featureGrid || !features || !features.length) return;
        
        // Clear existing features
        featureGrid.innerHTML = '';
        
        // Add features
        features.forEach(feature => {
            const featureCard = document.createElement('div');
            featureCard.className = 'feature-card';
            
            featureCard.innerHTML = `
                <div class="feature-icon">
                    <i class="fas ${feature.icon}"></i>
                </div>
                <h3 class="feature-title">${feature.title}</h3>
                <p class="feature-description">${feature.description}</p>
            `;
            
            featureGrid.appendChild(featureCard);
        });
    }
    
    /**
     * Hiển thị các tin nhắn mẫu trong phần demo
     * @param {Array} messages - Mảng các tin nhắn mẫu
     */
    function renderDemoMessages(messages) {
        const demoMessages = document.querySelector('.demo-messages');
        if (!demoMessages || !messages || !messages.length) return;
        
        // Clear existing messages
        demoMessages.innerHTML = '';
        
        // Add messages
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `demo-message demo-${message.sender}`;
            messageElement.textContent = message.text;
            
            demoMessages.appendChild(messageElement);
        });
    }
    
    return {
        init,
        renderFeatures,
        renderDemoMessages
    };
})();

export default LandingView;

// Tự động khởi tạo khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    LandingView.init();
});
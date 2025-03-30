/**
 * HeaderView Component
 * Quản lý hiển thị và tương tác với header
 */

import EventBus from '../../core/EventBus.js';

const HeaderView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements
        elements = {
            userAvatar: document.getElementById('toggle-account-dropdown'),
            accountDropdown: document.getElementById('account-dropdown-menu'),
            accountName: document.getElementById('account-name'),
            accountEmail: document.getElementById('account-email'),
            accountCreated: document.getElementById('account-created'),
            logoutBtn: document.getElementById('logout-btn'),
            changePasswordBtn: document.getElementById('change-password-btn'),
            serviceSelector: document.querySelector('.service-selector'),
            clearChatBtn: document.getElementById('clear-chat-mobile')
        };
        
        // Set up event listeners
        if (elements.userAvatar) {
            elements.userAvatar.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleAccountDropdown();
            });
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', function() {
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    EventBus.publish('auth:logout');
                }
            });
        }
        
        if (elements.changePasswordBtn) {
            elements.changePasswordBtn.addEventListener('click', function() {
                EventBus.publish('password:change');
                closeAccountDropdown();
            });
        }
        
        if (elements.clearChatBtn) {
            elements.clearChatBtn.addEventListener('click', function() {
                if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện hiện tại?')) {
                    EventBus.publish('chat:clear');
                }
            });
        }
        
        // Service selector dropdown
        if (elements.serviceSelector) {
            const currentService = elements.serviceSelector.querySelector('.current-service');
            const serviceItems = elements.serviceSelector.querySelectorAll('.service-item');
            
            if (currentService) {
                currentService.addEventListener('click', function(e) {
                    e.stopPropagation();
                    elements.serviceSelector.classList.toggle('active');
                });
            }
            
            serviceItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Update active state
                    serviceItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update current service name
                    if (currentService) {
                        const serviceName = this.textContent.trim();
                        currentService.querySelector('span').textContent = serviceName;
                    }
                    
                    // Close dropdown
                    elements.serviceSelector.classList.remove('active');
                    
                    // Publish service change event
                    const serviceType = this.getAttribute('data-service');
                    if (serviceType) {
                        EventBus.publish('service:change', serviceType);
                    }
                });
            });
        }
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            closeAccountDropdown();
            
            if (elements.serviceSelector && !elements.serviceSelector.contains(e.target)) {
                elements.serviceSelector.classList.remove('active');
            }
        });
        
        // Subscribe to events
        EventBus.subscribe('user:updated', updateUserInfo);
    }
    
    /**
     * Toggle tài khoản dropdown
     * @private
     */
    function toggleAccountDropdown() {
        const dropdown = elements.accountDropdown;
        if (dropdown) {
            dropdown.classList.toggle('active');
            
            // Close service dropdown if open
            if (elements.serviceSelector) {
                elements.serviceSelector.classList.remove('active');
            }
        }
    }
    
    /**
     * Đóng tài khoản dropdown
     * @private
     */
    function closeAccountDropdown() {
        if (elements.accountDropdown) {
            elements.accountDropdown.classList.remove('active');
        }
    }
    
    /**
     * Cập nhật thông tin người dùng trong header
     * @param {Object} user - Thông tin người dùng
     */
    function updateUserInfo(user) {
        if (!user) return;
        
        if (elements.accountName) {
            elements.accountName.textContent = user.name || 'Người dùng';
        }
        
        if (elements.accountEmail) {
            elements.accountEmail.textContent = user.email || '';
        }
        
        if (elements.accountCreated && user.createdAt) {
            const date = new Date(user.createdAt);
            elements.accountCreated.textContent = date.toLocaleDateString('vi-VN');
        }
        
        // Update welcome message
        const userNameWelcome = document.getElementById('user-name-welcome');
        if (userNameWelcome) {
            userNameWelcome.textContent = user.name || 'Người dùng';
        }
    }
    
    return {
        init,
        updateUserInfo
    };
})();

export default HeaderView;
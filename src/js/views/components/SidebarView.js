/**
 * SidebarView Component
 * Quản lý hiển thị và tương tác với sidebar
 */

import Templates from '../Templates.js';
import EventBus from '../../core/EventBus.js';

const SidebarView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements
        elements = {
            sidebar: document.getElementById('sidebar'),
            historyContainer: document.getElementById('analysis-history'),
            clearHistoryBtn: document.getElementById('clear-history'),
            toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
            closeSidebarBtn: document.getElementById('close-sidebar-btn'),
            newChatBtn: document.getElementById('new-chat-btn'),
            mobileOverlay: document.querySelector('.mobile-overlay')
        };
        
        // Create mobile overlay if it doesn't exist
        if (!elements.mobileOverlay) {
            elements.mobileOverlay = document.createElement('div');
            elements.mobileOverlay.className = 'mobile-overlay';
            document.body.appendChild(elements.mobileOverlay);
        }
        
        // Set up event listeners
        if (elements.toggleSidebarBtn) {
            elements.toggleSidebarBtn.addEventListener('click', toggleSidebar);
        }
        
        if (elements.closeSidebarBtn) {
            elements.closeSidebarBtn.addEventListener('click', toggleSidebar);
        }
        
        if (elements.mobileOverlay) {
            elements.mobileOverlay.addEventListener('click', closeSidebar);
        }
        
        if (elements.clearHistoryBtn) {
            elements.clearHistoryBtn.addEventListener('click', function() {
                if (confirm('Bạn có chắc muốn xóa lịch sử phân tích?')) {
                    EventBus.publish('history:clear');
                }
            });
        }
        
        if (elements.newChatBtn) {
            elements.newChatBtn.addEventListener('click', function() {
                EventBus.publish('chat:new');
                closeSidebar();
            });
        }
        
        // Subscribe to events
        EventBus.subscribe('history:updated', renderHistoryItems);
    }
    
    /**
     * Hiển thị các mục lịch sử phân tích
     * @param {Array} historyItems - Mảng các mục lịch sử
     */
    function renderHistoryItems(historyItems) {
        if (!elements.historyContainer) return;
        
        // Clear container
        elements.historyContainer.innerHTML = '';
        
        if (!historyItems || historyItems.length === 0) {
            elements.historyContainer.innerHTML = '<div class="empty-history-message">Chưa có lịch sử phân tích.</div>';
            return;
        }
        
        // Render each history item
        historyItems.forEach(item => {
            const itemHTML = Templates.historyItem(item);
            elements.historyContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
        
        // Add click handlers to history items
        const historyItems = elements.historyContainer.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            item.addEventListener('click', function() {
                const phoneNumber = this.getAttribute('data-phone');
                if (phoneNumber) {
                    EventBus.publish('history:selected', phoneNumber);
                    closeSidebar();
                }
            });
        });
    }
    
    /**
     * Toggle sidebar visibility
     * @private
     */
    function toggleSidebar() {
        if (!elements.sidebar) return;
        
        elements.sidebar.classList.toggle('active');
        elements.mobileOverlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-active');
    }
    
    /**
     * Close sidebar
     * @private
     */
    function closeSidebar() {
        if (!elements.sidebar) return;
        
        elements.sidebar.classList.remove('active');
        elements.mobileOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-active');
    }
    
    return {
        init,
        renderHistoryItems,
        toggleSidebar,
        closeSidebar
    };
})();

export default SidebarView;
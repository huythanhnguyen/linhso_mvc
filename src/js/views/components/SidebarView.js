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
        console.log('Initializing SidebarView...');
        
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
            console.log('Created mobile overlay element');
        }
        
        // Set up event listeners
        if (elements.toggleSidebarBtn) {
            elements.toggleSidebarBtn.addEventListener('click', toggleSidebar);
            console.log('Set up toggle sidebar button listener');
        }
        
        if (elements.closeSidebarBtn) {
            elements.closeSidebarBtn.addEventListener('click', toggleSidebar);
            console.log('Set up close sidebar button listener');
        }
        
        if (elements.mobileOverlay) {
            elements.mobileOverlay.addEventListener('click', closeSidebar);
            console.log('Set up mobile overlay click listener');
        }
        
        if (elements.clearHistoryBtn) {
            elements.clearHistoryBtn.addEventListener('click', function() {
                if (confirm('Bạn có chắc muốn xóa lịch sử phân tích?')) {
                    EventBus.publish('history:clear');
                    console.log('Published history:clear event');
                }
            });
            console.log('Set up clear history button listener');
        }
        
        if (elements.newChatBtn) {
            elements.newChatBtn.addEventListener('click', function() {
                EventBus.publish('chat:new');
                console.log('Published chat:new event');
                closeSidebar();
            });
            console.log('Set up new chat button listener');
        }
        
        // Subscribe to events
        EventBus.subscribe('history:updated', renderHistoryItems);
        console.log('Subscribed to history:updated event');
        
        console.log('SidebarView initialized successfully');
    }
    
    /**
     * Hiển thị các mục lịch sử phân tích
     * @param {Array} historyItems - Mảng các mục lịch sử
     */
    function renderHistoryItems(historyItems) {
        console.log('Rendering history items:', historyItems);
        
        if (!elements.historyContainer) {
            console.error('History container element not found');
            return;
        }
        
        // Clear container
        elements.historyContainer.innerHTML = '';
        
        if (!historyItems || historyItems.length === 0) {
            elements.historyContainer.innerHTML = '<div class="empty-history-message">Chưa có lịch sử phân tích.</div>';
            console.log('No history items to display');
            return;
        }
        
        // Render each history item
        historyItems.forEach(item => {
            const itemHTML = Templates.historyItem(item);
            elements.historyContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
        console.log(`Rendered ${historyItems.length} history items`);
        
        // Add click handlers to history items
        // Đổi tên biến để tránh xung đột với tham số historyItems
        const historyItemElements = elements.historyContainer.querySelectorAll('.history-item');
        historyItemElements.forEach(item => {
            item.addEventListener('click', function() {
                const phoneNumber = this.getAttribute('data-phone');
                if (phoneNumber) {
                    EventBus.publish('history:selected', phoneNumber);
                    console.log('Published history:selected event with phone number:', phoneNumber);
                    closeSidebar();
                }
            });
        });
        console.log(`Added click handlers to ${historyItemElements.length} history items`);
    }
    
    /**
     * Toggle sidebar visibility
     */
    function toggleSidebar() {
        if (!elements.sidebar) {
            console.error('Sidebar element not found');
            return;
        }
        
        elements.sidebar.classList.toggle('active');
        elements.mobileOverlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-active');
        console.log('Toggled sidebar visibility');
    }
    
    /**
     * Close sidebar
     */
    function closeSidebar() {
        if (!elements.sidebar) {
            console.error('Sidebar element not found');
            return;
        }
        
        elements.sidebar.classList.remove('active');
        elements.mobileOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-active');
        console.log('Closed sidebar');
    }
    
    return {
        init,
        renderHistoryItems,
        toggleSidebar,
        closeSidebar
    };
})();

export default SidebarView;
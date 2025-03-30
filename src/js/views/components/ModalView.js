/**
 * ModalView Component
 * Quản lý hiển thị và tương tác với các modal
 */

import EventBus from '../../core/EventBus.js';

const ModalView = (function() {
    // Cache DOM elements
    let elements = {};
    let activeModal = null;
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements
        elements = {
            passwordModal: document.getElementById('password-modal'),
            closePasswordModal: document.getElementById('close-password-modal'),
            currentPassword: document.getElementById('current-password'),
            newPassword: document.getElementById('new-password'),
            confirmPassword: document.getElementById('confirm-password'),
            passwordMessage: document.getElementById('password-message'),
            submitPassword: document.getElementById('submit-password'),
            cancelPassword: document.getElementById('cancel-password')
        };
        
        // Set up password modal events
        if (elements.closePasswordModal) {
            elements.closePasswordModal.addEventListener('click', closePasswordModal);
        }
        
        if (elements.cancelPassword) {
            elements.cancelPassword.addEventListener('click', closePasswordModal);
        }
        
        if (elements.submitPassword) {
            elements.submitPassword.addEventListener('click', handlePasswordChange);
        }
        
        // Subscribe to events
        EventBus.subscribe('password:change', showPasswordModal);
        EventBus.subscribe('modal:create', createModal);
    }
    
    /**
     * Hiển thị modal đổi mật khẩu
     */
    function showPasswordModal() {
        if (elements.passwordModal) {
            elements.passwordModal.classList.add('active');
            activeModal = elements.passwordModal;
            
            // Reset form
            if (elements.currentPassword) elements.currentPassword.value = '';
            if (elements.newPassword) elements.newPassword.value = '';
            if (elements.confirmPassword) elements.confirmPassword.value = '';
            if (elements.passwordMessage) elements.passwordMessage.textContent = '';
            
            // Focus first field
            if (elements.currentPassword) elements.currentPassword.focus();
        }
    }
    
    /**
     * Đóng modal đổi mật khẩu
     */
    function closePasswordModal() {
        if (elements.passwordModal) {
            elements.passwordModal.classList.remove('active');
            activeModal = null;
        }
    }
    
    /**
     * Xử lý khi submit form đổi mật khẩu
     * @private
     */
    function handlePasswordChange() {
        if (!elements.currentPassword || !elements.newPassword || 
            !elements.confirmPassword || !elements.passwordMessage) {
            return;
        }
        
        const currentPassword = elements.currentPassword.value;
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            elements.passwordMessage.textContent = 'Vui lòng điền đầy đủ thông tin';
            elements.passwordMessage.style.color = 'var(--danger-color)';
            return;
        }
        
        if (newPassword.length < 6) {
            elements.passwordMessage.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự';
            elements.passwordMessage.style.color = 'var(--danger-color)';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            elements.passwordMessage.textContent = 'Mật khẩu xác nhận không khớp';
            elements.passwordMessage.style.color = 'var(--danger-color)';
            return;
        }
        
        // Display processing message
        elements.passwordMessage.textContent = 'Đang xử lý...';
        elements.passwordMessage.style.color = 'var(--text-secondary)';
        
        // Disable submit button
        if (elements.submitPassword) {
            elements.submitPassword.disabled = true;
        }
        
        // Emit password change event
        EventBus.publish('auth:changePassword', {
            currentPassword,
            newPassword,
            callback: handlePasswordChangeResult
        });
    }
    
    /**
     * Xử lý kết quả đổi mật khẩu
     * @param {Object} result - Kết quả từ server
     */
    function handlePasswordChangeResult(result) {
        if (!elements.passwordMessage || !elements.submitPassword) return;
        
        // Re-enable submit button
        elements.submitPassword.disabled = false;
        
        if (result.success) {
            elements.passwordMessage.textContent = 'Đổi mật khẩu thành công';
            elements.passwordMessage.style.color = 'var(--success-color)';
            
            // Close modal after 2 seconds
            setTimeout(closePasswordModal, 2000);
        } else {
            elements.passwordMessage.textContent = result.error || 'Đổi mật khẩu thất bại';
            elements.passwordMessage.style.color = 'var(--danger-color)';
        }
    }
    
    /**
     * Tạo modal động
     * @param {Object} options - Tùy chọn tạo modal
     */
    function createModal(options) {
        // Close any active modal
        if (activeModal) {
            activeModal.classList.remove('active');
        }
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h3>${options.title || 'Thông báo'}</h3>
            <button class="modal-close-btn"><i class="fas fa-times"></i></button>
        `;
        
        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.innerHTML = options.content || '';
        
        // Create modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        // Add buttons
        if (options.buttons) {
            options.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = button.className || 'btn-primary';
                btn.textContent = button.text || 'OK';
                
                if (button.id) {
                    btn.id = button.id;
                }
                
                if (button.callback) {
                    btn.addEventListener('click', function() {
                        button.callback();
                        closeModal(modalOverlay);
                    });
                } else {
                    btn.addEventListener('click', function() {
                        closeModal(modalOverlay);
                    });
                }
                
                modalFooter.appendChild(btn);
            });
        } else {
            // Default OK button
            const okButton = document.createElement('button');
            okButton.className = 'btn-primary';
            okButton.textContent = 'OK';
            okButton.addEventListener('click', function() {
                closeModal(modalOverlay);
            });
            modalFooter.appendChild(okButton);
        }
        
        // Assemble modal
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        modalContainer.appendChild(modalFooter);
        modalOverlay.appendChild(modalContainer);
        
        // Add to document
        document.body.appendChild(modalOverlay);
        
        // Set up close button
        const closeButton = modalHeader.querySelector('.modal-close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                closeModal(modalOverlay);
            });
        }
        
        // Click outside to close
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal(modalOverlay);
            }
        });
        
        // Show modal
        setTimeout(() => {
            modalOverlay.classList.add('active');
            activeModal = modalOverlay;
        }, 10);
        
        return modalOverlay;
    }
    
    /**
     * Close dynamic modal
     * @param {HTMLElement} modal - Modal element to close
     */
    function closeModal(modal) {
        if (!modal) return;
        
        modal.classList.remove('active');
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            if (activeModal === modal) {
                activeModal = null;
            }
        }, 300);
    }
    
    return {
        init,
        showPasswordModal,
        closePasswordModal,
        createModal
    };
})();

export default ModalView;
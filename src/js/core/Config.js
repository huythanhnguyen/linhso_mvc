/**
 * Configuration file for Phone Analysis App
 * Contains API endpoints and other configuration settings
 */

const Config = {
    // API Base URL
    API_BASE_URL: 'https://chatbotsdtapi.onrender.com/api',
    
    // Auth endpoints
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        VERIFY_TOKEN: '/auth/me',
        CHANGE_PASSWORD: '/auth/change-password'
    },
    
    // User endpoints
    USER: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
    },
    
    // Analysis endpoints
    ANALYSIS: {
        ANALYZE: '/analysis/analyze',
        HISTORY: '/analysis/history',
        FEEDBACK: '/analysis/feedback',
        RECENT: '/analysis/recent',
        QUESTION: '/analysis/question',
        DELETE_HISTORY: '/analysis/history'
    },
    
    // Storage key names
    STORAGE: {
        TOKEN: 'phone_analysis_token',
        USER: 'phone_analysis_user',
        SETTINGS: 'phone_analysis_settings',
        HISTORY: 'phone_analysis_history',
        CHAT_HISTORY: 'phone_analysis_chat_history'
    },
    
    // Timeout for API requests in ms
    REQUEST_TIMEOUT: 15000,
    
    // Maximum number of analysis history items to display
    MAX_HISTORY_ITEMS: 10,
    
    // Delay for the typing indicator animation in ms
    TYPING_DELAY: 1000,
    
    // Debug mode - set to false in production
    DEBUG: true
};

export default Config;
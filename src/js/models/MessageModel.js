/**
 * Message Model
 */
class MessageModel {
    constructor(data = {}) {
        this.id = data.id || `msg_${data.role || 'user'}_${Date.now()}`;
        this.role = data.role || 'user'; // 'user' or 'assistant'
        this.content = data.content || '';
        this.timestamp = data.timestamp || new Date().toISOString();
        this.analysisData = data.analysisData || null;
    }
    
    /**
     * Check if message is from user
     * @returns {boolean} Whether the message is from user
     */
    isUserMessage() {
        return this.role === 'user';
    }
    
    /**
     * Check if message is from assistant
     * @returns {boolean} Whether the message is from assistant
     */
    isAssistantMessage() {
        return this.role === 'assistant';
    }
    
    /**
     * Check if message has analysis data
     * @returns {boolean} Whether the message has analysis data
     */
    hasAnalysisData() {
        return !!this.analysisData;
    }
    
    /**
     * Convert to plain object
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            role: this.role,
            content: this.content,
            timestamp: this.timestamp,
            analysisData: this.analysisData
        };
    }
}

export default MessageModel;
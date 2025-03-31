/**
 * Event Bus for publish-subscribe pattern
 * Cung cấp cơ chế giao tiếp giữa các thành phần không liên quan trực tiếp
 */
class EventBus {
    constructor() {
        this.events = {};
        console.log('EventBus instance created');
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    subscribe(event, callback) {
        // Create event array if not exists
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        // Add callback to event listeners
        this.events[event].push(callback);
        console.log(`Subscribed to event: ${event}, total subscribers: ${this.events[event].length}`);
        
        // Return unsubscribe function
        return () => this.unsubscribe(event, callback);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    unsubscribe(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
            console.log(`Unsubscribed from event: ${event}, remaining subscribers: ${this.events[event].length}`);
        }
    }
    
    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    publish(event, data) {
        if (this.events[event]) {
            // Execute each callback with the data
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
            console.log(`Published event: ${event}, to ${this.events[event].length} subscribers`);
        } else {
            console.warn(`Event published but no subscribers: ${event}`);
        }
    }
    
    /**
     * Get all registered events
     * @returns {Object} Events object with all registered events and their callbacks
     */
    getEvents() {
        return this.events;
    }
    
    /**
     * Clear all events or a specific event
     * @param {string} event - Optional specific event to clear
     */
    clear(event) {
        if (event) {
            delete this.events[event];
            console.log(`Cleared all subscribers for event: ${event}`);
        } else {
            this.events = {};
            console.log('Cleared all events and subscribers');
        }
    }
}

// Create singleton instance
const eventBus = new EventBus();

// Export the class for testing/extending and the instance as default
export { EventBus }; // Named export for the class
export default eventBus; // Default export for the singleton instance
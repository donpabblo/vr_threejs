export const messaging_manager = (() => {

    class MessagingManager {
        constructor() {
            this.subscribers = {};
        }

        subscribe(topic, callback) {
            if (typeof callback !== 'function') {
                throw new Error(`${typeof callback} is not a valid argument for subscribe method, expected a function instead`)
            }
            if (!this.subscribers[topic]) {
                this.subscribers[topic] = [];
            }
            this.subscribers[topic] = [...this.subscribers[topic], callback]
        }

        unsubscribe(topic, callback) {
            if (typeof callback !== 'function') {
                throw new Error(`${typeof callback} is not a valid argument for unsubscribe method, expected a function instead`)
            }
            if (this.subscribers[topic]) {
                this.subscribers[topic] = this.subscribers[topic].filter(sub => sub !== callback)
            }
        }

        publish(topic, message) {
            this.subscribers[topic].forEach(callback => callback(message))
        }
       
    }

    return {
        MessagingManager: MessagingManager
    };

})();
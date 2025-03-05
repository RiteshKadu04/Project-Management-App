// WebSocket Configuration
const WS_URL = 'wss://echo.websocket.org'; // For testing purposes, replace with your actual WebSocket server
let socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

// Connection Status UI
const createStatusMessage = (status, type = 'info') => {
    const colors = {
        info: 'bg-blue-100 text-blue-800',
        error: 'bg-red-100 text-red-800',
        success: 'bg-green-100 text-green-800'
    };

    return `
        <div class="flex justify-center mb-4 new-message">
            <span class="text-xs ${colors[type]} px-3 py-1 rounded-full">
                ${status}
            </span>
        </div>
    `;
};

// WebSocket Connection Management
const connectWebSocket = () => {
    try {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            console.log('WebSocket connected');
            reconnectAttempts = 0;
            const messagesContainer = document.querySelector('.messages-container');
            messagesContainer.insertAdjacentHTML('beforeend', 
                createStatusMessage('Connected to chat', 'success')
            );

            // Update online status
            updateOnlineStatus(true);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            updateOnlineStatus(false);

            // Attempt to reconnect
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    reconnectAttempts++;
                    connectWebSocket();
                    const messagesContainer = document.querySelector('.messages-container');
                    messagesContainer.insertAdjacentHTML('beforeend',
                        createStatusMessage(`Reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`, 'info')
                    );
                }, RECONNECT_DELAY);
            } else {
                const messagesContainer = document.querySelector('.messages-container');
                messagesContainer.insertAdjacentHTML('beforeend',
                    createStatusMessage('Connection failed. Please refresh the page.', 'error')
                );
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            const messagesContainer = document.querySelector('.messages-container');
            messagesContainer.insertAdjacentHTML('beforeend',
                createStatusMessage('Connection error occurred', 'error')
            );
        };

        socket.onmessage = (event) => {
            handleIncomingMessage(event.data);
        };

    } catch (error) {
        console.error('WebSocket connection error:', error);
    }
};

// Message Handling
const handleIncomingMessage = (data) => {
    try {
        const message = JSON.parse(data);
        
        // Handle different types of messages
        switch (message.type) {
            case 'chat':
                window.addReceivedMessage(
                    message.content,
                    message.sender,
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender)}&background=6366f1&color=fff`
                );
                break;
            case 'typing':
                updateTypingIndicator(message.sender, message.isTyping);
                break;
            case 'status':
                updateUserStatus(message.userId, message.status);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
};

// Typing Indicator
const updateTypingIndicator = (sender, isTyping) => {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (isTyping) {
        if (!typingIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator text-xs text-gray-500 px-4 py-2';
            indicator.textContent = `${sender} is typing...`;
            document.querySelector('.messages-container').appendChild(indicator);
        }
    } else if (typingIndicator) {
        typingIndicator.remove();
    }
};

// Online Status Management
const updateOnlineStatus = (isOnline) => {
    const onlineIndicator = document.querySelector('.online-indicator');
    const statusText = document.querySelector('.text-green-500');
    
    if (onlineIndicator) {
        onlineIndicator.style.backgroundColor = isOnline ? '#34D399' : '#EF4444';
    }
    
    if (statusText) {
        statusText.textContent = isOnline ? '5 members online' : 'Disconnected';
        statusText.className = isOnline ? 'text-xs text-green-500' : 'text-xs text-red-500';
    }
};

// Message Sending
const sendWebSocketMessage = (content) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            type: 'chat',
            content: content,
            sender: 'You',
            timestamp: new Date().toISOString()
        };
        
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
        const messagesContainer = document.querySelector('.messages-container');
        messagesContainer.insertAdjacentHTML('beforeend',
            createStatusMessage('Message failed to send. Please check your connection.', 'error')
        );
    }
};

// Typing Status
const emitTypingStatus = (isTyping) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            type: 'typing',
            sender: 'You',
            isTyping: isTyping
        };
        
        socket.send(JSON.stringify(message));
    }
};

// Initialize WebSocket connection
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
});

// Expose functions globally
window.sendWebSocketMessage = sendWebSocketMessage;
window.emitTypingStatus = emitTypingStatus;

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        }
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.close();
    }
});

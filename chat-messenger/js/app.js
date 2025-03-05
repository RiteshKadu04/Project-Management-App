// DOM Elements
const messagesContainer = document.querySelector('.messages-container');
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-button');

// Message Templates
const createReceivedMessage = (message, sender, avatar) => `
    <div class="flex items-end space-x-2 new-message">
        <img src="${avatar}" class="w-6 h-6 rounded-full" alt="${sender}">
        <div class="message-bubble max-w-[75%] bg-gray-100 rounded-t-2xl rounded-br-2xl p-3">
            <p class="text-sm text-gray-800">${message}</p>
            <span class="text-xs text-gray-500 mt-1 block">${formatTime(new Date())}</span>
        </div>
    </div>
`;

const createSentMessage = (message) => `
    <div class="flex items-end justify-end space-x-2 new-message">
        <div class="message-bubble max-w-[75%] bg-indigo-500 rounded-t-2xl rounded-bl-2xl p-3">
            <p class="text-sm text-white">${message}</p>
            <span class="text-xs text-indigo-200 mt-1 block">${formatTime(new Date())}</span>
        </div>
    </div>
`;

// Utility Functions
const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

const scrollToBottom = () => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

const addMessage = (messageHTML) => {
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
};

// Message sending animation
const animateSendButton = () => {
    sendButton.classList.add('scale-90');
    setTimeout(() => sendButton.classList.remove('scale-90'), 100);
};

// Handle sending messages
const sendMessage = () => {
    const message = messageInput.value.trim();
    if (message) {
        // Animate send button
        animateSendButton();

        // Add message to chat
        addMessage(createSentMessage(message));

        // Clear input
        messageInput.value = '';

        // Send via WebSocket (implemented in websocket.js)
        if (window.sendWebSocketMessage) {
            window.sendWebSocketMessage(message);
        }
    }
};

// Event Listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Add typing indicator
let typingTimeout;
messageInput.addEventListener('input', () => {
    clearTimeout(typingTimeout);
    // Emit typing status via WebSocket
    if (window.emitTypingStatus) {
        window.emitTypingStatus(true);
        typingTimeout = setTimeout(() => window.emitTypingStatus(false), 1000);
    }
});

// Initialize emoji picker (optional feature for future implementation)
const initEmojiPicker = () => {
    // Placeholder for emoji picker implementation
    console.log('Emoji picker initialization');
};

// Add smooth animations for new messages
const observeNewMessages = () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('new-message')) {
                    node.style.opacity = '0';
                    requestAnimationFrame(() => {
                        node.style.transition = 'opacity 0.3s ease';
                        node.style.opacity = '1';
                    });
                }
            });
        });
    });

    observer.observe(messagesContainer, {
        childList: true,
        subtree: true
    });
};

// Initialize the chat application
const initChat = () => {
    scrollToBottom();
    observeNewMessages();
    // Future feature initializations can be added here
};

// Start the application
document.addEventListener('DOMContentLoaded', initChat);

// Expose functions for WebSocket integration
window.addReceivedMessage = (message, sender, avatar) => {
    addMessage(createReceivedMessage(message, sender, avatar));
};

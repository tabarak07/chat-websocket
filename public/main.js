const socket = io();
const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const typingFeedback = document.getElementById('typing-feedback');
const messageTone = new Audio('/message-tone.mp3');

// Send message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

// Update total clients
socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`;
});

// Send message function
function sendMessage() {
  const message = DOMPurify.sanitize(messageInput.value.trim());
  if (!message) {
    alert("Message cannot be empty."); // Notify user
    return;
  }

  const name = DOMPurify.sanitize(nameInput.value.trim() || "Anonymous");
  const data = {
    name: name,
    message: message,
    dateTime: new Date(),
  };
  socket.emit('message', data);
  addMessageToUI(true, data);
  messageInput.value = '';
  clearFeedback(); // Clear feedback when a message is sent
}

// Receive message
socket.on('chat-message', (data) => {
  messageTone.play().catch((error) => {
    console.error('Error playing message tone:', error);
  });
  addMessageToUI(false, data);
});

// Add message to UI
function addMessageToUI(isOwnMessage, data) {
  clearFeedback();
  const element = `
    <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
      <p class="message">
        ${data.message}
        <span>${data.name} ● ${moment(data.dateTime).format('h:mm A')}</span>
      </p>
    </li>
  `;
  messageContainer.innerHTML += element;
  scrollToBottom();
}

// Scroll to bottom
function scrollToBottom() {
  messageContainer.scrollTo({
    top: messageContainer.scrollHeight,
    behavior: 'smooth',
  });
}

// Typing feedback
let typingTimeout;

function throttleFeedback() {
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', {
      username: nameInput.value.trim() || "Anonymous", // Send the username
    });
  }, 300);
}

messageInput.addEventListener('input', throttleFeedback);
messageInput.addEventListener('blur', () => {
  socket.emit('typing', { username: '' }); // Clear feedback on blur
});

// Handle typing feedback
socket.on('typing', (data) => {
  if (data.username) {
    typingFeedback.innerText = `${data.username} is typing...`;
  } else {
    typingFeedback.innerText = ''; // Clear feedback if empty
  }
});

// Clear feedback
function clearFeedback() {
  typingFeedback.innerText = ''; // Clear typing feedback
}
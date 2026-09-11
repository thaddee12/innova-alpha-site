window.AlphaChat = (function() {
  let chatOpen = false;
  let messages = [];
  let loading = false;

  function init() {
    const toggle = document.getElementById('alphaToggle');
    const chatBox = document.getElementById('alphaChat');
    const closeBtn = document.getElementById('alphaClose');
    const sendBtn = document.getElementById('alphaSend');
    const input = document.getElementById('alphaInput');
    const msgBox = document.getElementById('alphaMessages');

    if (!toggle || !chatBox) return false;

    // Load saved messages
    try {
      const saved = localStorage.getItem('alpha_messages');
      if (saved) messages = JSON.parse(saved);
    } catch (e) {}

    toggle.addEventListener('click', () => {
      chatOpen = !chatOpen;
      chatBox.style.display = chatOpen ? 'flex' : 'none';
      if (chatOpen) input.focus();
    });

    closeBtn.addEventListener('click', () => {
      chatOpen = false;
      chatBox.style.display = 'none';
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !loading) sendMessage();
    });

    sendBtn.addEventListener('click', sendMessage);

    function sendMessage() {
      const text = input.value.trim();
      if (!text || loading) return;

      input.value = '';
      addMessage('user', text);
      loading = true;
      sendBtn.disabled = true;

      if (!window.claude) {
        addMessage('assistant', 'Claude API not configured. Contact: contact@innova-alpha.com');
        loading = false;
        sendBtn.disabled = false;
        return;
      }

      window.claude.complete({
        messages: messages,
        system: 'You are Alpha, AI assistant for INNOVA ALPHA. Help with: Consulting, Digital/web, AI, Marketing, Mobile apps, AI Training. Contact: +237 697 21 26 46 / contact@innova-alpha.com',
        max_tokens: 512
      }).then(response => {
        addMessage('assistant', response);
        saveChatHistory();
        loading = false;
        sendBtn.disabled = false;
        msgBox.scrollTop = msgBox.scrollHeight;
      }).catch(err => {
        addMessage('assistant', 'Error. Contact: contact@innova-alpha.com');
        loading = false;
        sendBtn.disabled = false;
      });
    }

    function addMessage(role, content) {
      messages.push({ role, content });

      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '10px';
      if (role === 'user') div.style.flexDirection = 'row-reverse';

      const avatar = document.createElement('div');
      avatar.style.width = '32px';
      avatar.style.height = '32px';
      avatar.style.borderRadius = '50%';
      avatar.style.display = 'flex';
      avatar.style.alignItems = 'center';
      avatar.style.justifyContent = 'center';
      avatar.style.fontWeight = '700';
      avatar.style.fontSize = '0.75rem';
      avatar.style.flexShrink = '0';
      avatar.textContent = role === 'user' ? 'U' : 'α';
      avatar.style.background = role === 'user' ? '#6C22ED' : 'rgba(108,34,237,0.15)';
      avatar.style.color = role === 'user' ? '#FFFFFF' : '#6C22ED';

      const bubble = document.createElement('div');
      bubble.style.maxWidth = 'calc(100% - 42px)';
      bubble.style.padding = '10px 12px';
      bubble.style.borderRadius = '12px';
      bubble.style.fontSize = '0.85rem';
      bubble.style.lineHeight = '1.5';
      bubble.style.wordWrap = 'break-word';
      bubble.style.whiteSpace = 'pre-wrap';
      if (role === 'user') {
        bubble.style.background = '#6C22ED';
        bubble.style.color = '#FFFFFF';
      } else {
        bubble.style.background = '#F5F4F8';
        bubble.style.color = '#0B0B0C';
      }
      bubble.textContent = content;

      div.appendChild(avatar);
      div.appendChild(bubble);
      msgBox.appendChild(div);
    }

    function saveChatHistory() {
      try {
        localStorage.setItem('alpha_messages', JSON.stringify(messages));
      } catch (e) {}
    }

    return true;
  }

  return { init: init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.AlphaChat.init());
} else {
  window.AlphaChat.init();
}

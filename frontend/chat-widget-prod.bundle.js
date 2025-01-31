(function () {
    const styles = `
    :root {
      --primary-gradient: linear-gradient(135deg, #6a11cb, #2575fc);
      --background-color: #f4f7f6;
      --text-color: #333;
      --user-message-bg: #dff7e8;
      --ai-message-bg: #f0f0f0;
      --shadow-color: rgba(0, 0, 0, 0.15);
    }

    body {
      font-family: 'Poppins', sans-serif;
      margin: 0;
      background-color: var(--background-color);
    }

    #chat-toggle-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-gradient);
      color: white;
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 8px 15px var(--shadow-color);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      z-index: 1000;
    }

    #chat-toggle-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }

    #chat-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      max-height: 600px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 15px 30px var(--shadow-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .hidden {
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
    }

    #chat-header {
      background: var(--primary-gradient);
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 15px 15px 0 0;
      font-size: 18px;
      font-weight: bold;
    }

    #close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    #close-btn:hover {
      transform: scale(1.2);
    }

    #message-area {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f9f9f9;
    }

    .user-message, .ai-message {
      max-width: 85%;
      padding: 10px 15px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
    }

    .user-message {
      align-self: flex-end;
      background-color: var(--user-message-bg);
    }

    .ai-message {
      align-self: flex-start;
      background-color: var(--ai-message-bg);
    }

    #input-area {
      display: flex;
      padding: 10px;
      border-top: 1px solid #eee;
      background: white;
    }

    #user-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      resize: none;
      min-height: 44px;
      max-height: 150px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
    }

    #user-input:focus {
      border-color: #6a11cb;
    }

    #send-btn {
      background: var(--primary-gradient);
      color: white;
      border: none;
      padding: 12px 20px;
      margin-left: 10px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s ease;
    }

    #send-btn:hover {
      background: #4a90e2;
    }
  `;
  
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  
    // Utility Functions
    const generateSessionId = () => {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
  
    const scrapePageContent = () => {
      const bodyText = document.body.innerText;
      
      const metaTags = Array.from(document.getElementsByTagName('meta'))
        .map(meta => ({
          name: meta.getAttribute('name') || meta.getAttribute('property'),
          content: meta.getAttribute('content')
        }))
        .filter(meta => meta.name && meta.content);
  
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(heading => ({
          level: heading.tagName,
          text: heading.innerText.trim()
        }));
  
      const links = Array.from(document.getElementsByTagName('a'))
        .map(link => ({
          text: link.innerText.trim(),
          href: link.href
        }));
  
      const mainContent = Array.from(document.querySelectorAll('main, article, [role="main"]'))
        .map(element => element.innerText.trim());
  
      return {
        url: window.location.href,
        title: document.title,
        metaTags,
        headings,
        links,
        mainContent,
        fullText: bodyText
      };
    };
  
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };
  
    const ChatWidget = {
      sessionId: generateSessionId(),
      pageData: null,
      token: null,
      username: null,
      password: null,
      apiUrl: null,
      customerId: null,
      apiKey: null,
      bcrypt: null,
      lastPageUpdateTime: 0,
      pageUpdateDebounceTime: 5000, // 5 seconds
      isAuthenticated: false,
      authenticationInProgress: false,
  
      async loadDependencies() {
        try {
          await Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/bcryptjs/2.4.3/bcrypt.min.js')
          ]);
          
          this.bcrypt = window.dcodeIO ? window.dcodeIO.bcrypt : window.bcrypt;
          if (!this.bcrypt) {
            throw new Error('Failed to initialize bcrypt');
          }
        } catch (error) {
          console.error('Failed to load dependencies:', error);
          throw error;
        }
      },
  
      async authenticate() {
        if (this.isAuthenticated || this.authenticationInProgress) {
          return this.isAuthenticated;
        }
  
        this.authenticationInProgress = true;
  
        try {
          const hasValidToken = await this.validateToken();
          if (hasValidToken) {
            this.isAuthenticated = true;
            return true;
          }
  
          const loginSuccess = await this.login();
          this.isAuthenticated = loginSuccess;
          return loginSuccess;
        } catch (error) {
          console.error('Authentication failed:', error);
          this.isAuthenticated = false;
          return false;
        } finally {
          this.authenticationInProgress = false;
        }
      },
  
      async login() {
        try {
          const response = await fetch(`${this.apiUrl}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: this.username,
              password: this.password
            })
          });
  
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }
  
          this.token = data.access_token;
          this.customerId = data.customer_id;
          this.apiKey = data.api_key;
          
          this.storeCredentials();
          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
  
      storeCredentials() {
        localStorage.setItem('chat_token', this.token);
        localStorage.setItem('chat_customer_id', this.customerId);
        localStorage.setItem('chat_api_key', this.apiKey);
      },
  
      clearCredentials() {
        localStorage.removeItem('chat_token');
        localStorage.removeItem('chat_customer_id');
        localStorage.removeItem('chat_api_key');
        this.token = null;
        this.customerId = null;
        this.apiKey = null;
        this.isAuthenticated = false;
      },
  
      restoreCredentials() {
        this.token = localStorage.getItem('chat_token');
        this.customerId = localStorage.getItem('chat_customer_id');
        this.apiKey = localStorage.getItem('chat_api_key');
        return this.token && this.customerId && this.apiKey;
      },
  
      async validateToken() {
        if (!this.restoreCredentials()) {
          return false;
        }
  
        try {
          const response = await fetch(`${this.apiUrl}/validate-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
              'X-API-Key': this.apiKey
            }
          });
  
          if (!response.ok) {
            this.clearCredentials();
            return false;
          }
  
          const data = await response.json();
          this.customerId = data.customer_id;
          this.apiKey = data.api_key;
          return true;
        } catch (error) {
          console.error('Token validation error:', error);
          this.clearCredentials();
          return false;
        }
      },
  
      async sendPageContext(pageData, force = false) {
        const now = Date.now();
        if (!force && now - this.lastPageUpdateTime < this.pageUpdateDebounceTime) {
          return;
        }
  
        try {
          if (!await this.authenticate()) {
            throw new Error('Not authenticated');
          }
  
          const response = await fetch(`${this.apiUrl}/page-context`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
              'X-API-Key': this.apiKey
            },
            body: JSON.stringify({
              customerId: this.customerId,
              apiKey: this.apiKey,
              pageUrl: window.location.href,
              pageContent: pageData
            })
          });
  
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send page context');
          }
  
          this.lastPageUpdateTime = now;
        } catch (error) {
          console.error('Failed to send page context:', error);
          throw error;
        }
      },
  
      async sendMessage(message) {
        try {
          if (!await this.authenticate()) {
            throw new Error('Not authenticated');
          }
  
          const response = await fetch(`${this.apiUrl}/send-message`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              customerId: this.customerId,
              apiKey: this.apiKey,
              pageUrl: window.location.href
            })
          });
  
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to send message');
          }
  
          return data;
        } catch (error) {
          console.error('Failed to send message:', error);
          throw error;
        }
      },
  
      async init({ apiUrl, containerId = "ai-chat-widget", customerId, apiKey, username, password }) {
        this.apiUrl = apiUrl;
        this.customerId = customerId;
        this.apiKey = apiKey;
        this.username = username;
        this.password = password;
  
        try {
          await this.loadDependencies();
          await this.authenticate();
  
          const container = document.getElementById(containerId);
          if (!container) {
            console.error(`Container with ID '${containerId}' not found.`);
            return;
          }
  
          // Create DOM Structure
          container.innerHTML = `
            <button id="chat-toggle-btn">💬</button>
            <div id="chat-window" class="hidden">
              <div id="chat-header">
                <span>AI Assistant</span>
                <button id="close-btn">×</button>
              </div>
              <div id="message-area"></div>
              <div id="input-area">
                <textarea id="user-input" placeholder="Type your message..." rows="1"></textarea>
                <button id="send-btn">Send</button>
              </div>
            </div>
          `;
  
          const chatToggleBtn = container.querySelector("#chat-toggle-btn");
          const chatWindow = container.querySelector("#chat-window");
          const closeBtn = container.querySelector("#close-btn");
          const sendBtn = container.querySelector("#send-btn");
          const userInput = container.querySelector("#user-input");
          const messageArea = container.querySelector("#message-area");
  
          // Initial page content
          this.pageData = scrapePageContent();
          await this.sendPageContext(this.pageData, true);
  
          // Event Listeners
          chatToggleBtn.addEventListener("click", () => {
            chatWindow.classList.toggle("hidden");
          });
  
          closeBtn.addEventListener("click", () => {
            chatWindow.classList.add("hidden");
          });
  
          userInput.addEventListener("input", () => {
            userInput.style.height = "auto";
            userInput.style.height = (userInput.scrollHeight) + "px";
          });
  
          userInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendBtn.click();
            }
          });
  
          sendBtn.addEventListener("click", async () => {
            const userMessage = userInput.value.trim();
            if (!userMessage) return;
  
            try {
              userInput.value = "";
              userInput.style.height = "auto";
  
              const userMessageElem = document.createElement("div");
              userMessageElem.textContent = userMessage;
              userMessageElem.classList.add("user-message");
              messageArea.appendChild(userMessageElem);
  
              const responseData = await this.sendMessage(userMessage);
              
              const aiMessageElem = document.createElement("div");
              aiMessageElem.classList.add("ai-message");
              aiMessageElem.innerHTML = marked.parse(responseData.response || "");
              messageArea.appendChild(aiMessageElem);
            } catch (error) {
              const errorElem = document.createElement("div");
              errorElem.textContent = `Error: ${error.message}`;
              errorElem.classList.add("ai-message");
              messageArea.appendChild(errorElem);
            }
  
            messageArea.scrollTop = messageArea.scrollHeight;
          });
  
          // Debounced page content observer
          let debounceTimeout;
          const observer = new MutationObserver(() => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(async () => {
              this.pageData = scrapePageContent();
              try {
                await this.sendPageContext(this.pageData);
              } catch (error) {
                console.error("Failed to send updated page context:", error);
              }
            }, this.pageUpdateDebounceTime);
          });
  
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
          });
  
        } catch (error) {
          console.error("Initialization error:", error);
          throw error;
        }
      }
    };
  
    // Initialize the widget
    document.addEventListener("DOMContentLoaded", () => {
      const widget = document.getElementById("ai-chat-widget");
      if (!widget) {
        console.error("Widget container not found");
        return;
      }
  
      const config = {
        apiUrl: widget.getAttribute("data-api-url"),
        customerId: widget.getAttribute("data-customer-id"),
        apiKey: widget.getAttribute("data-api-key"),
        username: widget.getAttribute("data-username"),
        password: widget.getAttribute("data-password")
      };
  
      if (!config.apiUrl || !config.customerId || !config.apiKey || !config.username || !config.password) {
        console.error("Missing required configuration attributes");
        return;
      }
  
      ChatWidget.init(config).catch(error => {
        console.error("Failed to initialize chat widget:", error);
      });
    });
  
    window.ChatWidget = ChatWidget;
  })();
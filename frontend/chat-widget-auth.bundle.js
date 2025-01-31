(function () {
    // [Previous CSS styles remain unchanged...]
  
    const ChatWidget = {
      sessionId: generateSessionId(),
      pageData: null,
      token: null,
  
      async login(username, password) {
        try {
          const response = await fetch(`${this.apiUrl}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username,
              password
            })
          });
  
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }
  
          this.token = data.access_token;
          return data;
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
  
      async validateToken() {
        try {
          const response = await fetch(`${this.apiUrl}/validate-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            }
          });
  
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Token validation failed');
          }
  
          return data;
        } catch (error) {
          console.error('Token validation error:', error);
          this.token = null;
          throw error;
        }
      },
  
      async sendPageContext(pageData) {
        try {
          const response = await fetch(`${this.apiUrl}/page-context`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
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
        } catch (error) {
          console.error('Failed to send page context:', error);
          throw error;
        }
      },
  
      async sendMessage(message) {
        try {
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
  
        try {
          // Login first
          await this.login(username, password);
          
          // Validate token
          await this.validateToken();
  
          // Scrape initial page content
          this.pageData = scrapePageContent();
  
          // Send initial page data to the server
          await this.sendPageContext(this.pageData);
  
          // Create Chat Widget DOM Structure
          const container = document.getElementById(containerId);
          if (!container) {
            console.error(`Container with ID '${containerId}' not found.`);
            return;
          }
  
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
  
          // Toggle Chat Window
          chatToggleBtn.addEventListener("click", () => {
            chatWindow.classList.toggle("hidden");
          });
  
          // Close Chat Window
          closeBtn.addEventListener("click", () => {
            chatWindow.classList.add("hidden");
          });
  
          // Auto-resize textarea
          userInput.addEventListener("input", () => {
            userInput.style.height = "auto";
            userInput.style.height = (userInput.scrollHeight) + "px";
          });
  
          // Handle Enter and Shift+Enter
          userInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendBtn.click();
            }
          });
  
          // Send Message
          sendBtn.addEventListener("click", async () => {
            const userMessage = userInput.value.trim();
            if (!userMessage) return;
  
            try {
              // Clear input and reset height
              userInput.value = "";
              userInput.style.height = "auto";
  
              // Add user message to chat
              const userMessageElem = document.createElement("div");
              userMessageElem.textContent = userMessage;
              userMessageElem.classList.add("user-message");
              messageArea.appendChild(userMessageElem);
  
              // Send message and handle response
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
  
              // If token is invalid, try to re-login
              if (error.message.includes('token')) {
                try {
                  await this.login(username, password);
                  await this.validateToken();
                } catch (loginError) {
                  console.error('Failed to re-authenticate:', loginError);
                }
              }
            }
  
            messageArea.scrollTop = messageArea.scrollHeight;
          });
  
          // Listen for page content changes
          const observer = new MutationObserver(async (mutations) => {
            this.pageData = scrapePageContent();
            try {
              await this.sendPageContext(this.pageData);
            } catch (error) {
              console.error("Failed to send updated page context:", error);
            }
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
      },
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
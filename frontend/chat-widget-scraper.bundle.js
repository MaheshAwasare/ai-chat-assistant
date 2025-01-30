(function () {
  // CSS Styles
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

  // Inject CSS into the head of the document
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  document.head.appendChild(script);

  // Generate a unique session ID
  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Function to scrape page content
  const scrapePageContent = () => {
    // Get all text content from the page
    const bodyText = document.body.innerText;
    
    // Get meta tags
    const metaTags = Array.from(document.getElementsByTagName('meta'))
      .map(meta => ({
        name: meta.getAttribute('name') || meta.getAttribute('property'),
        content: meta.getAttribute('content')
      }))
      .filter(meta => meta.name && meta.content);

    // Get headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(heading => ({
        level: heading.tagName,
        text: heading.innerText.trim()
      }));

    // Get links
    const links = Array.from(document.getElementsByTagName('a'))
      .map(link => ({
        text: link.innerText.trim(),
        href: link.href
      }));

    // Get main content areas
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

  const ChatWidget = {
    sessionId: generateSessionId(),
    pageData: null,

    async init({ apiUrl, containerId = "ai-chat-widget", customerId, apiKey }) {
      this.apiUrl = apiUrl;
      this.customerId = customerId;
      this.apiKey = apiKey;

      // Scrape initial page content
      this.pageData = scrapePageContent();

      // Send initial page data to the server
      try {
        await fetch(`${apiUrl}/page-context`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            customerId: this.customerId,
            apiKey: this.apiKey,
            pageData: this.pageData
          }),
        });
      } catch (error) {
        console.error("Failed to send page context:", error);
      }

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

      // Auto-resize textarea as user types
      userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height = (userInput.scrollHeight) + "px";
      });

      // Handle Enter and Shift+Enter
      userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          if (event.shiftKey) {
            // Allow Shift+Enter for new line
            return;
          }
          // Prevent default Enter behavior and send message
          event.preventDefault();
          sendBtn.click();
        }
      });

      // Send Message
      sendBtn.addEventListener("click", async () => {
        const userMessage = userInput.value.trim();
        if (userMessage) {
          userInput.value = "";
          userInput.style.height = "auto"; // Reset height after clearing
          const userMessageElem = document.createElement("div");
          userMessageElem.textContent = userMessage;
          userMessageElem.classList.add("user-message");
          messageArea.appendChild(userMessageElem);

          try {
            const response = await fetch(`${apiUrl}/send-message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: userMessage,
                sessionId: this.sessionId,
                customerId: this.customerId,
                apiKey: this.apiKey,
                currentUrl: window.location.href
              }),
            });

            const responseData = await response.json();
            console.log('response data ', responseData);
            if (!response.ok) {
              const errorElem = document.createElement("div");
              console.log('error data ', responseData.error);
              errorElem.textContent = `Sorry! Something went wrong: ${responseData.error}`;
              errorElem.classList.add("ai-message");
              messageArea.appendChild(errorElem);
            } else {
              const aiMessageElem = document.createElement("div");
              aiMessageElem.classList.add("ai-message");
              aiMessageElem.innerHTML = marked.parse(responseData.response || "");
              messageArea.appendChild(aiMessageElem);
            }
          } catch (error) {
            const errorElem = document.createElement("div");
            console.log('error data ', error);
            errorElem.textContent = `Sorry! Something went wrong: ${error}`;
            errorElem.classList.add("ai-message");
            messageArea.appendChild(errorElem);
          }

          messageArea.scrollTop = messageArea.scrollHeight;
        }
      });

      // Listen for page content changes
      const observer = new MutationObserver(async (mutations) => {
        // Update page data
        this.pageData = scrapePageContent();
        
        // Send updated page data to the server
        try {
          await fetch(`${apiUrl}/page-context-update`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId: this.sessionId,
              customerId: this.customerId,
              apiKey: this.apiKey,
              pageData: this.pageData
            }),
          });
        } catch (error) {
          console.error("Failed to send updated page context:", error);
        }
      });

      // Configure the observer to watch for content changes
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    },
  };

  // Automatically initialize the widget
  document.addEventListener("DOMContentLoaded", () => {
    const apiUrl = document
      .getElementById("ai-chat-widget")
      ?.getAttribute("data-api-url");

    const customerId = document
      .getElementById("ai-chat-widget")
      ?.getAttribute("customerId");

    const apiKey = document
      .getElementById("ai-chat-widget")
      ?.getAttribute("apiKey");

    if (!apiUrl) {
      console.error(
        "API URL not provided. Add a 'data-api-url' attribute to the #ai-chat-widget element."
      );
      return;
    }

    ChatWidget.init({
      apiUrl: apiUrl,
      containerId: "ai-chat-widget",
      customerId: customerId,
      apiKey: apiKey,
    });
  });

  // Expose the widget globally for debugging purposes
  window.ChatWidget = ChatWidget;
})();
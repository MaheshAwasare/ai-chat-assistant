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

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(script);
  
    const ChatWidget = {
      init({ apiUrl, containerId = 'ai-chat-widget' }) {
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
              <input type="text" id="user-input" placeholder="Type your message...">
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
  
        // Send Message
        sendBtn.addEventListener("click", async () => {
          const userMessage = userInput.value.trim();
          if (userMessage) {
            userInput.value = "";
            const userMessageElem = document.createElement("div");
            userMessageElem.textContent = userMessage;
            userMessageElem.classList.add("user-message");
            messageArea.appendChild(userMessageElem);
  
            try {
              const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage }),
              });
  
              const responseData = await response.json();
              const aiMessageElem = document.createElement("div");
              aiMessageElem.classList.add("ai-message");
              aiMessageElem.innerHTML = marked.parse(responseData.response || "");
              messageArea.appendChild(aiMessageElem);
            } catch (error) {
              const errorElem = document.createElement("div");
              errorElem.textContent = `An error occurred: ${error.message}`;
              errorElem.classList.add("ai-message");
              messageArea.appendChild(errorElem);
            }
  
            messageArea.scrollTop = messageArea.scrollHeight;
          }
        });
  
        // Enter Key Shortcut
        userInput.addEventListener("keypress", (event) => {
          if (event.key === "Enter") {
            sendBtn.click();
          }
        });
      },
    };
  
    // Automatically initialize the widget
    document.addEventListener("DOMContentLoaded", () => {
      const apiUrl = document
        .getElementById("ai-chat-widget")
        ?.getAttribute("data-api-url");
  
      if (!apiUrl) {
        console.error(
          "API URL not provided. Add a 'data-api-url' attribute to the #ai-chat-widget element."
        );
        return;
      }
  
      ChatWidget.init({
        apiUrl: apiUrl,
        containerId: "ai-chat-widget",
      });
    });
  
    // Expose the widget globally for debugging purposes
    window.ChatWidget = ChatWidget;
  })();
  
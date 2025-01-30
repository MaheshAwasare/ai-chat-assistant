# 🤖 AI Chat Widget



A powerful, context-aware AI chat widget that can be embedded into any website to provide intelligent assistance based on page content.

[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-2.0%2B-green.svg)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/javascript-ES6%2B-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## ✨ Features

- 🔍 **Real-time Page Context Analysis**: Automatically captures and understands webpage content
- 🧠 **Dual AI Backend Support**: 
  - Local: Ollama integration
  - Remote: Hugging Face models
- 🔒 **Secure Authentication**: Customer ID and API key validation
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🔄 **Dynamic Updates**: Monitors and adapts to page content changes
- 💬 **Rich Text Support**: Markdown formatting for responses

## 🚀 Quick Start

### Backend Setup

1. Install Python dependencies:
```bash
pip install flask flask-cors python-dotenv huggingface-hub ollama
```

2. Set up environment variables in `.env`:
```env
HF_API_TOKEN=your_huggingface_token
MODE=remote  # or 'local' for Ollama
PORT=5000
```

3. Create a `customers.txt` file:
```text
customer_id_1,api_key_1
customer_id_2,api_key_2
```

4. Start the Flask server:
```bash
python app.py
```

### Frontend Integration

1. Add the widget container to your HTML:
```html
<div id="ai-chat-widget" 
     data-api-url="http://your-backend-url/api/send-message"
     customerId="your_customer_id"
     apiKey="your_api_key">
</div>
```

2. Include the chat widget script:
```html
<script src="https://cdn.jsdelivr.net/gh/MaheshAwasare/ai-chat-assistant/frontend/chat-widget-scraper.bundle.js"></script>
```

## 🔧 Configuration

### Backend Configuration

The Flask backend supports two modes:
- `local`: Uses Ollama for AI responses
- `remote`: Uses Hugging Face models (default)

### Frontend Configuration

The chat widget can be customized through CSS variables:
```css
:root {
  --primary-gradient: linear-gradient(135deg, #6a11cb, #2575fc);
  --background-color: #f4f7f6;
  --text-color: #333;
  /* ... other variables ... */
}
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/send-message` | POST | Send user message and get AI response |
| `/api/page-context` | POST | Store initial page context |
| `/api/page-context-update` | POST | Update page context on changes |

## 🛡️ Security

- Customer authentication using ID and API key
- Session-based context storage
- Secure CORS configuration
- Input validation and sanitization

## 🖼️ Screenshots


![image](https://github.com/user-attachments/assets/76108aa5-d5eb-490f-9e75-397fbdc789b0)


## 📝 License

MIT License - feel free to use this in your projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, email  or create an issue in this repository.

---

Made with ❤️ by AICA-LINK

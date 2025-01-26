# AI Chat Widget

An AI-powered chat widget that can be easily integrated into any website to provide instant messaging capabilities with an intelligent assistant.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [License](#license)

## Overview

The AI Chat Widget is a versatile tool designed to integrate seamlessly into any website, providing users with immediate access to an AI-driven chat interface. This widget supports markdown responses and can be customized for various use cases.

## Features

- **Easy Integration**: Embeddable via a simple script tag.
- **AI-Powered Responses**: Interact with intelligent chatbot functionality.
- **Markdown Support**: Utilizes `marked.js` for parsing Markdown in responses.
- **Customizable Appearance**: Styles are customizable to match your website's design.
- **Responsive Design**: Works on desktops, tablets, and mobile devices.

## Requirements

- A modern web browser (Chrome, Firefox, Safari).
- Internet access for fetching the widget script.
- An API endpoint for processing chat messages.

## Installation

To integrate the AI Chat Widget into your website:

1. Add a container `<div>` with an ID of `ai-chat-widget` on your webpage where you want the widget to appear:

    ```html
    <div id="ai-chat-widget"></div>
    ```

2. Include the following script in the `<head>` section of your HTML file or just before the closing `</body>` tag:

    ```html
    <script src="https://cdn.jsdelivr.net/gh/MaheshAwasare/ai-chat-assistant/frontend/chat-widget.bundle.js"></script>
    ```

3. Ensure that you have an API endpoint ready to handle message requests.

## Usage

Once installed, the widget will appear as a button on your website. Clicking this button will open the chat interface. Users can type messages and receive responses in real-time from the AI assistant.

## Configuration

You can configure the widget by modifying the initialization script:

```html
<script>
document.addEventListener("DOMContentLoaded", () => {
    const customerID = 'YOUR_CUSTOMER_ID';  // Example: '12345'
    const apiKey = 'YOUR_API_KEY';          // Example: 'abcde12345'

    window.ChatWidget.init({
        apiUrl: `http://127.0.0.1:5000/api/send-message?customerId=${customerID}&apiKey=${apiKey}`,
        containerId: 'ai-chat-widget',
        customerId: customerID,
        apiKey: apiKey
    });
});
</script>

```

## License

### Notes:
- Adjust paths, URLs, and placeholders as needed based on your specific implementation.
- Ensure any dependencies (like `marked.js`) are correctly referenced if they're external to your bundle.

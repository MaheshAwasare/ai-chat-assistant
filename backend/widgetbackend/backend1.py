from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama

app = Flask(__name__)
CORS(app)

# Ollama server configuration
MODEL_NAME = "mistral:latest"


@app.route('/api/send-message', methods=['POST'])
def send_message():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        user_message = data['message']

        # Use Ollama to get a response
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {'role': 'user', 'content': user_message}
            ]
        )

        # Check if a response was received
        if response and 'message' in response:
            ai_message = response['message']['content']
            formatted_response = {
                'response': ai_message,
                'format': 'markdown'  # Add format indicator
            }
            print("AI Response:", formatted_response)  # Print the response for debugging
            return jsonify(formatted_response)
        else:
            return jsonify({'error': 'Error communicating with the AI model'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
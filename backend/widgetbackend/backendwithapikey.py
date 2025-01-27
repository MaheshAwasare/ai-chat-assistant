from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
import os
from dotenv import load_dotenv
app = Flask(__name__)
CORS(app)

# Ollama server configuration
MODEL_NAME = "mistral:latest"


def load_customers():
    """Load customer data from the customers.txt file."""
    customers = {}
    try:
        with open('customers.txt', 'r') as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) == 2:
                    customer_id, api_key = parts
                    customers[customer_id] = api_key
    except FileNotFoundError:
        print("Customers file not found.")
    return customers


customers_data = load_customers()
print(customers_data)


@app.route('/api/send-message', methods=['POST'])
def send_message():
    try:
        data = request.json  # Extract JSON payload
        if not data:
            return jsonify({'error': 'Invalid request format. JSON payload is required'}), 400

        # Extract customerId and apiKey from the JSON payload
        customer_id = data.get('customerId')
        api_key = data.get('apiKey')
        user_message = data.get('message')
        mode = os.getenv("MODE", "local")

        # Validate inputs
        if not customer_id or not api_key:
            return jsonify({'error': 'Customer ID or API Key missing'}), 400
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Validate Customer ID and API Key
        valid_api_key = customers_data.get(customer_id)
        if valid_api_key != api_key:
            return jsonify({'error': 'Invalid Customer ID or API Key'}), 403

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

        from huggingface_hub import InferenceClient

        client = InferenceClient(
            "meta-llama/Meta-Llama-3-8B-Instruct",
            token="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",
        )

        output = client.chat.completions.create(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_message},
            ],
            stream=False,
            max_tokens=1024,
        )
        print("Output   ", output)
        assistant_message = output.choices[0].message.content
        print(assistant_message)
        if assistant_message :
            #ai_message = response['message']['content']
            formatted_response = {
                'response': assistant_message,
                'format': 'markdown'  # Add format indicator
            }
            print("AI Response:", formatted_response)  # Print the response for debugging
            return jsonify(formatted_response)
        else:
            return jsonify({'error': 'Error communicating with the AI model'}), 500




    except Exception as e:
        print('Error:', e)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

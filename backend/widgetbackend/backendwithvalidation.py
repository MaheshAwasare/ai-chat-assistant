from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama

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
        data = request.json
        print(data)
        print('1')
        customer_id = request.args.get('customerId')
        print('1')
        api_key = request.args.get('apiKey')
        print('1')
        print(customer_id, api_key)
        print('1')
        # Validate the Customer ID and API Key
        if not customer_id or not api_key:
            print(customer_id, " customer id not found")
            return jsonify({'error': 'Customer ID or API Key missing'}), 400

        valid_api_key = customers_data.get(customer_id)

        if valid_api_key != api_key:
            print(valid_api_key + " api key not found")
            return jsonify({'error': 'Invalid Customer ID or API Key'}), 403
        user_message = data['message']
        if not data or 'message' not in data:
            print("Message ", user_message)
            return jsonify({'error': 'No message provided'}), 400



        # Use Ollama to get a response
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {'role': 'user', 'content': user_message}
            ]
        )

        '''
        import requests
       
        API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest"
        headers = {"Authorization": "Bearer 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"}
        payload = {
            "inputs": "Today is a great day",
        }
        print()
        response1 = requests.post(API_URL, headers=headers, json=payload)
        response1.json()

        print(response1.json())
       '''

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
        print('Error ', e)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

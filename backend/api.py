from flask import Flask, request, jsonify
from flask_cors import CORS
from repair_loop import run_repair_loop

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication


@app.route('/analyze', methods=['POST'])
def analyze_code():
    """
    API endpoint to analyze and repair Python code.
    
    Request body:
    {
        "code": "print('hello')"
    }
    
    Response:
    {
        "success": true/false,
        "final_code": "...",
        "error": "..." (if failed),
        "attempts": [
            {
                "attempt": 1,
                "error": "...",
                "fixed_code": "...",
                "explanation": "...",
                "confidence": 8
            }
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                "success": False,
                "error": "No code provided in request"
            }), 400
        
        code = data['code']
        
        # Run the repair loop
        result = run_repair_loop(code)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "attempts": []
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
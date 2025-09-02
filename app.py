from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from rembg import remove
from PIL import Image
import io
import base64 # Import base64 library
import os
import random # For randomization

# For rembg-specific error handling
try:
    from rembg.bg import RembgError
except ImportError:
    class RembgError(Exception): pass

# Add production config
app = Flask(__name__, static_folder='static')
CORS(app)

@app.route('/')
def home():
    return app.send_static_file('index.html')


# We are REPLACING the old '/process-image' with this new logic
@app.route('/process-image', methods=['POST'])
def process_image_endpoint():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']

    try:
        input_image_bytes = file.read()
        # --- 1. Perform background removal ---
        bg_removed_bytes = remove(input_image_bytes)
        # --- 2. Prepare images for sending ---
        original_base64 = base64.b64encode(input_image_bytes).decode('utf-8')
        subject_base64 = base64.b64encode(bg_removed_bytes).decode('utf-8')
        # --- 3. Send both images back as JSON ---
        return jsonify({
            "original_image": f"data:image/{file.mimetype.split('/')[1]};base64,{original_base64}",
            "subject_image": f"data:image/png;base64,{subject_base64}"
        })
    except RembgError as e:
        app.logger.error(f"Background removal failed: {e}")
        return jsonify({"error": "Failed to process image background. The image might be corrupted or in an unsupported format."}), 400
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
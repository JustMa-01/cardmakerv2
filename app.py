from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from rembg import remove, new_session
from PIL import Image
import io
import base64

# ---- Flask Setup ----
app = Flask(__name__)
CORS(app)

# ---- Load lightweight rembg model ONCE (major RAM savings) ----
session = new_session("u2netp")   # LIGHT model (lowest RAM usage)

# ---- Resize incoming images (massive RAM savings for large uploads) ----
def resize_image_if_needed(image_bytes, max_size=1024):
    img = Image.open(io.BytesIO(image_bytes))

    # If image is already small, skip
    if max(img.size) <= max_size:
        return image_bytes

    img.thumbnail((max_size, max_size))
    output = io.BytesIO()
    img.save(output, format="PNG")
    return output.getvalue()

# ---- Routes ----
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process-image', methods=['POST'])
def process_image_endpoint():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']

    try:
        original_bytes = file.read()

        # --- 1. Resize large images before removing background ---
        optimized_bytes = resize_image_if_needed(original_bytes)

        # --- 2. Remove background using lightweight global model ---
        result_bytes = remove(optimized_bytes, session=session)

        # --- 3. Convert to Base64 for frontend preview ---
        original_b64 = base64.b64encode(original_bytes).decode('utf-8')
        result_b64 = base64.b64encode(result_bytes).decode('utf-8')

        # Clean up memory
        del original_bytes
        del optimized_bytes
        del result_bytes

        return jsonify({
            "original_image": f"data:image/png;base64,{original_b64}",
            "subject_image": f"data:image/png;base64,{result_b64}"
        })

    except Exception as e:
        app.logger.error(f"Error: {e}")
        return jsonify({"error": "Image processing failed."}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)

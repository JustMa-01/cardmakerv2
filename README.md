# Interactive Card Generator

A Flask-based web application that creates custom greeting cards by removing image backgrounds and adding personalized text overlays.

## Features

- **Background Removal**: Automatically removes backgrounds from uploaded images
- **Custom Text**: Add wishes and name text with customizable font sizes
- **Random Styling**: Applies random colors and effects to text for visual variety
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern dark UI with smooth animations

## Setup Instructions

1. **Import the Project**:
    ```bash
     git clone https://github.com/hemanthanala1/cardmaker.git
    ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application**:
   ```bash
   python app.py
   ```

5. **Access the App**:
   Open your browser and go to `http://localhost:5000`

## Usage

1. Upload an image (JPG, PNG, etc.)
2. Enter your wishes text (e.g., "Happy Birthday")
3. Enter the recipient's name
4. Adjust font sizes using the sliders
5. Choose single or double line layout
6. Click "Generate Card" to create your custom card
7. Download the result as a JPG file

## Technical Details

- **Backend**: Flask with background removal using `rembg`
- **Frontend**: Vanilla JavaScript with modern CSS
- **Image Processing**: PIL/Pillow for text overlays
- **Font**: Anton Regular (included)

## File Structure

```
bg10/
├── app.py              # Flask backend
├── requirements.txt    # Dependencies
├── Anton-Regular.ttf   # Font file
├── static/
│   ├── style.css      # Styling
│   └── script.js      # Frontend logic
└── templates/
    └── index.html     # Main UI
```

## Requirements

- Python 3.7+
- Flask
- rembg
- Pillow
- Flask-CORS

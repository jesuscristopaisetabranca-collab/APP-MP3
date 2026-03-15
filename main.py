import os
import re
from flask import Flask, request, send_file, jsonify
from gtts import gTTS
import io

app = Flask(__name__)

def sanitize_text(text):
    # Remove line breaks that don't look like paragraph ends
    text = re.sub(r'([^\.\!\?\n])\n([a-z])', r'\1 \2', text)
    # Remove hyphens at line ends
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    # Remove page numbers
    text = re.sub(r'^\d+$', '', text, flags=re.MULTILINE)
    text = re.sub(r'Page \d+', '', text, flags=re.IGNORECASE)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

@app.route('/api/generate', methods=['POST'])
def generate_audio():
    data = request.json
    text = data.get('text', '')
    tld = data.get('tld', 'com.br') # Support for multiple TLDs
    lang = data.get('lang', 'pt')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    clean_text = sanitize_text(text)
    
    try:
        tts = gTTS(text=clean_text, lang=lang, tld=tld, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        return send_file(
            fp,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='narration.mp3'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return "Lumina Backend API is running."

if __name__ == '__main__':
    app.run(debug=True)

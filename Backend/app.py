from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import subprocess
from googletrans import Translator
import base64

app = Flask(__name__)
# CORS(app)  # To allow cross-origin requests
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

translator = Translator()

@app.route('/generate-description', methods=['POST'])
def generate_description():
    data = request.get_json()
    print('get image')

    
    data = request.get_json()
    if not data or 'file' not in data:
        return jsonify({'error': 'No image provided'}), 400
    
   
    base64_img = data['file'].split(",")[1]  
    image_data = base64.b64decode(base64_img)

    lang = data['lang']
    
    
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_image.jpg')
    with open(image_path, 'wb') as f:
        f.write(image_data)

    try:
       
        print('run image_description')
        env = os.environ.copy()
        env['PYTHONPATH'] = f"{env.get('PYTHONPATH', '')}:/home/yashraj/tts_image_description_app/models/Expansion_new/ExpansionNet_v2"
        result = subprocess.run([
            'python3',
            '/home/yashraj/tts_image_description_app/backend/img_des.py',
            '--load_path', '/home/yashraj/tts_image_description_app/models/Expansion_new/model_files/rf_model.pth',
            '--image_paths', image_path
        ], capture_output=True,env=env, text=True)

        
        if result.returncode != 0:
            return jsonify({'error': 'Error generating description', 'details': result.stderr}), 500
        
        print("image description done")
        #Get the description from stdout
        image_description = result.stdout.strip()
    
        translated_text = translator.translate(image_description, dest=lang).text
        
        print("translation done")
        #run the TTS model to generate the audio
        env = os.environ.copy()
        tts_command = [
            'conda', 'run', '-n', 'tts-mfa-hifigan', 'python3', 'inference.py',
            '--sample_text', translated_text,
            '--language', lang,
            '--gender', 'male',
            '--output_file', '/home/yashraj/tts_image_description_app/backend/output.wav'
        ]
        env['PYTHONPATH'] = f"{env.get('PYTHONPATH', '')}:/home/yashraj/tts_image_description_app/New/Fastspeech2_MFA"
        tts_result = subprocess.run(tts_command, cwd='/home/yashraj/tts_image_description_app/New/Fastspeech2_MFA',env = env, capture_output=True, text=True)
        
        if tts_result.returncode != 0:
            print(tts_result)
            return jsonify({'error': 'Error generating TTS', 'details': tts_result.stderr}), 500
        
        output_wav_path = os.path.join('/home/yashraj/tts_image_description_app/backend', 'output.wav')
        
        if os.path.exists(output_wav_path):
            with open(output_wav_path, "rb") as audio_file:
                audio_data = base64.b64encode(audio_file.read()).decode("utf-8")
            return jsonify({
                'description': image_description,
                'translated_text': translated_text,
                'audio_data': audio_data
            })
        else:
            return jsonify({'error': 'WAV file not found'}), 500


    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(ssl_context = "adhoc")
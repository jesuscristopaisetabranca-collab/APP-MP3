import os
import io
import json
from moviepy.editor import TextClip, AudioFileClip, ImageClip, CompositeVideoClip, ColorClip
import whisper

def generate_video(audio_path, image_path, output_path, text_content):
    """
    Local script to generate a 9:16 video from audio and an image.
    Requires: pip install moviepy openai-whisper
    """
    print(f"Loading audio: {audio_path}")
    audio = AudioFileClip(audio_path)
    
    print("Transcribing with Whisper...")
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    
    print(f"Loading image: {image_path}")
    # Create a 9:16 background
    bg = ColorClip(size=(1080, 1920), color=(20, 20, 20)).set_duration(audio.duration)
    
    # Load and resize image to fit width
    img = ImageClip(image_path).set_duration(audio.duration)
    img = img.resize(width=1000).set_position(('center', 400))
    
    # Generate subtitles from Whisper segments
    clips = [bg, img]
    
    for segment in result['segments']:
        start = segment['start']
        end = segment['end']
        text = segment['text'].strip()
        
        # Create text clip (requires ImageMagick installed for MoviePy)
        txt = TextClip(
            text,
            fontsize=70,
            color='white',
            font='Arial-Bold',
            method='caption',
            size=(900, None)
        ).set_start(start).set_end(end).set_position(('center', 1400))
        
        clips.append(txt)
    
    video = CompositeVideoClip(clips, size=(1080, 1920))
    video.audio = audio
    
    print(f"Writing video to: {output_path}")
    video.write_videofile(output_path, fps=24, codec='libx264', audio_codec='aac')

if __name__ == "__main__":
    # Example usage
    # generate_video("narration.mp3", "cover.jpg", "output.mp4", "Snippet text...")
    print("Processor script ready. Use generate_video function.")

import os
import io
import json
from moviepy.editor import TextClip, AudioFileClip, ImageClip, CompositeVideoClip, ColorClip
import whisper

def generate_video(audio_path, image_path, output_path, bg_music_path=None, bg_volume=0.2):
    """
    Local script to generate a 9:16 video from audio and an image.
    Supports optional background music mixing.
    """
    print(f"Loading narration: {audio_path}")
    narration = AudioFileClip(audio_path)
    
    # Handle background music
    final_audio = narration
    if bg_music_path and os.path.exists(bg_music_path):
        print(f"Mixing background music: {bg_music_path} at volume {bg_volume}")
        bg_music = AudioFileClip(bg_music_path).volumex(bg_volume)
        # Loop background music if it's shorter than narration
        if bg_music.duration < narration.duration:
            bg_music = afx.audio_loop(bg_music, duration=narration.duration)
        else:
            bg_music = bg_music.set_duration(narration.duration)
        
        final_audio = CompositeAudioClip([narration, bg_music])

    print("Transcribing with Whisper...")
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    
    print(f"Loading image: {image_path}")
    bg = ColorClip(size=(1080, 1920), color=(20, 20, 20)).set_duration(narration.duration)
    
    img = ImageClip(image_path).set_duration(narration.duration)
    img = img.resize(width=1000).set_position(('center', 400))
    
    clips = [bg, img]
    
    for segment in result['segments']:
        txt = TextClip(
            segment['text'].strip(),
            fontsize=70,
            color='white',
            font='Arial-Bold',
            method='caption',
            size=(900, None)
        ).set_start(segment['start']).set_end(segment['end']).set_position(('center', 1400))
        clips.append(txt)
    
    video = CompositeVideoClip(clips, size=(1080, 1920))
    video.audio = final_audio
    
    print(f"Writing video to: {output_path}")
    video.write_videofile(output_path, fps=24, codec='libx264', audio_codec='aac')

if __name__ == "__main__":
    # Example usage:
    # generate_video("narration.mp3", "cover.jpg", "output.mp4", bg_music_path="music.mp3", bg_volume=0.15)
    generate_video("narration.mp3", "cover.jpg", "output.mp4")

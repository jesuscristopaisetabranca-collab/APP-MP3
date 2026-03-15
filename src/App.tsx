/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  BookOpen, 
  Wand2, 
  Volume2, 
  Download, 
  FileText, 
  Trash2, 
  Settings2,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const VOICES = [
  { id: 'Kore', name: 'Kore (Professional)', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Energetic)', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Deep)', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir (Narrator)', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr (Soft)', gender: 'Female' },
];

export default function App() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'instructions'>('editor');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const sanitizeText = () => {
    let cleaned = text
      // Remove line breaks that don't look like paragraph ends
      .replace(/([^\.\!\?\n])\n([a-z])/g, '$1 $2')
      // Remove hyphens at line ends
      .replace(/(\w)-\n(\w)/g, '$1$2')
      // Remove page numbers (common patterns like "Page 123" or just "123" on a line)
      .replace(/^\d+$/gm, '')
      .replace(/Page \d+/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    setText(cleaned);
  };

  const generateNarration = async () => {
    if (!text.trim()) {
      setError("Please enter some text first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Narrate this book snippet with a professional tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const blob = await fetch(`data:audio/mpeg;base64,${base64Audio}`).then(r => r.blob());
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } else {
        throw new Error("No audio data received from AI.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate narration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BookOpen className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lumina</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">Book to Shorts</p>
            </div>
          </div>
          
          <nav className="flex gap-1 bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setActiveTab('instructions')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'instructions' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
            >
              Video Script
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'editor' ? (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Input */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/2">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                      <FileText className="w-4 h-4" />
                      BOOK SNIPPET
                    </div>
                    <button 
                      onClick={sanitizeText}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      Clean PDF Text
                    </button>
                  </div>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your book excerpt here..."
                    className="w-full h-[400px] bg-transparent p-6 outline-none resize-none text-lg leading-relaxed placeholder:text-white/10"
                  />
                  <div className="px-4 py-2 bg-white/2 border-t border-white/10 flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest">
                    <span>{text.length} characters</span>
                    <span>{text.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Controls */}
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/60 uppercase tracking-wider">
                      <Settings2 className="w-4 h-4" />
                      Voice Settings
                    </div>
                    
                    <div className="grid gap-2">
                      {VOICES.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setVoice(v.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            voice === v.id 
                              ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                              : 'bg-white/2 border-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          <div className="text-left">
                            <div className="text-sm font-semibold">{v.name}</div>
                            <div className="text-[10px] opacity-60">{v.gender}</div>
                          </div>
                          {voice === v.id && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={generateNarration}
                    disabled={isGenerating || !text.trim()}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Generating Narration...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5" />
                        Generate Narration
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  {audioUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4 pt-4 border-t border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Preview</span>
                        <a 
                          href={audioUrl} 
                          download="narration.mp3"
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-500 hover:text-emerald-400"
                        >
                          <Download className="w-3 h-3" />
                          Download MP3
                        </a>
                      </div>
                      <audio ref={audioRef} src={audioUrl} controls className="w-full h-10 invert brightness-150 opacity-80" />
                    </motion.div>
                  )}
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-emerald-500 mb-2">Next Step</h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Once you have your narration, head over to the <button onClick={() => setActiveTab('instructions')} className="text-emerald-400 hover:underline">Video Script</button> tab to generate your 9:16 short video using our local processor.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="instructions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Local Video Processor</h2>
                <p className="text-white/60 leading-relaxed">
                  To generate high-quality 9:16 videos with synchronized subtitles, you'll need to run a small Python script locally. This ensures maximum performance and privacy.
                </p>
              </div>

              <div className="space-y-6">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">1</span>
                    Setup Environment
                  </div>
                  <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm group relative">
                    <button 
                      onClick={() => copyToClipboard("pip install moviepy openai-whisper torch")}
                      className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <code className="text-emerald-400">$ pip install moviepy openai-whisper torch</code>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">2</span>
                    The Processor Script
                  </div>
                  <p className="text-sm text-white/40">Save this as <code className="text-white/60">processor.py</code> in your project folder.</p>
                  <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-xs h-64 overflow-y-auto group relative">
                    <button 
                      onClick={() => copyToClipboard(`import whisper\nfrom moviepy.editor import *`)}
                      className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <pre className="text-white/60">
{`import os
from moviepy.editor import *
import whisper

def generate_video(audio_path, image_path, output_path):
    # Load audio
    audio = AudioFileClip(audio_path)
    
    # Transcribe with Whisper
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    
    # Create 9:16 background
    bg = ColorClip(size=(1080, 1920), color=(20, 20, 20)).set_duration(audio.duration)
    
    # Load and resize image (book cover)
    img = ImageClip(image_path).set_duration(audio.duration)
    img = img.resize(width=1000).set_position(('center', 400))
    
    clips = [bg, img]
    
    # Add Subtitles
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
    video.audio = audio
    video.write_videofile(output_path, fps=24, codec='libx264')

if __name__ == "__main__":
    generate_video("narration.mp3", "cover.jpg", "output.mp4")`}
                    </pre>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">3</span>
                    Run Processing
                  </div>
                  <p className="text-sm text-white/40">Place your <code className="text-white/60">narration.mp3</code> and a <code className="text-white/60">cover.jpg</code> in the same folder and run:</p>
                  <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm group relative">
                    <button 
                      onClick={() => copyToClipboard("python processor.py")}
                      className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <code className="text-emerald-400">$ python processor.py</code>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-xs text-white/20 uppercase tracking-[0.2em]">
          Powered by Gemini 2.5 Flash & Whisper AI
        </p>
      </footer>
    </div>
  );
}

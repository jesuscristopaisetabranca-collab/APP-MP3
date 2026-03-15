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
  Settings2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const VOICES = [
  { id: 'Kore', name: 'Kore', desc: 'Professional & Clear', gender: 'Female' },
  { id: 'Puck', name: 'Puck', desc: 'Energetic & Bright', gender: 'Male' },
  { id: 'Charon', name: 'Charon', desc: 'Deep & Authoritative', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Classic Narrator', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Soft & Intimate', gender: 'Female' },
];

export default function App() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'export'>('editor');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const sanitizeText = () => {
    let cleaned = text
      .replace(/([^\.\!\?\n])\n([a-z])/g, '$1 $2')
      .replace(/(\w)-\n(\w)/g, '$1$2')
      .replace(/^\d+$/gm, '')
      .replace(/Page \d+/gi, '')
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
    <div className="min-h-screen bg-[#050505] text-[#f0f0f0] font-sans selection:bg-emerald-500/40">
      {/* Editorial Hero Section */}
      <section className="relative h-[60vh] flex flex-col justify-end px-6 pb-12 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover grayscale"
            alt="Library background"
          />
        </div>
        
        <div className="max-w-7xl mx-auto w-full relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                AI Powered
              </span>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                Book to Shorts Ecosystem
              </span>
            </div>
            <h1 className="text-[12vw] lg:text-[10vw] font-black leading-[0.85] tracking-tighter uppercase mb-4">
              Lumina<span className="text-emerald-500">.</span>
            </h1>
            <p className="max-w-xl text-lg text-white/60 font-medium leading-relaxed">
              Transform literary masterpieces into captivating short-form content. Professional narration, automated processing, and cinematic subtitles.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Navigation Rail */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`text-sm font-bold uppercase tracking-widest transition-all relative py-2 ${activeTab === 'editor' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              01. Studio
              {activeTab === 'editor' && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('export')}
              className={`text-sm font-bold uppercase tracking-widest transition-all relative py-2 ${activeTab === 'export' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              02. Export & Build
              {activeTab === 'export' && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
            <span>v2.5 Flash</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>Whisper AI</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <AnimatePresence mode="wait">
          {activeTab === 'editor' ? (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-12 gap-16"
            >
              {/* Editor Section */}
              <div className="lg:col-span-8 space-y-12">
                <div className="space-y-6">
                  <div className="flex items-end justify-between border-b border-white/10 pb-4">
                    <h2 className="text-4xl font-bold tracking-tight italic font-serif">The Manuscript</h2>
                    <button 
                      onClick={sanitizeText}
                      className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-all"
                    >
                      <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Sanitize PDF Text
                    </button>
                  </div>
                  
                  <div className="relative group">
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your excerpt here. Let the AI breathe life into your words..."
                      className="w-full h-[500px] bg-transparent text-2xl font-serif leading-relaxed outline-none resize-none placeholder:text-white/5 selection:bg-emerald-500/20"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Controls Section */}
              <div className="lg:col-span-4 space-y-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Voice Selection</h3>
                    <div className="grid gap-3">
                      {VOICES.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setVoice(v.id)}
                          className={`group flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 ${
                            voice === v.id 
                              ? 'bg-emerald-500 border-emerald-500 text-black' 
                              : 'bg-white/2 border-white/5 text-white/40 hover:border-white/20'
                          }`}
                        >
                          <div className="text-left">
                            <div className="text-lg font-bold tracking-tight leading-none mb-1">{v.name}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${voice === v.id ? 'text-black/60' : 'text-white/20'}`}>
                              {v.desc}
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${voice === v.id ? 'bg-black/10 border-black/20' : 'bg-white/5 border-white/10'}`}>
                            {voice === v.id ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <button 
                      onClick={generateNarration}
                      disabled={isGenerating || !text.trim()}
                      className="w-full group relative overflow-hidden py-6 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 disabled:hover:scale-100"
                    >
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        {isGenerating ? (
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                          <>
                            <Volume2 className="w-5 h-5" />
                            Cast Voice
                          </>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    </button>

                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-sm text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                      </div>
                    )}

                    {audioUrl && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Master Audio</span>
                          <a 
                            href={audioUrl} 
                            download="narration.mp3"
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                        <audio ref={audioRef} src={audioUrl} controls className="w-full h-10 invert brightness-200 opacity-60" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="export"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-24"
            >
              {/* Step 1: Local Processor */}
              <div className="grid md:grid-cols-2 gap-16 items-start">
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Phase 01</div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9]">Local Video Engine</h2>
                  <p className="text-lg text-white/40 leading-relaxed">
                    Render cinematic 9:16 videos with synchronized subtitles using our Python-based processing engine.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">MoviePy</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">Whisper AI</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">H.264</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                        <Code2 className="w-5 h-5 text-emerald-500" />
                        Installation
                      </div>
                      <div className="bg-black p-4 rounded-xl font-mono text-xs text-emerald-400 group relative">
                        <code>pip install moviepy openai-whisper torch</code>
                        <button 
                          onClick={() => copyToClipboard("pip install moviepy openai-whisper torch")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-4 h-4 text-white/40 hover:text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                        <ArrowRight className="w-5 h-5 text-emerald-500" />
                        Run Processor
                      </div>
                      <p className="text-xs text-white/40">Place <code className="text-white/60">narration.mp3</code> and <code className="text-white/60">cover.jpg</code> in the same folder as <code className="text-white/60">processor.py</code>.</p>
                      <div className="bg-black p-4 rounded-xl font-mono text-xs text-emerald-400 group relative">
                        <code>python processor.py</code>
                        <button 
                          onClick={() => copyToClipboard("python processor.py")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-4 h-4 text-white/40 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Backend Export */}
              <div className="grid md:grid-cols-2 gap-16 items-start pt-24 border-t border-white/10">
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Phase 02</div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9]">Cloud Backend</h2>
                  <p className="text-lg text-white/40 leading-relaxed">
                    Deploy your own Flask-based API to Vercel for remote narration generation and text sanitization.
                  </p>
                  <a 
                    href="https://vercel.com/new" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500 hover:underline"
                  >
                    Deploy to Vercel <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        main.py (Flask)
                      </div>
                      <button 
                        onClick={() => copyToClipboard("# Flask code here...")}
                        className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white"
                      >
                        Copy Code
                      </button>
                    </div>
                    <div className="bg-black p-4 rounded-xl font-mono text-[10px] text-white/40 h-40 overflow-y-auto">
                      <pre>
{`from flask import Flask, request, send_file
from gtts import gTTS
import io

app = Flask(__name__)

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.json
    tts = gTTS(text=data['text'], lang='pt', tld='com.br')
    fp = io.BytesIO()
    tts.write_to_fp(fp)
    fp.seek(0)
    return send_file(fp, mimetype='audio/mpeg')`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-32 border-t border-white/10">
        <div className="grid md:grid-cols-2 gap-12 items-end">
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Lumina Ecosystem</h2>
            <p className="max-w-xs text-xs text-white/20 leading-relaxed uppercase tracking-widest">
              A complete toolchain for modern content creators. Built with precision and powered by the frontier of artificial intelligence.
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">© 2026 Lumina AI</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40">All Rights Reserved</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

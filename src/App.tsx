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
  ArrowRight,
  HelpCircle,
  Zap,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const VOICES = [
  { id: 'Kore', name: 'Kore', desc: 'Profissional e Clara', gender: 'Female' },
  { id: 'Puck', name: 'Puck', desc: 'Enérgico e Brilhante', gender: 'Male' },
  { id: 'Charon', name: 'Charon', desc: 'Profundo e Autoritário', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Narrador Clássico', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Suave e Íntimo', gender: 'Female' },
];

const BG_MUSIC_PRESETS = [
  { id: 'none', name: 'Sem Música', url: '' },
  { id: 'ambient', name: 'Piano Ambiente', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'cinematic', name: 'Cinematográfico', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'lofi', name: 'Lo-Fi Relaxante', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function App() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [bgMusicUrl, setBgMusicUrl] = useState<string>('');
  const [bgVolume, setBgVolume] = useState(0.2);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'export' | 'manual'>('editor');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement>(null);

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

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgMusicUrl(url);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current && bgMusicRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        if (bgMusicUrl) {
          bgMusicRef.current.volume = bgVolume;
          bgMusicRef.current.play();
        }
      } else {
        audioRef.current.pause();
        bgMusicRef.current.pause();
      }
    }
  };

  const generateNarration = async () => {
    if (!text.trim()) {
      setError("Por favor, insira algum texto primeiro.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      let speedInstruction = "velocidade normal";
      if (speechRate > 1.2) speedInstruction = "velocidade rápida";
      if (speechRate < 0.8) speedInstruction = "velocidade lenta";
      if (speechRate >= 0.8 && speechRate <= 1.2 && speechRate !== 1.0) speedInstruction = `velocidade levemente ${speechRate > 1.0 ? 'mais rápida' : 'mais lenta'}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Narre este trecho de livro com um tom profissional e em ${speedInstruction}: ${text}` }] }],
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
        throw new Error("Nenhum dado de áudio recebido da IA.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha ao gerar narração.");
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
                Potencializado por IA
              </span>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                Ecossistema de Livros para Shorts
              </span>
            </div>
            <h1 className="text-[12vw] lg:text-[10vw] font-black leading-[0.85] tracking-tighter uppercase mb-4">
              Lumina<span className="text-emerald-500">.</span>
            </h1>
            <p className="max-w-xl text-lg text-white/60 font-medium leading-relaxed">
              Transforme obras-primas literárias em conteúdo cativante de formato curto. Narração profissional, processamento automatizado e legendas cinematográficas.
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
              01. Estúdio
              {activeTab === 'editor' && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('export')}
              className={`text-sm font-bold uppercase tracking-widest transition-all relative py-2 ${activeTab === 'export' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              02. Exportar e Criar
              {activeTab === 'export' && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`text-sm font-bold uppercase tracking-widest transition-all relative py-2 ${activeTab === 'manual' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              03. Manual
              {activeTab === 'manual' && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
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
                    <h2 className="text-4xl font-bold tracking-tight italic font-serif">O Manuscrito</h2>
                    <button 
                      onClick={sanitizeText}
                      className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-all"
                    >
                      <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Limpar Texto de PDF
                    </button>
                  </div>
                  
                  <div className="relative group">
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Cole seu trecho aqui. Deixe a IA dar vida às suas palavras..."
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
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Seleção de Voz</h3>
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

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Velocidade da Voz</h3>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">{speechRate.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-full appearance-none accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-white/20">
                      <span>Lento</span>
                      <span>Normal</span>
                      <span>Rápido</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Música de Fundo</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {BG_MUSIC_PRESETS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setBgMusicUrl(m.url)}
                          className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                            bgMusicUrl === m.url 
                              ? 'bg-emerald-500 border-emerald-500 text-black' 
                              : 'bg-white/2 border-white/5 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleMusicUpload}
                        className="hidden" 
                        id="music-upload" 
                      />
                      <label 
                        htmlFor="music-upload"
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:border-emerald-500/50 hover:text-emerald-500 cursor-pointer transition-all"
                      >
                        <Download className="w-3 h-3 rotate-180" />
                        Upload de Trilha Personalizada
                      </label>
                    </div>

                    {bgMusicUrl && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                          <span>Volume da Música</span>
                          <span>{Math.round(bgVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01" 
                          value={bgVolume}
                          onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/5 rounded-full appearance-none accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    )}
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
                            Gerar Voz
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
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Áudio Master</span>
                          <div className="flex gap-4">
                            <button 
                              onClick={togglePlayback}
                              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-colors"
                            >
                              Prévia do Mix
                            </button>
                            <a 
                              href={audioUrl} 
                              download="narration.mp3"
                              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Baixar
                            </a>
                          </div>
                        </div>
                        <audio 
                          ref={audioRef} 
                          src={audioUrl} 
                          className="w-full h-10 invert brightness-200 opacity-60" 
                          onPlay={() => { if(bgMusicRef.current && bgMusicUrl) bgMusicRef.current.play() }}
                          onPause={() => { if(bgMusicRef.current) bgMusicRef.current.pause() }}
                          onEnded={() => { if(bgMusicRef.current) bgMusicRef.current.pause() }}
                        />
                        {bgMusicUrl && (
                          <audio 
                            ref={bgMusicRef} 
                            src={bgMusicUrl} 
                            loop 
                            className="hidden" 
                          />
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'export' ? (
            <motion.div 
              key="export"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-24"
            >
              {/* Quick Export Section */}
              {audioUrl && (
                <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Pronto para Exportar</h3>
                    <p className="text-sm text-white/40 uppercase tracking-widest">Sua narração foi processada e está pronta para o mix final.</p>
                  </div>
                  <a 
                    href={audioUrl} 
                    download="narration.mp3"
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-5 h-5" />
                    Baixar Narração (MP3)
                  </a>
                </div>
              )}

              {/* Step 1: Local Processor */}
              <div className="grid md:grid-cols-2 gap-16 items-start">
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Fase 01</div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9]">Motor de Vídeo Local</h2>
                  <p className="text-lg text-white/40 leading-relaxed">
                    Renderize vídeos cinematográficos 9:16 com legendas sincronizadas usando nosso motor de processamento em Python.
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
                        Instalação
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
                        Executar Processador
                      </div>
                      <p className="text-xs text-white/40">Coloque <code className="text-white/60">narration.mp3</code>, <code className="text-white/60">cover.jpg</code>, e o opcional <code className="text-white/60">music.mp3</code> na mesma pasta que o <code className="text-white/60">processor.py</code>.</p>
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
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Fase 02</div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9]">Backend na Nuvem</h2>
                  <p className="text-lg text-white/40 leading-relaxed">
                    Implante sua própria API baseada em Flask na Vercel para geração remota de narração e limpeza de texto.
                  </p>
                  <a 
                    href="https://vercel.com/new" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500 hover:underline"
                  >
                    Implantar na Vercel <ExternalLink className="w-4 h-4" />
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
                        onClick={() => copyToClipboard("# Código Flask aqui...")}
                        className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white"
                      >
                        Copiar Código
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
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-32"
            >
              {/* Manual Header */}
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">
                  Guia de Utilização
                </div>
                <h2 className="text-7xl font-black tracking-tighter uppercase leading-none">
                  Como eu <span className="text-emerald-500">funciono?</span>
                </h2>
                <p className="max-w-2xl mx-auto text-xl text-white/40 leading-relaxed">
                  Lumina não é apenas uma ferramenta de áudio. É um ecossistema completo desenhado para transformar textos estáticos em experiências cinematográficas para redes sociais.
                </p>
              </div>

              {/* Workflow Steps */}
              <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-6 p-8 bg-white/2 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tighter">01. O Manuscrito</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Você insere o texto bruto (de um PDF ou livro). Nossa ferramenta de "Sanitize" limpa automaticamente quebras de linha e caracteres especiais, preparando o texto para uma leitura fluida.
                  </p>
                </div>

                <div className="space-y-6 p-8 bg-white/2 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tighter">02. Alquimia de Voz</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Utilizamos modelos de IA de última geração (Gemini 2.5 Flash) para gerar narrações humanas. Você pode escolher entre diferentes timbres e adicionar trilhas sonoras que se misturam perfeitamente.
                  </p>
                </div>

                <div className="space-y-6 p-8 bg-white/2 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tighter">03. Renderização</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Com o áudio pronto, você usa nosso motor local (Python + MoviePy) para gerar o vídeo final em 9:16, com legendas automáticas sincronizadas via Whisper AI.
                  </p>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-emerald-500 rounded-[3rem] p-12 md:p-20 text-black overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <ShieldCheck className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
                      Por que usar o Lumina?
                    </h2>
                    <ul className="space-y-6">
                      <li className="flex items-start gap-4">
                        <div className="mt-1 w-5 h-5 rounded-full bg-black flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </div>
                        <p className="font-bold leading-tight">Economia de horas de edição manual de áudio e vídeo.</p>
                      </li>
                      <li className="flex items-start gap-4">
                        <div className="mt-1 w-5 h-5 rounded-full bg-black flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </div>
                        <p className="font-bold leading-tight">Narrações profissionais sem precisar de microfones ou estúdio.</p>
                      </li>
                      <li className="flex items-start gap-4">
                        <div className="mt-1 w-5 h-5 rounded-full bg-black flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </div>
                        <p className="font-bold leading-tight">Legendas automáticas precisas para maior retenção no TikTok/Reels.</p>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-black/10 backdrop-blur-md border border-black/10 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-3">
                      <Layers className="w-6 h-6" />
                      <span className="text-xs font-black uppercase tracking-widest">O que eu faço realmente?</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">
                      Eu facilito sua vida automatizando a parte técnica e chata da criação de conteúdo. Eu pego um texto que você achou interessante e entrego um áudio masterizado e as ferramentas para gerar um vídeo viral em minutos, não horas.
                    </p>
                    <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest">Status do Sistema</span>
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                        Operacional
                      </span>
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
            <h2 className="text-2xl font-black uppercase tracking-tighter">Ecossistema Lumina</h2>
            <p className="max-w-xs text-xs text-white/20 leading-relaxed uppercase tracking-widest">
              Uma cadeia de ferramentas completa para criadores de conteúdo modernos. Construída com precisão e potencializada pela fronteira da inteligência artificial.
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">© 2026 Lumina AI</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40">Todos os direitos reservados</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// useVoiceEngine.js  –  Complete voice integration for Chintu AI Assistant
// Provides: STT (Web Speech API), TTS (SpeechSynthesis), wake word detection,
//           audio waveform data, and backend AI chat integration.
import { useState, useEffect, useRef, useCallback } from 'react';

const WAKE_WORDS = ['hey chintu', 'chintu', 'hey chinto', 'hi chintu'];
const API_BASE   = 'http://localhost:8000';

// ── Emotion → TTS voice tuning ────────────────────────────────────────────────
const EMOTION_VOICE = {
  Angry:     { rate: 0.85, pitch: 0.90, volume: 0.85 },
  Sadness:   { rate: 0.80, pitch: 0.85, volume: 0.80 },
  Fear:      { rate: 0.82, pitch: 0.88, volume: 0.88 },
  Happiness: { rate: 1.05, pitch: 1.10, volume: 1.00 },
  Excited:   { rate: 1.10, pitch: 1.15, volume: 1.00 },
  Confused:  { rate: 0.90, pitch: 0.95, volume: 0.90 },
  Surprised: { rate: 1.00, pitch: 1.05, volume: 0.95 },
  Thoughtful:{ rate: 0.85, pitch: 0.92, volume: 0.85 },
  default:   { rate: 0.92, pitch: 1.00, volume: 0.95 },
};

export function useVoiceEngine() {
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript,   setTranscript]   = useState('');
  const [wakeDetected, setWakeDetected] = useState(false);
  const [waveformData, setWaveformData] = useState(new Array(32).fill(0));
  const [error,        setError]        = useState('');

  const recognitionRef  = useRef(null);
  const synthRef        = useRef(window.speechSynthesis);
  const wakeListenRef   = useRef(null);
  const voicesRef       = useRef([]);
  const waveFrameRef    = useRef(null);

  // ── Synthetic waveform (no getUserMedia needed) ──────────────────────────
  const startWaveform = useCallback((active = true) => {
    if (waveFrameRef.current) return;
    let tick = 0;
    const animate = () => {
      tick++;
      if (active) {
        const wave = Array.from({ length: 32 }, (_, i) => {
          const t = tick / 10;
          return Math.max(0.05, Math.abs(
            Math.sin(t + i * 0.4) * 0.6 + Math.sin(t * 1.7 + i * 0.3) * 0.4
          ));
        });
        setWaveformData(wave);
      }
      waveFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const stopWaveform = useCallback(() => {
    if (waveFrameRef.current) {
      cancelAnimationFrame(waveFrameRef.current);
      waveFrameRef.current = null;
    }
    setWaveformData(new Array(32).fill(0));
  }, []);

  // ── Load TTS voices ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => { voicesRef.current = synthRef.current.getVoices(); };
    load();
    synthRef.current.addEventListener('voiceschanged', load);
    return () => synthRef.current.removeEventListener('voiceschanged', load);
  }, []);

  const getBestVoice = useCallback(() => {
    const voices = voicesRef.current;
    return (
      voices.find(v => v.name.includes('Google UK English Male'))   ||
      voices.find(v => v.name.includes('Google UK English Female')) ||
      voices.find(v => v.name.includes('Microsoft David'))          ||
      voices.find(v => v.lang === 'en-GB' && !v.localService)      ||
      voices.find(v => v.lang.startsWith('en') && !v.localService) ||
      voices[0] || null
    );
  }, []);

  // ── Text-to-Speech ───────────────────────────────────────────────────────
  const speak = useCallback((text, emotion = 'default') => {
    if (!text) return;
    synthRef.current.cancel();
    const utt   = new SpeechSynthesisUtterance(text);
    const tune  = EMOTION_VOICE[emotion] || EMOTION_VOICE.default;
    const voice = getBestVoice();
    if (voice) utt.voice = voice;
    utt.rate   = tune.rate;
    utt.pitch  = tune.pitch;
    utt.volume = tune.volume;
    utt.onstart = () => { setIsSpeaking(true);  startWaveform(); };
    utt.onend   = () => { setIsSpeaking(false); stopWaveform();  };
    utt.onerror = () => { setIsSpeaking(false); stopWaveform();  };
    synthRef.current.speak(utt);
  }, [getBestVoice, startWaveform, stopWaveform]);

  const stopSpeaking = useCallback(() => {
    synthRef.current.cancel();
    setIsSpeaking(false);
    stopWaveform();
  }, [stopWaveform]);

  // ── Backend AI ───────────────────────────────────────────────────────────
  const sendToAI = useCallback(async (text, emotion) => {
    if (!text?.trim()) return null;
    setIsProcessing(true);
    try {
      const res  = await fetch(`${API_BASE}/api/assistant/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, emotion: emotion || null }),
      });
      return await res.json();
    } catch {
      return { response: "Backend not reachable. Is the Python server running?", intent: 'error' };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ── Build SpeechRecognition instance ─────────────────────────────────────
  const buildRecognition = useCallback((onResult, continuous = false) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech Recognition requires Chrome or Edge browser.');
      return null;
    }
    const r = new SR();
    r.lang            = 'en-US';
    r.continuous      = continuous;
    r.interimResults  = true;
    r.maxAlternatives = 1;
    r.onresult = onResult;
    r.onerror  = (e) => {
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Click the 🔒 icon in Chrome address bar → Allow microphone.');
      } else if (e.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (e.error !== 'aborted') {
        setError(`Voice error: ${e.error}`);
      }
    };
    return r;
  }, []);

  // ── Start one-shot command listening ─────────────────────────────────────
  const startListening = useCallback(() => {
    if (isListening) return;
    setError('');
    setTranscript('');

    const r = buildRecognition((event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText = event.results[i][0].transcript;
        }
      }
      setTranscript(finalText || interimText);
    });
    if (!r) return;

    r.onend = () => {
      setIsListening(false);
      stopWaveform();
    };

    recognitionRef.current = r;
    try {
      r.start();
      setIsListening(true);
      startWaveform();
    } catch (e) {
      setError('Could not start voice recognition. Please try again.');
    }
  }, [isListening, buildRecognition, startWaveform, stopWaveform]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    setIsListening(false);
    stopWaveform();
  }, [stopWaveform]);

  // ── Wake Word listener (continuous background) ────────────────────────────
  const startWakeWord = useCallback(() => {
    if (wakeListenRef.current) return;
    const r = buildRecognition((event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.toLowerCase().trim();
        if (WAKE_WORDS.some(w => t.includes(w))) {
          setWakeDetected(true);
          setTimeout(() => setWakeDetected(false), 3000);
        }
      }
    }, true);
    if (!r) return;

    r.onend = () => {
      // Auto-restart for continuous wake word detection
      if (wakeListenRef.current) {
        try { r.start(); } catch (_) {
          wakeListenRef.current = null;
        }
      }
    };
    r.onerror = () => {};  // silent for wake word

    wakeListenRef.current = r;
    try { r.start(); } catch (_) { wakeListenRef.current = null; }
  }, [buildRecognition]);

  const stopWakeWord = useCallback(() => {
    try { wakeListenRef.current?.stop(); } catch (_) {}
    wakeListenRef.current = null;
  }, []);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopWaveform();
      stopSpeaking();
      stopWakeWord();
      try { recognitionRef.current?.stop(); } catch (_) {}
    };
  }, [stopWaveform, stopSpeaking, stopWakeWord]);

  return {
    isListening, isSpeaking, isProcessing,
    transcript, wakeDetected, waveformData, error,
    startListening, stopListening,
    startWakeWord, stopWakeWord,
    speak, stopSpeaking, sendToAI,
    setTranscript, setError,
  };
}

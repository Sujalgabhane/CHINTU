// AssistantPanel.jsx  –  Jarvis-like AI Command Center (full rebuild)
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, Zap, Brain, Activity, ChevronRight } from 'lucide-react';
import VoiceOrb from './VoiceOrb';
import AIMessage from './AIMessage';
import SmartHomeQuick from './SmartHomeQuick';
import { useVoiceEngine } from '../hooks/useVoiceEngine';

const EMOTION_COLORS = {
  Angry:'#ff4444', Confused:'#ff9500', Excited:'#ffd700', Fear:'#cc44ff',
  Happiness:'#00e676', Sadness:'#0099ff', Surprised:'#00e5ff', Thoughtful:'#aaaaff',
  'Scanning…':'#00d4ff',
};

const QUICK_CMDS = [
  { label: 'What time is it?',    icon: '🕐' },
  { label: 'How am I feeling?',   icon: '💙' },
  { label: 'Turn on the lights',  icon: '💡' },
  { label: "What's the weather?", icon: '🌤️' },
  { label: 'Tell me a joke',      icon: '😄' },
  { label: 'System status',       icon: '📊' },
  { label: 'Play relaxing music', icon: '🎵' },
  { label: 'Lock the door',       icon: '🔒' },
];

let msgId = 0;
function makeMsg(text, type = 'ai', intent = 'chat') {
  return {
    id: ++msgId, text, type, intent,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function AssistantPanel({ emotion, hasFace, iotFeed, smartHome: extSmartHome, toggleDevice }) {
  const [messages,     setMessages]     = useState([makeMsg("Chintu AI online. I'm your emotion-aware personal assistant. Press the orb or type to begin. Try saying 'Hey Chintu'!", 'ai', 'greeting')]);
  const [input,        setInput]        = useState('');
  const [typing,       setTyping]       = useState(false);
  const [localHome,    setLocalHome]    = useState(extSmartHome || {
    livingRoomLight: true, bedroomLight: false, kitchenLight: true,
    gardenLight: false, doorLocked: true, alarmArmed: false,
    acOn: true, tvOn: false, curtainsClosed: false, sprinklers: false,
  });
  const [lastVoiceCmd, setLastVoiceCmd] = useState('');
  const [activityLog,  setActivityLog]  = useState([
    { text: 'System boot complete',  icon: '✅', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
    { text: 'Emotion engine online', icon: '🧠', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
    { text: 'Smart home synced',     icon: '🏠', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
  ]);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const lastEmotRef = useRef(null);

  const voice  = useVoiceEngine();
  const eColor = EMOTION_COLORS[emotion] || '#00d4ff';

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addMsg = useCallback((text, type = 'ai', intent = 'chat') => {
    setMessages(prev => [...prev.slice(-40), makeMsg(text, type, intent)]);
  }, []);

  const addLog = useCallback((text, icon = '⚡') => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setActivityLog(prev => [{ text, icon, time }, ...prev.slice(0, 11)]);
  }, []);

  // ── Process a command (text → backend AI → response) ─────────────────────
  const processCommand = useCallback(async (text) => {
    if (!text?.trim()) return;
    addMsg(text, 'user', 'chat');
    setInput('');
    setTyping(true);
    addLog(`Processing: "${text.slice(0, 35)}…"`, '🔄');

    const result = await voice.sendToAI(text, hasFace ? emotion : null);

    setTyping(false);
    if (!result) return;
    addMsg(result.response, 'ai', result.intent || 'chat');
    addLog(`Response: ${result.intent || 'chat'}`, '✅');

    // Handle smart home device toggle from AI
    if (result.device_key && result.device_state !== null && result.device_state !== undefined) {
      setLocalHome(prev => ({ ...prev, [result.device_key]: result.device_state }));
      toggleDevice?.(result.device_key);
      setLastVoiceCmd(result.device_key);
      setTimeout(() => setLastVoiceCmd(''), 3000);
    }

    // Speak response with emotion-tuned voice
    voice.speak(result.response, hasFace ? emotion : 'default');
  }, [addMsg, addLog, voice, emotion, hasFace, toggleDevice]);

  // ── Voice: detect when listening stops and transcript is ready ────────────
  useEffect(() => {
    if (!voice.isListening && voice.transcript) {
      processCommand(voice.transcript);
      voice.setTranscript('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.isListening]);

  // ── Wake word reaction ────────────────────────────────────────────────────
  useEffect(() => {
    if (voice.wakeDetected) {
      addMsg("Wake word detected! I'm listening, Sujal. What would you like to do?", 'wake', 'greeting');
      addLog('Wake word: "Hey Chintu" detected', '🎙️');
      voice.speak("Yes Sujal, I'm listening!", emotion);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.wakeDetected]);

  // ── Emotion-aware auto response ───────────────────────────────────────────
  useEffect(() => {
    if (!hasFace || emotion === lastEmotRef.current || !emotion || emotion === 'Scanning…') return;
    lastEmotRef.current = emotion;
    setTyping(true);
    addLog(`Emotion detected: ${emotion}`, '🧠');
    const timer = setTimeout(async () => {
      const result = await voice.sendToAI(`I am feeling ${emotion.toLowerCase()}`, emotion);
      setTyping(false);
      if (result) {
        addMsg(result.response, 'ai', 'emotional');
        voice.speak(result.response, emotion);
      }
    }, 1800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, hasFace]);

  // ── Start wake word on mount ──────────────────────────────────────────────
  useEffect(() => {
    voice.startWakeWord();
    return () => voice.stopWakeWord();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => { if (input.trim()) processCommand(input); };
  const handleQuick = (cmd) => processCommand(cmd.label);

  const handleOrbClick = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  const handleToggle = (key) => {
    setLocalHome(prev => ({ ...prev, [key]: !prev[key] }));
    toggleDevice?.(key);
    setLastVoiceCmd(key);
    setTimeout(() => setLastVoiceCmd(''), 3000);
  };

  return (
    <div className="space-y-4">

      {/* ── Row 1: Voice Orb + Activity Log ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Voice Orb Panel */}
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          {/* Emotion indicator */}
          <div className="flex items-center gap-2 self-stretch">
            <div className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: eColor, boxShadow: `0 0 6px ${eColor}` }} />
            <span className="text-xs font-orbitron tracking-widest" style={{ color: eColor }}>
              {emotion || 'SCANNING'}
            </span>
            {hasFace && (
              <span className="ml-auto text-[9px] font-mono-alt text-[#00e676] opacity-70">
                FACE DETECTED
              </span>
            )}
          </div>

          <VoiceOrb
            isListening={voice.isListening}
            isSpeaking={voice.isSpeaking}
            isProcessing={voice.isProcessing || typing}
            waveformData={voice.waveformData}
            onClick={handleOrbClick}
          />

          {/* Wake word badge */}
          <AnimatePresence>
            {voice.wakeDetected && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full wake-badge"
                style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.4)' }}
              >
                <Zap size={12} className="text-[#00e676]" />
                <span className="text-xs font-orbitron text-[#00e676] tracking-wider">HEY CHINTU!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error display */}
          {voice.error && (
            <p className="text-[10px] text-[#ff4444] text-center px-2 leading-relaxed">
              {voice.error}
            </p>
          )}

          <p className="text-[10px] text-[#445566] text-center leading-relaxed">
            {voice.isListening
              ? '🎙️ Speak now…'
              : '🖱️ Click orb to speak · or type below'}
          </p>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-2 glass-card p-4 flex flex-col" style={{ height: 280 }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-[#7c3aed]" />
            <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">AI ACTIVITY LOG</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="status-dot active" />
              <span className="text-[10px] text-[#00e676]">LIVE</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {activityLog.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 text-xs p-2 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '2px solid rgba(0,212,255,0.15)' }}
              >
                <span>{log.icon}</span>
                <span className="text-[#99aabb] flex-1">{log.text}</span>
                <span className="text-[#445566] font-mono-alt flex-shrink-0">{log.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Chat + Smart Home ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chat Window */}
        <div className="lg:col-span-2 glass-card flex flex-col" style={{ height: 440 }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(0,212,255,0.08)]">
            <Brain size={16} style={{ color: eColor }} />
            <div>
              <div className="font-orbitron font-bold text-white text-sm">CHINTU AI</div>
              <div className="flex items-center gap-1.5">
                <span className="status-dot active" />
                <span className="text-[10px] text-[#00e676]">
                  Emotion-aware · {hasFace ? `${emotion} detected` : 'No face in frame'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([makeMsg("Session reset. Fresh start! How can I help you?", 'ai', 'status')]);
                addLog('Session reset', '🔄');
              }}
              className="ml-auto p-1.5 rounded-lg text-[#445566] hover:text-[#00d4ff] transition-colors"
              title="Reset session"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {messages.map(msg => (
                <AIMessage
                  key={msg.id}
                  msg={msg}
                  emotion={emotion}
                  onSpeak={(text) => voice.speak(text, emotion)}
                  animate={true}
                />
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {(typing || voice.isProcessing) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0d1628', border: `1px solid ${eColor}44` }}>
                  <Brain size={14} style={{ color: eColor }} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center"
                  style={{ background: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={{ y: [-3, 0, -3] }}
                      transition={{ duration: 0.55, delay: i * 0.15, repeat: Infinity }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: eColor }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-[rgba(0,212,255,0.08)]">
            {/* Quick command chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              {QUICK_CMDS.map((cmd, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleQuick(cmd)}
                  className="command-chip flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,212,255,0.15)',
                    color: '#8899aa',
                  }}
                >
                  <span>{cmd.icon}</span> {cmd.label}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="assistant-input"
                value={voice.isListening ? voice.transcript : input}
                onChange={e => { if (!voice.isListening) setInput(e.target.value); }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={voice.isListening ? '🎙️ Listening — speak now…' : 'Ask Chintu anything…'}
                readOnly={voice.isListening}
                className="flex-1 bg-[#0d1628] border rounded-xl px-4 py-2.5 text-sm placeholder-[#445566] focus:outline-none transition-colors"
                style={{
                  color: voice.isListening ? '#00e676' : 'white',
                  borderColor: voice.isListening ? 'rgba(0,230,118,0.5)' : 'rgba(0,212,255,0.15)',
                  boxShadow: voice.isListening ? '0 0 10px rgba(0,230,118,0.15)' : 'none',
                }}
              />
              <motion.button
                id="send-btn"
                onClick={handleSend}
                className="btn-neon px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs"
                whileTap={{ scale: 0.93 }}
              >
                <Send size={13} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Smart Home + IoT */}
        <div className="flex flex-col gap-4">
          <SmartHomeQuick
            smartHome={localHome}
            onToggle={handleToggle}
            lastCommand={lastVoiceCmd}
          />

          {/* IoT mini feed */}
          <div className="glass-card p-4 flex-1" style={{ maxHeight: 200 }}>
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight size={13} className="text-[#7c3aed]" />
              <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">LIVE IOT</span>
            </div>
            <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 140 }}>
              {(iotFeed || []).slice(0, 5).map(evt => (
                <div key={evt.id}
                  className="text-[10px] p-2 rounded-lg leading-relaxed"
                  style={{ background: 'rgba(0,0,0,0.25)', borderLeft: '2px solid rgba(0,212,255,0.12)' }}>
                  <span className="text-[#aabbcc]">{evt.message}</span>
                  <span className="text-[#445566] ml-2">{evt.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

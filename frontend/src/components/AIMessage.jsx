// AIMessage.jsx  –  Jarvis-style chat message with typewriter animation
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Cpu, Zap, Volume2 } from 'lucide-react';

const INTENT_ICONS = {
  greeting:  '👋', time: '🕐', weather: '🌤️', joke: '😄', music: '🎵',
  reminder: '⏰', smarthome: '🏠', status: '📊', emotional: '💙',
  command: '⚡', chat: '💬', error: '⚠️',
};

const EMOTION_COLORS = {
  Angry:     '#ff4444', Confused:  '#ff9500', Excited:   '#ffd700',
  Fear:      '#cc44ff', Happiness: '#00e676', Sadness:   '#0099ff',
  Surprised: '#00e5ff', Thoughtful:'#aaaaff', 'Scanning…':'#00d4ff',
};

const TYPE_STYLES = {
  user:   { bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)', align: 'flex-row-reverse' },
  ai:     { bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', align: 'flex-row' },
  system: { bg: 'rgba(0,0,0,0.3)', border: 'rgba(0,212,255,0.08)', align: 'flex-row' },
  wake:   { bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.3)', align: 'flex-row' },
};

function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); onDone?.(); }
    }, 18);
    return () => clearInterval(id);
  }, [text]);
  return <span>{displayed}<span className="animate-pulse">▋</span></span>;
}

export default function AIMessage({ msg, emotion, onSpeak, animate = true }) {
  const [typed, setTyped] = useState(!animate || msg.type !== 'ai');
  const style  = TYPE_STYLES[msg.type] || TYPE_STYLES.ai;
  const eColor = EMOTION_COLORS[emotion] || '#00d4ff';
  const icon   = INTENT_ICONS[msg.intent] || (msg.type === 'ai' ? '🤖' : '');
  const isUser = msg.type === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-3 ${style.align}`}
    >
      {/* Avatar */}
      {!isUser ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          style={{ background: '#0d1628', border: `1px solid ${eColor}44` }}
        >
          {msg.type === 'system'
            ? <Cpu size={13} style={{ color: '#00d4ff' }} />
            : msg.type === 'wake'
            ? <Zap size={13} style={{ color: '#00e676' }} />
            : <Bot size={14} style={{ color: eColor }} />}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff22] to-[#7c3aed22] border border-[rgba(0,212,255,0.3)] flex items-center justify-center flex-shrink-0 mt-1">
          <User size={14} className="text-[#00d4ff]" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Intent badge (AI messages only) */}
        {!isUser && msg.intent && msg.intent !== 'chat' && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-orbitron tracking-wider"
            style={{ background: `${eColor}15`, color: eColor, border: `1px solid ${eColor}30` }}>
            {icon} {msg.intent?.toUpperCase()}
          </div>
        )}

        {/* Message bubble */}
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative group"
          style={{
            background: style.bg,
            borderLeft: !isUser ? `3px solid ${eColor}` : 'none',
            border: `1px solid ${style.border}`,
            borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          }}
        >
          <span className="text-[#ccd8e8]">
            {!typed && animate && msg.type === 'ai'
              ? <TypewriterText text={msg.text} onDone={() => setTyped(true)} />
              : msg.text}
          </span>

          {/* Voice replay button */}
          {msg.type === 'ai' && typed && (
            <button
              onClick={() => onSpeak?.(msg.text)}
              className="absolute -right-2 -top-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              style={{ background: '#0d1628', border: `1px solid ${eColor}44` }}
              title="Replay voice"
            >
              <Volume2 size={10} style={{ color: eColor }} />
            </button>
          )}
        </div>

        <span className="text-[10px] text-[#445566] px-1">{msg.time}</span>
      </div>
    </motion.div>
  );
}

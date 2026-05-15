// Header.jsx
import { motion } from 'framer-motion';
import { Bell, Zap, Radio, Calendar } from 'lucide-react';

const PAGE_TITLES = {
  emotion:   { title: 'Live Emotion Detection', sub: 'Real-time AI powered emotion recognition' },
  smarthome: { title: 'Smart Home Control',     sub: 'IoT device management & automation' },
  security:  { title: 'Security & Surveillance', sub: 'Real-time monitoring & threat detection' },
  analytics: { title: 'AI Analytics Dashboard', sub: 'Emotion trends & system performance' },
  assistant: { title: 'Chintu AI Assistant',    sub: 'Jarvis-like intelligent response engine' },
  system:    { title: 'System Statistics',       sub: 'Hardware & network performance metrics' },
};

export default function Header({ active, connected, emotion, notifCount, onBellClick }) {
  const page = PAGE_TITLES[active] || PAGE_TITLES.emotion;
  const now  = new Date();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[rgba(0,212,255,0.1)] flex-shrink-0">
      {/* Title */}
      <div>
        <h1 className="font-orbitron font-bold text-white text-lg tracking-wide">{page.title}</h1>
        <p className="text-xs text-[#8899aa]">{page.sub}</p>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Live emotion badge */}
        {emotion?.has_face && (
          <motion.div
            key={emotion.emotion}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.25)]"
          >
            <span className="status-dot active" />
            <span className="text-xs font-orbitron text-neon-blue tracking-wider">{emotion.emotion}</span>
            <span className="text-xs text-[#8899aa]">{(emotion.confidence * 100).toFixed(0)}%</span>
          </motion.div>
        )}

        {/* Date/time */}
        <div className="hidden md:flex items-center gap-2 text-[#8899aa] text-xs">
          <Calendar size={13} />
          <span className="font-mono-alt">{now.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}</span>
        </div>

        {/* WS status */}
        <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <Radio size={13} className={connected ? 'animate-pulse' : ''} />
          <span className="hidden sm:inline font-mono-alt">{connected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* Notifications bell */}
        <button
          onClick={onBellClick}
          className="relative p-2 rounded-lg bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.4)] transition-colors"
        >
          <Bell size={16} className="text-[#8899aa]" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>

        {/* Power indicator */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.25)]">
          <Zap size={12} className="text-[#7c3aed]" />
          <span className="text-xs text-[#7c3aed] font-mono-alt">AI ON</span>
        </div>
      </div>
    </header>
  );
}

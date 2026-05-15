// VoiceOrb.jsx  –  Animated Jarvis-like AI voice orb
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';

const STATES = {
  idle:       { label: 'STANDBY',    color: '#00d4ff', glow: 'rgba(0,212,255,0.25)' },
  listening:  { label: 'LISTENING',  color: '#00e676', glow: 'rgba(0,230,118,0.35)' },
  speaking:   { label: 'SPEAKING',   color: '#7c3aed', glow: 'rgba(124,58,237,0.4)' },
  processing: { label: 'PROCESSING', color: '#ff9500', glow: 'rgba(255,149,0,0.35)' },
};

export default function VoiceOrb({ isListening, isSpeaking, isProcessing, waveformData, onClick }) {
  const state = isListening ? 'listening' : isSpeaking ? 'speaking' : isProcessing ? 'processing' : 'idle';
  const { label, color, glow } = STATES[state];

  // Pick 16 bars from waveform data
  const bars  = waveformData ? waveformData.slice(0, 16) : new Array(16).fill(0);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Orb */}
      <motion.button
        id="voice-orb-btn"
        onClick={onClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none"
        style={{ width: 160, height: 160 }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.04 }}
        animate={{ boxShadow: [`0 0 30px ${glow}`, `0 0 60px ${glow}`, `0 0 30px ${glow}`] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color, opacity: 0.4 }}
          animate={isListening || isSpeaking
            ? { rotate: 360, borderColor: [color, '#ffffff', color] }
            : { rotate: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Second ring */}
        <motion.div
          className="absolute rounded-full border"
          style={{ inset: 10, borderColor: color, opacity: 0.2 }}
          animate={state !== 'idle'
            ? { scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }
            : { scale: 1 }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />

        {/* Core gradient background */}
        <motion.div
          className="absolute rounded-full"
          style={{ inset: 14 }}
          animate={{
            background: [
              `radial-gradient(circle, ${color}33, #020712)`,
              `radial-gradient(circle, ${color}55, #020712)`,
              `radial-gradient(circle, ${color}33, #020712)`,
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Waveform bars overlay (listening & speaking) */}
        <AnimatePresence>
          {(isListening || isSpeaking) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-0.5"
              style={{ borderRadius: '50%', overflow: 'hidden', padding: '40px 30px' }}
            >
              {bars.map((v, i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{ width: 3, backgroundColor: color, minHeight: 4 }}
                  animate={{ height: Math.max(4, v * 50) }}
                  transition={{ duration: 0.08, ease: 'linear' }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center icon */}
        <div className="relative z-10 flex items-center justify-center" style={{ color }}>
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div key="proc" initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}>
                <Loader2 size={32} />
              </motion.div>
            ) : isSpeaking ? (
              <motion.div key="speak" initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}>
                <Volume2 size={32} />
              </motion.div>
            ) : isListening ? (
              <motion.div key="listen" initial={{ scale: 0 }} animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}>
                <Mic size={32} />
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Mic size={28} style={{ opacity: 0.7 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ripple effect (speaking) */}
        <AnimatePresence>
          {isSpeaking && [0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{ borderColor: color, opacity: 0 }}
              initial={{ inset: 0, opacity: 0.6 }}
              animate={{ inset: -30 - i * 20, opacity: 0 }}
              transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </motion.button>

      {/* State label */}
      <motion.div
        className="font-orbitron text-xs tracking-widest"
        style={{ color }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ◉ {label}
      </motion.div>
    </div>
  );
}

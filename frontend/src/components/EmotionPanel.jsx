// EmotionPanel.jsx – Real webcam + emotion detection panel
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Wifi, WifiOff, Activity, Brain } from 'lucide-react';

const EMOTION_META = {
  Angry:     { emoji: '😠', color: '#ff4444', bg: 'rgba(255,68,68,0.1)',    label: 'ANGRY' },
  Confused:  { emoji: '😕', color: '#ff9500', bg: 'rgba(255,149,0,0.1)',   label: 'CONFUSED' },
  Excited:   { emoji: '🤩', color: '#ffd700', bg: 'rgba(255,215,0,0.1)',   label: 'EXCITED' },
  Fear:      { emoji: '😨', color: '#cc44ff', bg: 'rgba(204,68,255,0.1)',  label: 'FEAR' },
  Happiness: { emoji: '😊', color: '#00e676', bg: 'rgba(0,230,118,0.1)',   label: 'HAPPINESS' },
  Sadness:   { emoji: '😢', color: '#0099ff', bg: 'rgba(0,153,255,0.1)',   label: 'SADNESS' },
  Surprised: { emoji: '😲', color: '#00e5ff', bg: 'rgba(0,229,255,0.1)',   label: 'SURPRISED' },
  Thoughtful:{ emoji: '🤔', color: '#aaaaff', bg: 'rgba(170,170,255,0.1)', label: 'THOUGHTFUL' },
  'Scanning…':{ emoji: '🔍', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)',  label: 'SCANNING' },
};

function EmotionBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono-alt text-[#8899aa] w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-[#0d1628] rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[10px] font-mono-alt w-8 text-right" style={{ color }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function EmotionPanel({ data, connected }) {
  const meta = EMOTION_META[data.emotion] || EMOTION_META['Scanning…'];
  const prevEmotionRef = useRef(data.emotion);
  const [emotionChanged, setEmotionChanged] = useState(false);

  useEffect(() => {
    if (data.emotion !== prevEmotionRef.current) {
      prevEmotionRef.current = data.emotion;
      setEmotionChanged(true);
      const t = setTimeout(() => setEmotionChanged(false), 800);
      return () => clearTimeout(t);
    }
  }, [data.emotion]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Webcam Feed */}
      <div className="xl:col-span-2 glass-card p-4 flex flex-col gap-4">
        {/* Panel header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-neon-blue" />
            <span className="font-orbitron text-sm text-white tracking-wider">LIVE FEED</span>
            <span className="text-[10px] text-[#8899aa] ml-2">Webcam · Real-time</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono-alt text-[#8899aa]">
              {data.fps.toFixed ? data.fps.toFixed(1) : '—'} FPS
            </span>
            {connected
              ? <div className="flex items-center gap-1 text-green-400"><Wifi size={12} /><span className="text-[10px]">CONNECTED</span></div>
              : <div className="flex items-center gap-1 text-red-400"><WifiOff size={12} /><span className="text-[10px]">OFFLINE</span></div>
            }
          </div>
        </div>

        {/* Video frame */}
        <div className="webcam-container relative flex-1" style={{ minHeight: 360 }}>
          {data.frame_b64 ? (
            <img
              src={`data:image/jpeg;base64,${data.frame_b64}`}
              alt="Webcam feed"
              className="w-full h-full object-cover"
              style={{ minHeight: 360 }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#445566]" style={{ minHeight: 360 }}>
              <div className="scan-overlay" />
              <Camera size={48} className="mb-3 opacity-30" />
              <p className="text-sm font-orbitron tracking-widest opacity-50">
                {connected ? 'INITIALIZING CAMERA…' : 'BACKEND OFFLINE'}
              </p>
              <p className="text-xs mt-2 opacity-30">
                {connected ? 'Loading model…' : 'Start the Python backend to enable live feed'}
              </p>
            </div>
          )}

          {/* Face detection overlay indicator */}
          {data.has_face && (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-[rgba(0,230,118,0.15)] border border-[rgba(0,230,118,0.4)] rounded-full px-2.5 py-1"
            >
              <span className="status-dot active" />
              <span className="text-[10px] text-green-400 font-orbitron">FACE LOCKED</span>
            </motion.div>
          )}

          {/* Scanning indicator */}
          {!data.has_face && connected && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.25)] rounded-full px-2.5 py-1">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="status-dot"
                style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }}
              />
              <span className="text-[10px] text-neon-blue font-orbitron">SCANNING</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: emotion + bars */}
      <div className="flex flex-col gap-4">
        {/* Current Emotion */}
        <div className="glass-card p-5 flex flex-col items-center gap-4">
          <div className="text-[10px] text-[#8899aa] uppercase tracking-widest font-orbitron">Detected Emotion</div>

          <AnimatePresence mode="wait">
            <motion.div
              key={data.emotion}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-6xl"
            >
              {meta.emoji}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={data.emotion + '-label'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="emotion-badge text-sm"
              style={{ color: meta.color, borderColor: meta.color, background: meta.bg }}
            >
              <Brain size={12} />
              {meta.label}
            </motion.div>
          </AnimatePresence>

          {/* Confidence */}
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#8899aa]">Confidence</span>
              <span className="font-mono-alt" style={{ color: meta.color }}>
                {(data.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-[#0d1628] rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${data.confidence * 100}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${meta.color}aa, ${meta.color})` }}
              />
            </div>
          </div>

          {/* Face status */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`status-dot ${data.has_face ? 'active' : 'inactive'}`} />
            <span className="text-[#8899aa]">{data.has_face ? 'Face Detected' : 'No Face in Frame'}</span>
          </div>
        </div>

        {/* Probability Bars */}
        <div className="glass-card p-4 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-neon-blue" />
            <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">EMOTION BREAKDOWN</span>
          </div>
          <div className="space-y-2.5">
            {Object.entries(data.probs || {}).map(([label, val]) => (
              <EmotionBar
                key={label}
                label={label}
                value={val}
                color={(EMOTION_META[label] || {}).color || '#00d4ff'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

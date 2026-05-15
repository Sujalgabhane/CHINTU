// ChintuResponse.jsx – AI response engine based on detected emotion
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Star, AlertTriangle, Heart, Moon, Lightbulb, Focus } from 'lucide-react';

const EMOTION_ACTIONS = {
  Angry: {
    icon: '😠', color: '#ff4444', mode: 'CALM RESPONSE MODE',
    actions: ['Relaxation mode activated', 'Smart lights → Cool Blue 6500K', 'Stress monitoring initiated', 'Soft ambient music queued'],
    message: 'Stress detected. Activating calming environment. Blue light therapy enabled. Take a deep breath.',
    Icon: Moon, bg: 'rgba(255,68,68,0.08)',
  },
  Confused: {
    icon: '😕', color: '#ff9500', mode: 'AI GUIDANCE MODE',
    actions: ['Context assistant enabled', 'Helpful tips displayed', 'Voice guidance activated', 'FAQ mode triggered'],
    message: 'Confusion detected. AI guidance assistant activated. Need help? I\'m here to assist.',
    Icon: Lightbulb, bg: 'rgba(255,149,0,0.08)',
  },
  Excited: {
    icon: '🤩', color: '#ffd700', mode: 'CELEBRATION MODE',
    actions: ['Dynamic lighting effect ON', 'Positive reinforcement active', 'Energy boost settings applied', 'Upbeat music activated'],
    message: 'Excitement detected! Celebration mode enabled. Dynamic ambient lighting activated. Let\'s go!',
    Icon: Star, bg: 'rgba(255,215,0,0.08)',
  },
  Fear: {
    icon: '😨', color: '#cc44ff', mode: 'EMERGENCY SAFETY MODE',
    actions: ['Emergency protocol initiated', 'Surveillance sensitivity ↑', 'All cameras active', 'Safety alert broadcast'],
    message: 'Fear detected. Emergency safety mode activated. All security systems on high alert.',
    Icon: Shield, bg: 'rgba(204,68,255,0.08)',
  },
  Happiness: {
    icon: '😊', color: '#00e676', mode: 'FRIENDLY MODE',
    actions: ['Comfort automation ON', 'Positive AI interaction active', 'Warm ambient lighting set', 'Favourite playlist queued'],
    message: 'Happiness detected! Optimizing comfort settings. Warm lighting enabled. Great to see you smiling!',
    Icon: Heart, bg: 'rgba(0,230,118,0.08)',
  },
  Sadness: {
    icon: '😢', color: '#0099ff', mode: 'WELLNESS SUPPORT MODE',
    actions: ['Motivational content queued', 'Relaxing environment ON', 'Soft lighting enabled', 'Support resources available'],
    message: 'Sadness detected. Wellness support mode activated. Motivational content and soothing music enabled.',
    Icon: Heart, bg: 'rgba(0,153,255,0.08)',
  },
  Surprised: {
    icon: '😲', color: '#00e5ff', mode: 'ADAPTIVE LEARNING MODE',
    actions: ['Attention monitoring ON', 'Contextual analysis started', 'Event logging active', 'Alert status raised'],
    message: 'Surprise detected. Adaptive learning mode triggered. Monitoring context and logging event.',
    Icon: Zap, bg: 'rgba(0,229,255,0.08)',
  },
  Thoughtful: {
    icon: '🤔', color: '#aaaaff', mode: 'FOCUS MODE',
    actions: ['Notifications minimized', 'Productivity env enabled', 'Focus lighting set', 'Do Not Disturb ON'],
    message: 'Focus mode enabled. Notifications minimized. Productivity environment activated. Deep work mode on.',
    Icon: Focus, bg: 'rgba(170,170,255,0.08)',
  },
  'Scanning…': {
    icon: '🔍', color: '#00d4ff', mode: 'SCANNING',
    actions: ['Face detection active', 'Awaiting emotion signal', 'Systems ready', 'AI model loaded'],
    message: 'Chintu is watching… Face the camera to begin emotion detection.',
    Icon: Zap, bg: 'rgba(0,212,255,0.05)',
  },
};

export default function ChintuResponse({ emotion, hasFace }) {
  const cfg = EMOTION_ACTIONS[emotion] || EMOTION_ACTIONS['Scanning…'];
  const { Icon } = cfg;
  const [tick, setTick] = useState(0);

  // Cycle action items slowly
  useEffect(() => {
    const t = setInterval(() => setTick(p => (p + 1) % cfg.actions.length), 6000);
    return () => clearInterval(t);
  }, [emotion, cfg.actions.length]);

  return (
    <div className="space-y-4">
      {/* Mode Header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="glass-card p-5"
          style={{ borderColor: `${cfg.color}44`, background: cfg.bg }}
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0">{cfg.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color: cfg.color }} />
                <span className="font-orbitron text-xs font-bold tracking-widest" style={{ color: cfg.color }}>
                  {cfg.mode}
                </span>
              </div>
              <p className="text-sm text-[#ccddee] leading-relaxed">{cfg.message}</p>
            </div>
          </div>

          {/* Action items */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {cfg.actions.map((action, i) => (
              <motion.div
                key={action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] rounded-lg px-3 py-2"
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }} />
                <span className="text-xs text-[#aabbcc]">{action}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Animated Active Action */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Zap size={14} className="text-neon-blue" />
          </motion.div>
          <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">EXECUTING ACTION</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tick}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="ai-message rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.color }} />
              <span className="text-sm text-[#ccddee]">{cfg.actions[tick]}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

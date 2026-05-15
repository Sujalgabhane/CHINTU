// SmartHomeQuick.jsx  –  Voice-controllable quick smart home control panel
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Lightbulb, Wind, Lock, Unlock, Shield, ShieldOff,
  Tv2, Thermometer, Droplets, Sun,
} from 'lucide-react';

const DEVICES = [
  { key: 'livingRoomLight', label: 'Living Room', icon: Lightbulb, color: '#ffd700', voiceKeys: ['living room light', 'main light'] },
  { key: 'bedroomLight',    label: 'Bedroom',     icon: Lightbulb, color: '#00d4ff', voiceKeys: ['bedroom light'] },
  { key: 'kitchenLight',   label: 'Kitchen',     icon: Lightbulb, color: '#ff9500', voiceKeys: ['kitchen light'] },
  { key: 'gardenLight',    label: 'Garden',      icon: Sun,       color: '#00e676', voiceKeys: ['garden light'] },
  { key: 'acOn',           label: 'A/C',         icon: Wind,      color: '#00d4ff', voiceKeys: ['ac', 'air conditioning'] },
  { key: 'tvOn',           label: 'Smart TV',    icon: Tv2,       color: '#7c3aed', voiceKeys: ['tv', 'television'] },
  { key: 'doorLocked',     label: 'Door Lock',   icon: Lock,      color: '#ff4444', voiceKeys: ['door', 'lock'] },
  { key: 'alarmArmed',     label: 'Security',    icon: Shield,    color: '#ff9500', voiceKeys: ['alarm', 'security'] },
  { key: 'sprinklers',     label: 'Sprinklers',  icon: Droplets,  color: '#00e5ff', voiceKeys: ['sprinkler', 'sprinklers'] },
];

export default function SmartHomeQuick({ smartHome, onToggle, lastCommand }) {
  const [feedback, setFeedback] = useState(null);

  const handleToggle = (key) => {
    onToggle(key);
    setFeedback(key);
    setTimeout(() => setFeedback(null), 1200);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
        <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">SMART HOME QUICK CONTROL</span>
        {lastCommand && (
          <motion.span
            key={lastCommand}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="ml-auto text-[9px] font-mono-alt text-[#00e676] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)' }}
          >
            ⚡ VOICE CMD
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DEVICES.map(({ key, label, icon: Icon, color }) => {
          const isOn    = !!smartHome[key];
          const isFlash = feedback === key;
          return (
            <motion.button
              key={key}
              id={`smart-${key}`}
              onClick={() => handleToggle(key)}
              className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all cursor-pointer"
              style={{
                background: isOn ? `${color}18` : 'rgba(0,0,0,0.25)',
                border: `1px solid ${isOn ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isOn ? `0 0 12px ${color}25` : 'none',
              }}
              whileTap={{ scale: 0.93 }}
              animate={isFlash ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={isOn ? { filter: `drop-shadow(0 0 6px ${color})` } : { filter: 'none' }}
              >
                <Icon size={18} style={{ color: isOn ? color : '#445566' }} />
              </motion.div>
              <span className="text-[10px] font-medium leading-tight text-center"
                style={{ color: isOn ? color : '#667788' }}>
                {label}
              </span>
              {/* On/off pill */}
              <span className="text-[8px] font-orbitron tracking-wider px-1.5 py-0.5 rounded-full"
                style={{
                  background: isOn ? `${color}22` : 'rgba(0,0,0,0.3)',
                  color: isOn ? color : '#445566',
                  border: `1px solid ${isOn ? color + '44' : 'rgba(255,255,255,0.05)'}`,
                }}>
                {isOn ? 'ON' : 'OFF'}
              </span>

              {/* Flash feedback overlay */}
              <AnimatePresence>
                {isFlash && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ background: color }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

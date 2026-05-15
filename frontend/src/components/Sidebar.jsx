// Sidebar.jsx
import { motion } from 'framer-motion';
import {
  Brain, Home, Shield, BarChart2, MessageSquare,
  Activity, Bell, Settings, Cpu, Wifi, ChevronRight
} from 'lucide-react';

const NAV = [
  { id: 'emotion',   icon: Brain,       label: 'Emotion AI' },
  { id: 'smarthome', icon: Home,        label: 'Smart Home' },
  { id: 'security',  icon: Shield,      label: 'Security' },
  { id: 'analytics', icon: BarChart2,   label: 'Analytics' },
  { id: 'assistant', icon: MessageSquare, label: 'AI Assistant' },
  { id: 'system',    icon: Activity,    label: 'System Stats' },
];

export default function Sidebar({ active, setActive, notifications }) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(0,212,255,0.1)]">
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff22] to-[#7c3aed22] border border-[#00d4ff44] flex items-center justify-center">
            <Cpu size={20} className="text-neon-blue" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-white text-sm tracking-wider">CHINTU</div>
            <div className="text-[10px] text-[#8899aa] tracking-widest uppercase">AI Robot v2.0</div>
          </div>
        </motion.div>

        {/* Status */}
        <div className="mt-4 flex items-center gap-2 bg-[rgba(0,230,118,0.08)] border border-[rgba(0,230,118,0.2)] rounded-lg px-3 py-2">
          <span className="status-dot active" />
          <span className="text-xs text-green-400 font-mono-alt">SYSTEM ONLINE</span>
          <Wifi size={12} className="text-green-400 ml-auto" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] text-[#445566] uppercase tracking-widest mb-3 px-2">Navigation</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => setActive(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              className={`sidebar-item w-full text-left ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
              {item.id === 'assistant' && notifications > 0 && (
                <span className="ml-auto bg-[#ff4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {notifications}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="p-4 border-t border-[rgba(0,212,255,0.1)]">
        <div className="glass-card p-3 space-y-1">
          <div className="text-[10px] text-[#8899aa] uppercase tracking-widest">Project</div>
          <div className="text-xs text-[#ccddee] font-medium leading-tight">
            Emotion Aware Smart Home & Surveillance Robot
          </div>
          <div className="text-[10px] text-[#00d4ff] font-mono-alt mt-1">Final Year Demo</div>
        </div>
      </div>
    </aside>
  );
}

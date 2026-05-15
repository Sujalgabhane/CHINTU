// SecurityPanel.jsx – Surveillance & Security (DEMO)
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Camera, AlertTriangle, Activity, Eye, Crosshair } from 'lucide-react';

const SEVERITY_STYLE = {
  high:   { color: '#ff4444', bg: 'rgba(255,68,68,0.08)',   label: 'HIGH' },
  medium: { color: '#ff9500', bg: 'rgba(255,149,0,0.08)',  label: 'MED' },
  low:    { color: '#00d4ff', bg: 'rgba(0,212,255,0.05)',  label: 'LOW' },
};

function ThreatGauge({ level }) {
  const angle = (level / 100) * 180;
  const color = level > 70 ? '#ff4444' : level > 40 ? '#ff9500' : '#00e676';
  const r = 50, cx = 70, cy = 70;
  const x = cx + r * Math.cos(((180 + angle) * Math.PI) / 180);
  const y = cy + r * Math.sin(((180 + angle) * Math.PI) / 180);

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M20,70 A50,50 0 0,1 120,70" fill="none" stroke="#1a2d4d" strokeWidth="8" strokeLinecap="round" />
        <path d={`M20,70 A50,50 0 0,1 ${x},${y}`} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <text x="70" y="62" textAnchor="middle" fill={color} fontSize="18" fontFamily="Orbitron" fontWeight="bold">{level}</text>
        <text x="70" y="78" textAnchor="middle" fill="#8899aa" fontSize="9" fontFamily="Orbitron">THREAT LEVEL</text>
      </svg>
    </div>
  );
}

function CameraFeed({ id, active }) {
  return (
    <div className="camera-tile">
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030810]">
        {active ? (
          <>
            <div className="scan-overlay" />
            <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              className="text-[#00d4ff22] text-5xl absolute">⬡</motion.div>
            <Camera size={24} className="text-[#00d4ff44] z-10" />
            <span className="text-[10px] font-mono-alt text-[#00d4ff66] mt-1 z-10">{id} · LIVE</span>
          </>
        ) : (
          <>
            <Camera size={20} className="text-[#33445566]" />
            <span className="text-[10px] text-[#33445566] mt-1">{id} · OFFLINE</span>
          </>
        )}
      </div>
      {active && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[9px] text-red-400 font-mono-alt">REC</span>
        </div>
      )}
    </div>
  );
}

export default function SecurityPanel({ logs }) {
  const [threatLevel, setThreatLevel] = useState(28);
  const [displayLogs, setDisplayLogs] = useState(logs.slice(0, 8));

  useEffect(() => {
    setDisplayLogs(logs.slice(0, 8));
    if (logs.length > 0) {
      const highCount = logs.filter(l => l.severity === 'high').length;
      setThreatLevel(Math.min(95, 20 + highCount * 15 + Math.random() * 10));
    }
  }, [logs]);

  // Periodically bump threat level
  useEffect(() => {
    const t = setInterval(() => {
      setThreatLevel(prev => {
        const delta = (Math.random() - 0.5) * 8;
        return Math.max(10, Math.min(90, prev + delta));
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cameras Active', value: '5/6', color: '#00e676', icon: Camera },
          { label: 'Motion Events', value: '23',   color: '#ff9500', icon: Activity },
          { label: 'Alerts Today',  value: '7',    color: '#ff4444', icon: AlertTriangle },
          { label: 'Zones Covered', value: '12',   color: '#00d4ff', icon: Eye },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon size={14} style={{ color }} />
              <span className="text-[10px] text-[#8899aa] uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-orbitron text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera grid */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={14} className="text-neon-blue" />
            <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">SURVEILLANCE FEEDS</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[['CAM-01', true], ['CAM-02', true], ['CAM-03', true], ['CAM-04', true], ['CAM-05', true], ['CAM-06', false]].map(([id, active]) => (
              <CameraFeed key={id} id={id} active={active} />
            ))}
          </div>
        </div>

        {/* Threat gauge + motion */}
        <div className="flex flex-col gap-4">
          <div className="glass-card p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 self-start">
              <Crosshair size={14} className="text-neon-red" />
              <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">THREAT ANALYSIS</span>
            </div>
            <ThreatGauge level={Math.round(threatLevel)} />
            <div className="mt-2 text-xs text-[#8899aa] text-center">
              {threatLevel < 30 ? 'All clear – nominal' : threatLevel < 60 ? 'Moderate activity detected' : 'Elevated threat – monitoring closely'}
            </div>
          </div>

          {/* Motion sensors */}
          <div className="glass-card p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-neon-orange" />
              <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">MOTION SENSORS</span>
            </div>
            <div className="space-y-2">
              {[
                ['Front Door',    true,  '#00e676'],
                ['Back Garden',   false, '#00d4ff'],
                ['Hallway',       true,  '#00e676'],
                ['Garage',        false, '#00d4ff'],
                ['Living Room',   true,  '#00e676'],
              ].map(([zone, active, color]) => (
                <div key={zone} className="flex items-center justify-between text-xs">
                  <span className="text-[#aabbcc]">{zone}</span>
                  <div className="flex items-center gap-2">
                    {active && <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-[10px]" style={{ color }}>● ACTIVE</motion.span>}
                    {!active && <span className="text-[10px] text-[#445566]">● IDLE</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Log */}
        <div className="glass-card p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-neon-purple" />
            <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">SECURITY LOG</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: 380 }}>
            <AnimatePresence>
              {displayLogs.map((log) => {
                const sev = SEVERITY_STYLE[log.severity] || SEVERITY_STYLE.low;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="rounded-lg p-3 text-xs"
                    style={{ background: sev.bg, border: `1px solid ${sev.color}22` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#ccddee] leading-relaxed">{log.message}</span>
                      <span className="text-[10px] font-orbitron flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ color: sev.color, background: `${sev.color}15` }}>{sev.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#445566]">{log.camera}</span>
                      <span className="text-[#445566]">·</span>
                      <span className="text-[#445566]">{log.timestamp}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// SystemStats.jsx – Hardware & Performance Metrics (DEMO)
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Wifi, Battery, Thermometer, Server, Clock } from 'lucide-react';

function CircularGauge({ value, max = 100, color, label, unit = '%', size = 110 }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const pct = Math.min(value / max, 1);
  const dash = C * pct;
  const gap  = C - dash;

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          {/* Background ring */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="#0d1628" strokeWidth="8" />
          {/* Value ring */}
          <motion.circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${C}`}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - dash }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
          {/* Value text */}
          <text x="50" y="46" textAnchor="middle" fill={color}
            fontSize="16" fontFamily="Orbitron" fontWeight="bold">
            {Math.round(value)}
          </text>
          <text x="50" y="60" textAnchor="middle" fill="#8899aa" fontSize="9" fontFamily="Inter">
            {unit}
          </text>
        </svg>
      </div>
      <span className="text-xs text-[#8899aa] font-orbitron tracking-wider text-center">{label}</span>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color = '#00d4ff', sub }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[rgba(0,212,255,0.06)] last:border-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}11`, border: `1px solid ${color}33` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="text-xs text-[#8899aa]">{label}</div>
        {sub && <div className="text-[10px] text-[#445566]">{sub}</div>}
      </div>
      <div className="font-mono-alt text-sm font-medium" style={{ color }}>{value}</div>
    </div>
  );
}

export default function SystemStats({ stats }) {
  const s = {
    cpu: 42, memory: 61, battery: 83, temperature: 54,
    network_up: 2.4, network_dn: 14.7, uptime_hrs: 6.2, gpu_usage: 38, disk_usage: 57,
    ...stats,
  };

  return (
    <div className="space-y-6">
      {/* Circular gauges */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Server size={14} className="text-neon-blue" />
          <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">PERFORMANCE OVERVIEW</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
          <CircularGauge value={s.cpu}         label="CPU USAGE"   color="#00d4ff" />
          <CircularGauge value={s.memory}      label="MEMORY"      color="#7c3aed" />
          <CircularGauge value={s.gpu_usage}   label="GPU USAGE"   color="#ff9500" />
          <CircularGauge value={s.disk_usage}  label="DISK USAGE"  color="#00e676" />
          <CircularGauge value={s.battery}     label="BATTERY"     color="#ffd700" />
        </div>
      </div>

      {/* Detailed stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-neon-blue" />
            <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">HARDWARE STATUS</span>
          </div>
          <div>
            <StatRow icon={Thermometer} label="CPU Temperature" sub="Intel Core i7"   value={`${s.temperature.toFixed ? s.temperature.toFixed(0) : s.temperature}°C`} color="#ff9500" />
            <StatRow icon={Battery}     label="Battery Level"   sub="Charging normal" value={`${s.battery.toFixed ? s.battery.toFixed(0) : s.battery}%`}             color="#00e676" />
            <StatRow icon={HardDrive}   label="Disk Usage"      sub="SSD / 512GB"     value={`${s.disk_usage}%`}      color="#7c3aed" />
            <StatRow icon={Clock}       label="System Uptime"   sub="Since last boot" value={`${s.uptime_hrs}h`}     color="#00d4ff" />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={14} className="text-neon-green" />
            <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">NETWORK & AI</span>
          </div>
          <div>
            <StatRow icon={Wifi}   label="Upload Speed"   sub="Wi-Fi 6 connected"  value={`${s.network_up} MB/s`}   color="#00e676" />
            <StatRow icon={Wifi}   label="Download Speed" sub="5 GHz band"          value={`${s.network_dn} MB/s`}  color="#00d4ff" />
            <StatRow icon={Cpu}    label="AI Model"       sub="MobileNetV2 · 12MB" value="ACTIVE"                    color="#7c3aed" />
            <StatRow icon={Server} label="Backend API"    sub="FastAPI · localhost" value="ONLINE"                   color="#00e676" />
          </div>

          {/* Chintu robot battery */}
          <div className="mt-4 p-3 rounded-xl bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8899aa]">🤖 Chintu Robot Battery</span>
              <span className="text-xs font-orbitron text-neon-blue">78%</span>
            </div>
            <div className="h-2 bg-[#0d1628] rounded-full overflow-hidden">
              <motion.div
                animate={{ width: '78%' }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00d4ff, #00e676)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

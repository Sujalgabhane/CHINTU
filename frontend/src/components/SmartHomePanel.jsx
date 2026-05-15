// SmartHomePanel.jsx – Interactive Smart Home Controls (DEMO)
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Wind, Lock, Bell, Tv, Thermometer,
         Droplets, Sun, AlertTriangle, Power, Sliders } from 'lucide-react';

function Toggle({ on, onToggle, label }) {
  return (
    <button onClick={onToggle} className="flex items-center justify-between w-full">
      <span className="text-xs text-[#aabbcc]">{label}</span>
      <div className={`toggle-track ${on ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </button>
  );
}

function DeviceCard({ icon: Icon, title, on, onToggle, children, color = '#00d4ff' }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="glass-card p-4 flex flex-col gap-3"
      style={{ borderColor: on ? `${color}44` : undefined }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: on ? `${color}22` : '#0d1628', border: `1px solid ${on ? color + '44' : '#1a2d4d'}` }}>
            <Icon size={16} style={{ color: on ? color : '#556677' }} />
          </div>
          <div>
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="text-[10px]" style={{ color: on ? color : '#556677' }}>
              {on ? 'ACTIVE' : 'STANDBY'}
            </div>
          </div>
        </div>
        <button onClick={onToggle}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{ background: on ? `${color}22` : '#0d1628', border: `1px solid ${on ? color : '#333'}`, boxShadow: on ? `0 0 10px ${color}44` : 'none' }}>
          <Power size={13} style={{ color: on ? color : '#445566' }} />
        </button>
      </div>
      {children}
    </motion.div>
  );
}

function FanSpeedControl({ speed, setSpeed }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#8899aa]">Speed</span>
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onClick={() => setSpeed(s)}
            className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: s <= speed ? '#00d4ff' : '#1a2d4d', boxShadow: s <= speed ? '0 0 4px #00d4ff' : 'none' }} />
        ))}
      </div>
      <span className="text-[10px] font-mono-alt text-neon-blue">{speed}</span>
    </div>
  );
}

function TempControl({ temp, setTemp }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setTemp(t => Math.max(16, t - 1))}
        className="w-6 h-6 rounded-full bg-[#0d1628] border border-[#1a2d4d] text-[#8899aa] text-sm hover:border-neon-blue transition-colors">−</button>
      <div className="flex-1 text-center">
        <span className="font-orbitron text-xl text-neon-blue">{temp}</span>
        <span className="text-xs text-[#8899aa]">°C</span>
      </div>
      <button onClick={() => setTemp(t => Math.min(30, t + 1))}
        className="w-6 h-6 rounded-full bg-[#0d1628] border border-[#1a2d4d] text-[#8899aa] text-sm hover:border-neon-blue transition-colors">+</button>
    </div>
  );
}

export default function SmartHomePanel({ smartHome, toggleDevice, setDeviceValue }) {
  const [emergency, setEmergency] = useState(false);

  const handleEmergency = () => {
    setEmergency(true);
    setTimeout(() => setEmergency(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Emergency button */}
      <motion.button
        onClick={handleEmergency}
        animate={emergency ? { scale: [1, 1.05, 1], boxShadow: ['0 0 20px #ff4444', '0 0 50px #ff4444', '0 0 20px #ff4444'] } : {}}
        transition={{ duration: 0.5, repeat: emergency ? Infinity : 0 }}
        className="btn-neon btn-neon-red w-full py-3 flex items-center justify-center gap-3 font-orbitron text-sm"
      >
        <AlertTriangle size={18} />
        {emergency ? '⚠️ EMERGENCY PROTOCOL ACTIVATED' : 'EMERGENCY OVERRIDE'}
      </motion.button>

      {/* Lights */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sun size={14} className="text-neon-gold" />
          <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">LIGHTING CONTROL</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['livingRoomLight', 'Living Room', Lightbulb, '#ffd700'],
            ['bedroomLight',    'Bedroom',     Lightbulb, '#aaaaff'],
            ['kitchenLight',    'Kitchen',     Lightbulb, '#00e676'],
            ['gardenLight',     'Garden',      Sun,       '#ff9500'],
          ].map(([key, label, Icon, color]) => (
            <DeviceCard key={key} icon={Icon} title={label} on={smartHome[key]}
              onToggle={() => toggleDevice(key)} color={color}>
              <div className="h-1 w-full rounded-full overflow-hidden bg-[#0d1628]">
                <motion.div animate={{ width: smartHome[key] ? '80%' : '0%' }}
                  className="h-full rounded-full" style={{ background: color }} />
              </div>
            </DeviceCard>
          ))}
        </div>
      </div>

      {/* Climate + Appliances */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fan */}
        <DeviceCard icon={Wind} title="Smart Fan" on={true} onToggle={() => {}} color="#00d4ff">
          <FanSpeedControl speed={smartHome.fanSpeed}
            setSpeed={v => setDeviceValue('fanSpeed', v)} />
        </DeviceCard>

        {/* AC */}
        <DeviceCard icon={Thermometer} title="Air Conditioner" on={smartHome.acOn}
          onToggle={() => toggleDevice('acOn')} color="#00e5ff">
          <TempControl temp={smartHome.acTemp}
            setTemp={v => setDeviceValue('acTemp', typeof v === 'function' ? v(smartHome.acTemp) : v)} />
        </DeviceCard>

        {/* TV */}
        <DeviceCard icon={Tv} title="Smart TV" on={smartHome.tvOn}
          onToggle={() => toggleDevice('tvOn')} color="#7c3aed">
          <div className="text-[10px] text-[#8899aa]">{smartHome.tvOn ? 'Streaming active' : 'Off'}</div>
        </DeviceCard>

        {/* Sprinklers */}
        <DeviceCard icon={Droplets} title="Sprinklers" on={smartHome.sprinklers}
          onToggle={() => toggleDevice('sprinklers')} color="#0099ff">
          <div className="text-[10px] text-[#8899aa]">{smartHome.sprinklers ? 'Watering active' : 'Scheduled: 06:00'}</div>
        </DeviceCard>
      </div>

      {/* Security Devices */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sliders size={14} className="text-neon-purple" />
          <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">SECURITY DEVICES</span>
        </div>
        <div className="glass-card p-4 space-y-4">
          <Toggle on={smartHome.doorLocked}  onToggle={() => toggleDevice('doorLocked')}  label="🔒 Door Lock" />
          <div className="border-t border-[rgba(0,212,255,0.08)]" />
          <Toggle on={smartHome.alarmArmed}  onToggle={() => toggleDevice('alarmArmed')}  label="🔔 Alarm System" />
          <div className="border-t border-[rgba(0,212,255,0.08)]" />
          <Toggle on={smartHome.curtainsClosed} onToggle={() => toggleDevice('curtainsClosed')} label="🪟 Curtains (Closed)" />
        </div>
      </div>
    </div>
  );
}

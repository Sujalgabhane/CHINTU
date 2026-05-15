// AnalyticsPanel.jsx – Animated Charts Dashboard (DEMO)
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart2, TrendingUp, Activity, Radio } from 'lucide-react';

const EMOTIONS = ['Angry', 'Confused', 'Excited', 'Fear', 'Happiness', 'Sadness', 'Surprised', 'Thoughtful'];
const EMOTION_COLORS = {
  Angry: '#ff4444', Confused: '#ff9500', Excited: '#ffd700', Fear: '#cc44ff',
  Happiness: '#00e676', Sadness: '#0099ff', Surprised: '#00e5ff', Thoughtful: '#aaaaff',
};

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs" style={{ border: '1px solid rgba(0,212,255,0.3)' }}>
      <div className="text-neon-blue font-orbitron mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#aabbcc]">{p.name}:</span>
          <span className="text-white">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-neon-blue" />
        <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPanel({ emotionHistory, homeUsage, stats }) {
  // Build radar data from last day's emotion history
  const lastDay = emotionHistory[emotionHistory.length - 1] || {};
  const radarData = EMOTIONS.map(e => ({ emotion: e.slice(0, 5), value: lastDay[e] || 0 }));

  // Simulated AI activity data
  const aiActivity = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    detections: Math.max(0, Math.round(20 + 30 * Math.sin((h - 8) * 0.3) + Math.random() * 10)),
    accuracy: Math.round(82 + 10 * Math.random()),
  }));

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Emotions Detected', value: '1,247', delta: '+12%', color: '#00e676' },
          { label: 'Avg Confidence',    value: '87.3%', delta: '+2.1%', color: '#00d4ff' },
          { label: 'AI Uptime',         value: '99.2%', delta: 'Stable', color: '#7c3aed' },
          { label: 'Devices Online',    value: '11/12', delta: '1 offline', color: '#ff9500' },
        ].map(({ label, value, delta, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="text-[10px] text-[#8899aa] uppercase tracking-wider mb-1">{label}</div>
            <div className="font-orbitron text-2xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-[10px]" style={{ color }}>{delta}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day emotion trend */}
        <ChartCard title="7-DAY EMOTION TRENDS" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={emotionHistory} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                {['Happiness', 'Angry', 'Excited', 'Sadness'].map(e => (
                  <linearGradient key={e} id={`grad-${e}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={EMOTION_COLORS[e]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={EMOTION_COLORS[e]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#8899aa', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              {['Happiness', 'Angry', 'Excited', 'Sadness'].map(e => (
                <Area key={e} type="monotone" dataKey={e} stroke={EMOTION_COLORS[e]}
                  fill={`url(#grad-${e})`} strokeWidth={2} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Emotion radar */}
        <ChartCard title="EMOTION DISTRIBUTION (TODAY)" icon={Activity}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="rgba(0,212,255,0.12)" />
              <PolarAngleAxis dataKey="emotion" tick={{ fill: '#8899aa', fontSize: 10 }} />
              <Radar name="Emotion" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart home usage */}
        <ChartCard title="SMART HOME USAGE (HOURLY)" icon={BarChart2}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={homeUsage.filter((_, i) => i % 2 === 0)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fill: '#8899aa', fontSize: 9 }} />
              <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="lights" fill="#ffd700" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
              <Bar dataKey="ac"     fill="#00d4ff" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
              <Bar dataKey="media"  fill="#7c3aed" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            {[['Lights', '#ffd700'], ['AC', '#00d4ff'], ['Media', '#7c3aed']].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1 text-[10px] text-[#8899aa]">
                <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>
        </ChartCard>

        {/* AI Detection Activity */}
        <ChartCard title="AI DETECTION ACTIVITY (24H)" icon={Radio}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={aiActivity.filter((_, i) => i % 2 === 0)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fill: '#8899aa', fontSize: 9 }} />
              <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Line type="monotone" dataKey="detections" stroke="#00d4ff" strokeWidth={2} dot={false}
                activeDot={{ r: 4, fill: '#00d4ff' }} />
              <Line type="monotone" dataKey="accuracy"   stroke="#00e676" strokeWidth={1.5} dot={false}
                strokeDasharray="4 2" activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            {[['Detections', '#00d4ff'], ['Accuracy %', '#00e676']].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1 text-[10px] text-[#8899aa]">
                <div className="w-3 h-0.5 rounded" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// NotificationFeed.jsx – Toast notifications overlay
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const TYPE_META = {
  alert:   { icon: AlertTriangle, color: '#ff4444', bg: 'rgba(255,68,68,0.1)' },
  warning: { icon: AlertTriangle, color: '#ff9500', bg: 'rgba(255,149,0,0.1)' },
  success: { icon: CheckCircle,   color: '#00e676', bg: 'rgba(0,230,118,0.08)' },
  info:    { icon: Info,          color: '#00d4ff', bg: 'rgba(0,212,255,0.08)' },
};

export default function NotificationFeed({ notifications, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META.info;
          const Icon = meta.icon;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 60, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="notif-toast glass-card px-4 py-3 pointer-events-auto"
              style={{ borderColor: `${meta.color}33`, background: meta.bg }}
            >
              <div className="flex items-start gap-3">
                <Icon size={16} style={{ color: meta.color }} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{n.title}</div>
                  <div className="text-xs text-[#aabbcc] mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-[#445566] mt-1 font-mono-alt">{n.time}</div>
                </div>
                <button onClick={() => onDismiss(n.id)} className="text-[#445566] hover:text-[#8899aa] transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

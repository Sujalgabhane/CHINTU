// App.jsx – Main application shell
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EmotionPanel from './components/EmotionPanel';
import ChintuResponse from './components/ChintuResponse';
import SmartHomePanel from './components/SmartHomePanel';
import SecurityPanel from './components/SecurityPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import AssistantPanel from './components/AssistantPanel';
import SystemStats from './components/SystemStats';
import NotificationFeed from './components/NotificationFeed';
import { useEmotionStream } from './hooks/useEmotionStream';
import { useDemoData } from './hooks/useDemoData';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

export default function App() {
  const [activePage, setActivePage] = useState('emotion');
  const { data: emotionData, connected } = useEmotionStream();
  const {
    security, iot, stats, emotionHistory, homeUsage,
    notifications, smartHome, toggleDevice, setDeviceValue, dismissNotification,
  } = useDemoData();

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900 holo-grid">
      {/* Sidebar */}
      <Sidebar
        active={activePage}
        setActive={setActivePage}
        notifications={notifications.length}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          active={activePage}
          connected={connected}
          emotion={emotionData}
          notifCount={notifications.length}
          onBellClick={() => setActivePage('assistant')}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              {activePage === 'emotion' && (
                <div className="space-y-6">
                  <EmotionPanel data={emotionData} connected={connected} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">⚡ CHINTU AI RESPONSE ENGINE</span>
                      </div>
                      <ChintuResponse emotion={emotionData.emotion} hasFace={emotionData.has_face} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-orbitron text-[#8899aa] tracking-widest">📊 SYSTEM STATS</span>
                      </div>
                      <SystemStats stats={stats} />
                    </div>
                  </div>
                </div>
              )}

              {activePage === 'smarthome' && (
                <SmartHomePanel
                  smartHome={smartHome}
                  toggleDevice={toggleDevice}
                  setDeviceValue={setDeviceValue}
                />
              )}

              {activePage === 'security' && (
                <SecurityPanel logs={security} />
              )}

              {activePage === 'analytics' && (
                <AnalyticsPanel
                  emotionHistory={emotionHistory}
                  homeUsage={homeUsage}
                  stats={stats}
                />
              )}

              {activePage === 'assistant' && (
                <AssistantPanel
                  emotion={emotionData.emotion}
                  hasFace={emotionData.has_face}
                  iotFeed={iot}
                  smartHome={smartHome}
                  toggleDevice={toggleDevice}
                />
              )}

              {activePage === 'system' && (
                <SystemStats stats={stats} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast notifications */}
      <NotificationFeed
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

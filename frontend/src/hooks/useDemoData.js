// useDemoData.js – Simulated live demo data hook
import { useState, useEffect, useCallback } from 'react';

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

export function useDemoData() {
  const [security, setSecurity]     = useState([]);
  const [iot, setIot]               = useState([]);
  const [stats, setStats]           = useState({});
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [homeUsage, setHomeUsage]   = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [smartHome, setSmartHome]   = useState({
    livingRoomLight: true, bedroomLight: false, kitchenLight: true,
    gardenLight: false, fanSpeed: 3, doorLocked: true, alarmArmed: false,
    acTemp: 22, acOn: true, tvOn: false, curtainsClosed: false, sprinklers: false,
  });

  const loadAll = useCallback(async () => {
    try {
      const [sec, iotData, st, eh, hu] = await Promise.all([
        fetchJSON('/api/demo/security'),
        fetchJSON('/api/demo/iot'),
        fetchJSON('/api/demo/stats'),
        fetchJSON('/api/demo/emotion-history'),
        fetchJSON('/api/demo/home-usage'),
      ]);
      setSecurity(sec);
      setIot(iotData);
      setStats(st);
      setEmotionHistory(eh);
      setHomeUsage(hu);
    } catch (_) {}
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const st = await fetchJSON('/api/demo/stats');
      setStats(st);
    } catch (_) {}
  }, []);

  const pushNotification = useCallback(async () => {
    try {
      const n = await fetchJSON('/api/demo/notification');
      // Cap at 3 notifications visible at once for a calm UI
      setNotifications(prev => [n, ...prev].slice(0, 3));
    } catch (_) {}
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const toggleDevice = useCallback((key) => {
    setSmartHome(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setDeviceValue = useCallback((key, val) => {
    setSmartHome(prev => ({ ...prev, [key]: val }));
  }, []);

  useEffect(() => {
    loadAll();
    // Slower intervals for a calm, professional feel
    const statsTimer  = setInterval(refreshStats,      10000);  // every 10 s
    const notifTimer  = setInterval(pushNotification,  40000);  // every 40 s
    const reloadTimer = setInterval(loadAll,           120000); // every 2 min
    // First notification after 10 s (not immediately)
    const firstNotif = setTimeout(pushNotification, 10000);
    return () => {
      clearInterval(statsTimer);
      clearInterval(notifTimer);
      clearInterval(reloadTimer);
      clearTimeout(firstNotif);
    };
  }, [loadAll, refreshStats, pushNotification]);

  return {
    security, iot, stats, emotionHistory, homeUsage,
    notifications, smartHome,
    toggleDevice, setDeviceValue, dismissNotification,
  };
}

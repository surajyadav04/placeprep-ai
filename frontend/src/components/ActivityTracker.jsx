import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PING_INTERVAL_MS = 60000; // 60 seconds
const INACTIVITY_THRESHOLD_MS = 60000; // 60 seconds

export default function ActivityTracker() {
  const { user } = useAuth();
  const lastActiveTime = useRef(Date.now());
  const accumulatedSeconds = useRef(0);

  useEffect(() => {
    if (!user) return;

    // List of events that indicate user activity
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    const handleActivity = () => {
      lastActiveTime.current = Date.now();
    };

    // Attach listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Tracking loop
    const trackerInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // If user interacted within the inactivity threshold, consider them active
        if (now - lastActiveTime.current < INACTIVITY_THRESHOLD_MS) {
          // Accumulate 1 second for this check (running roughly every second)
          accumulatedSeconds.current += 1;
        }
      }
    }, 1000);

    // Ping loop
    const pingInterval = setInterval(async () => {
      if (accumulatedSeconds.current > 0) {
        const secondsToPing = accumulatedSeconds.current;
        accumulatedSeconds.current = 0; // Reset eagerly

        try {
          const token = localStorage.getItem('token');
          if (token) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            await axios.post(
              `${API_URL}/api/activity/ping`,
              { seconds: secondsToPing },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
          }
        } catch (error) {
          console.error('Failed to ping activity', error);
          // If it fails, we could potentially add it back, but ignoring is safer for simple UX
        }
      }
    }, PING_INTERVAL_MS);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(trackerInterval);
      clearInterval(pingInterval);
    };
  }, [user]);

  return null; // Invisible component
}

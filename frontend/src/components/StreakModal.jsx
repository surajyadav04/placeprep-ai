import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Trophy, Clock, Calendar as CalendarIcon, Activity } from 'lucide-react';
import axios from 'axios';

export default function StreakModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      axios.get(`${API_URL}/api/activity/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setStats(res.data);
      })
      .catch(err => console.error("Failed to load stats", err))
      .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format seconds to Hh Mm
  const formatTime = (seconds) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Generate last 30 days for the calendar
  const generateCalendar = () => {
    const days = [];
    const today = new Date();
    // Start from 29 days ago
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }
    return days;
  };

  const calendarDays = generateCalendar();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-black/5 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                <Activity size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 font-display">Activity & Streaks</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Top Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <Flame size={24} className="text-orange-500 mb-2" />
                    <span className="text-3xl font-bold text-orange-600">{stats?.currentStreak || 0}</span>
                    <span className="text-xs text-orange-800 font-medium uppercase tracking-wide mt-1">Current Streak</span>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <Trophy size={24} className="text-yellow-500 mb-2" />
                    <span className="text-3xl font-bold text-yellow-600">{stats?.longestStreak || 0}</span>
                    <span className="text-xs text-yellow-800 font-medium uppercase tracking-wide mt-1">Longest Streak</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <Clock size={24} className="text-blue-500 mb-2" />
                    <span className="text-2xl font-bold text-blue-600">{formatTime(stats?.todaySeconds)}</span>
                    <span className="text-xs text-blue-800 font-medium uppercase tracking-wide mt-1">Today's Time</span>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <CalendarIcon size={24} className="text-green-500 mb-2" />
                    <span className="text-2xl font-bold text-green-600">{formatTime(stats?.weeklySeconds)}</span>
                    <span className="text-xs text-green-800 font-medium uppercase tracking-wide mt-1">This Week</span>
                  </div>
                </div>

                {/* Activity Calendar */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity size={16} /> Last 30 Days Activity
                  </h3>
                  <div className="bg-gray-50 border border-black/5 rounded-xl p-5">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {calendarDays.map(date => {
                        const seconds = stats?.activityCalendar?.[date] || 0;
                        // Determine color intensity based on active time
                        let colorClass = "bg-gray-200";
                        if (seconds > 0) colorClass = "bg-emerald-200";
                        if (seconds > 1800) colorClass = "bg-emerald-400"; // > 30 mins
                        if (seconds > 3600) colorClass = "bg-emerald-500"; // > 1 hour
                        if (seconds > 7200) colorClass = "bg-emerald-600"; // > 2 hours

                        return (
                          <div 
                            key={date} 
                            className={`w-4 h-4 md:w-5 md:h-5 rounded-sm ${colorClass} transition-all hover:scale-110 cursor-help relative group`}
                          >
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                              {date}: {formatTime(seconds)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
                      <span>Less</span>
                      <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
                      <div className="w-3 h-3 rounded-sm bg-emerald-200"></div>
                      <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                      <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
                      <span>More</span>
                    </div>
                  </div>
                </div>

                {/* Total Stats Footer */}
                <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg border border-black/5">
                  <span><strong>Monthly Time:</strong> {formatTime(stats?.monthlySeconds)}</span>
                  <span><strong>All-Time Total:</strong> {formatTime(stats?.totalSeconds)}</span>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
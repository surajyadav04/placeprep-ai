import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, TrendingUp } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ResumeHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const token = localStorage.getItem('token');
      axios.get(`${API_URL}/api/analytics/resume-history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setHistory(res.data))
      .catch(err => console.error("Failed to load resume history", err))
      .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-black/5 bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <FileText size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 font-display">Resume Analysis History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No resume analysis history found.
              </div>
            ) : (
              <div className="space-y-4 relative">
                {/* Visual connecting line for trend effect */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200 z-0"></div>
                
                {history.map((record, index) => {
                  // Determine trend compared to previous (which is older, so next in array)
                  let trend = 'neutral';
                  const olderRecord = history[index + 1];
                  if (olderRecord) {
                    if (record.ats_score > olderRecord.ats_score) trend = 'up';
                    else if (record.ats_score < olderRecord.ats_score) trend = 'down';
                  }

                  return (
                    <div key={record.id} className="relative z-10 flex items-start gap-4">
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white
                        ${trend === 'up' ? 'bg-green-100 text-green-700' : 
                          trend === 'down' ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-700'}`}
                      >
                        {record.ats_score}
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-600">Scan #{history.length - index}</span>
                          {trend === 'up' && <span className="text-xs font-medium text-green-600 flex items-center gap-1"><TrendingUp size={14} /> Improved</span>}
                        </div>
                        {record.feedback_json && (
                          <div className="text-sm text-gray-600 space-y-1">
                            {record.feedback_json.strengths && record.feedback_json.strengths.length > 0 && (
                              <p><span className="font-medium text-gray-800">Strengths:</span> {record.feedback_json.strengths[0]}</p>
                            )}
                            {record.feedback_json.weaknesses && record.feedback_json.weaknesses.length > 0 && (
                              <p><span className="font-medium text-gray-800">Improve:</span> {record.feedback_json.weaknesses[0]}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
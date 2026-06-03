import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, Users, FileText, Mic, Target, TrendingUp, Award, Clock } from 'lucide-react';
import GlassCard from './GlassCard';

export default function AnalyticsCharts({ API_URL, token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    growth: [],
    activity: null,
    resumes: null,
    interviews: null,
    funnel: null
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [growthRes, activityRes, resumesRes, interviewsRes, funnelRes] = await Promise.all([
          axios.get(`${API_URL}/api/founder/analytics/growth`, { headers }),
          axios.get(`${API_URL}/api/founder/analytics/activity`, { headers }),
          axios.get(`${API_URL}/api/founder/analytics/resumes`, { headers }),
          axios.get(`${API_URL}/api/founder/analytics/interviews`, { headers }),
          axios.get(`${API_URL}/api/founder/analytics/funnel`, { headers })
        ]);

        setData({
          growth: growthRes.data,
          activity: activityRes.data,
          resumes: resumesRes.data,
          interviews: interviewsRes.data,
          funnel: funnelRes.data
        });
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [API_URL, token]);

  if (loading) {
    return (
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <GlassCard className="h-80" />
        <GlassCard className="h-80" />
      </div>
    );
  }

  const { growth, activity, resumes, interviews, funnel } = data;

  const funnelData = [
    { name: 'Registered', value: funnel?.registered || 0, fill: '#8b5cf6' },
    { name: 'Resumes', value: funnel?.resume_uploaded || 0, fill: '#06b6d4' },
    { name: 'Interviews Started', value: funnel?.interview_started || 0, fill: '#10b981' },
    { name: 'Completed', value: funnel?.interview_completed || 0, fill: '#f59e0b' }
  ];

  return (
    <div className="mt-12 space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold font-display text-primary">Deep Analytics</h3>
        <p className="text-sm text-text-secondary mt-1">Detailed growth, activity, and engagement metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Growth Chart */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-500/20 text-violet-400 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold font-display text-primary">User Growth</h4>
              <p className="text-xs text-text-secondary">30-day signup velocity</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="signups" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Funnel Visualization */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <Target size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold font-display text-primary">Conversion Funnel</h4>
              <p className="text-xs text-text-secondary">User journey drop-off</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Metrics */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={20} className="text-emerald-400" />
            <h4 className="font-bold text-primary">Active Users</h4>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">DAU (Today)</span>
                <span className="font-bold text-primary">{activity?.dau || 0}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '100%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">WAU (7 Days)</span>
                <span className="font-bold text-primary">{activity?.wau || 0}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-emerald-400/80 h-1.5 rounded-full" style={{ width: '70%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">MAU (30 Days)</span>
                <span className="font-bold text-primary">{activity?.mau || 0}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-emerald-400/60 h-1.5 rounded-full" style={{ width: '40%' }}></div></div>
            </div>
          </div>
        </GlassCard>

        {/* Resume Metrics */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={20} className="text-amber-400" />
            <h4 className="font-bold text-primary">Resume Analytics</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
              <span className="text-xs text-text-tertiary block mb-1">Uploads</span>
              <span className="text-2xl font-bold text-primary">{resumes?.total_uploads || 0}</span>
            </div>
            <div className="p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
              <span className="text-xs text-text-tertiary block mb-1">Avg Score</span>
              <span className="text-2xl font-bold text-primary">{resumes?.average_score || 0}%</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-text-tertiary block mb-2 uppercase font-semibold">Top Missing Skills</span>
            <div className="flex flex-wrap gap-2">
              {resumes?.top_skills?.slice(0, 5).map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                  {s.skill}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Interview Metrics */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mic size={20} className="text-rose-400" />
            <h4 className="font-bold text-primary">Interview Metrics</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-rose-400/70" />
                <span className="text-sm text-text-secondary">Started</span>
              </div>
              <span className="font-bold text-primary">{interviews?.started || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-rose-400/70" />
                <span className="text-sm text-text-secondary">Completed</span>
              </div>
              <span className="font-bold text-primary">{interviews?.completed || 0}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]/50">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-text-secondary">Completion Rate</span>
                <span className="text-2xl font-bold text-primary">{interviews?.completion_rate || 0}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-gradient-to-r from-rose-500 to-rose-400 h-2 rounded-full" style={{ width: `${interviews?.completion_rate || 0}%` }}></div>
              </div>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
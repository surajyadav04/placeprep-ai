import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, FileText, Download, Briefcase, Activity } from 'lucide-react';
import axios from 'axios';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  
  const [mentorStats, setMentorStats] = useState({
    total_opportunities_posted: 0,
    active_opportunities: 0,
    total_resources_uploaded: 0,
    total_resource_downloads: 0
  });

  const [studentStats, setStudentStats] = useState({
    interviews: [],
    avgSession: 0,
    growthRate: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (isMentor) {
      const fetchMentorStats = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_URL}/api/resources/mentor/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMentorStats(res.data);
        } catch (err) {
          console.error("Failed to fetch mentor analytics", err);
        }
      };
      fetchMentorStats();
    } else {
      const fetchStudentStats = async () => {
        try {
          const token = localStorage.getItem('token');
          const [historyRes, statsRes] = await Promise.all([
            axios.get(`${API_URL}/api/analytics/interview-history`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${API_URL}/api/activity/stats`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          
          let interviews = historyRes.data || [];
          interviews = interviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          if (interviews.length > 7) {
            interviews = interviews.slice(interviews.length - 7);
          }
          
          const activityStats = statsRes.data;
          const avgSession = Math.round((activityStats.weeklySeconds || 0) / 7 / 60);
          
          const cal = activityStats.activityCalendar || {};
          const today = new Date();
          let currentWeekSecs = 0;
          let prevWeekSecs = 0;
          
          for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            currentWeekSecs += (cal[dateStr] || 0);
          }
          
          for (let i = 7; i < 14; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            prevWeekSecs += (cal[dateStr] || 0);
          }
          
          let growthRate = 0;
          if (prevWeekSecs > 0) {
            growthRate = Math.round(((currentWeekSecs - prevWeekSecs) / prevWeekSecs) * 100);
          } else {
            growthRate = 0;
          }
          
          if (!isFinite(growthRate) || isNaN(growthRate)) growthRate = 0;
          
          setStudentStats({
            interviews,
            avgSession,
            growthRate
          });
        } catch (err) {
          console.error("Failed to fetch student analytics", err);
        }
      };
      fetchStudentStats();
    }
  }, [isMentor, API_URL]);

  return (
    <Layout>
      <motion.header
        initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="mb-12 md:mb-16"
      >
        <span className="label mb-4 inline-block">{isMentor ? 'Mentor Impact' : 'Performance Matrix'}</span>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
          Analytics
        </h2>
        <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
          {isMentor 
            ? 'Track the usage and reach of the resources and opportunities you share.' 
            : 'Track your preparation velocity and mastery over time.'}
        </p>
      </motion.header>

      {isMentor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard glowColor="violet" delay={0.1} className="p-6 flex flex-col justify-center">
            <Briefcase size={24} className="text-primary mb-4" />
            <span className="label mb-1">Opportunities</span>
            <div className="text-4xl font-display font-bold text-primary">{mentorStats.total_opportunities_posted}</div>
            <p className="text-xs text-text-secondary mt-1">Total jobs posted</p>
          </GlassCard>

          <GlassCard glowColor="cyan" delay={0.2} className="p-6 flex flex-col justify-center">
            <Activity size={24} className="text-primary mb-4" />
            <span className="label mb-1">Active Now</span>
            <div className="text-4xl font-display font-bold text-primary">{mentorStats.active_opportunities}</div>
            <p className="text-xs text-text-secondary mt-1">Active opportunities</p>
          </GlassCard>

          <GlassCard glowColor="amber" delay={0.3} className="p-6 flex flex-col justify-center">
            <FileText size={24} className="text-primary mb-4" />
            <span className="label mb-1">Resources</span>
            <div className="text-4xl font-display font-bold text-primary">{mentorStats.total_resources_uploaded}</div>
            <p className="text-xs text-text-secondary mt-1">PDFs shared</p>
          </GlassCard>

          <GlassCard glowColor="emerald" delay={0.4} className="p-6 flex flex-col justify-center">
            <Download size={24} className="text-primary mb-4" />
            <span className="label mb-1">Downloads</span>
            <div className="text-4xl font-display font-bold text-primary">{mentorStats.total_resource_downloads}</div>
            <p className="text-xs text-text-secondary mt-1">Total student downloads</p>
          </GlassCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[minmax(180px,auto)] gap-6">
          
          {/* Main Chart Area */}
          <GlassCard glowColor="cyan" delay={0.1} className="md:col-span-8 md:row-span-2">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="label mb-2">Confidence Trajectory</span>
                  <h3 className="text-2xl font-bold font-display text-primary">Interview Readiness</h3>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-primary/5 rounded-full text-xs font-bold text-primary">1W</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-text-secondary hover:bg-black/5 cursor-pointer">1M</span>
                </div>
              </div>
              
              {/* Dynamic Chart Visualization */}
              <div className="flex-1 flex items-end gap-2 px-2 pb-4 pt-10">
                {studentStats.interviews.length === 0 ? (
                  <div className="w-full flex items-center justify-center text-text-tertiary text-sm pb-10">
                    Complete your first mock interview to see progress analytics.
                  </div>
                ) : (
                  studentStats.interviews.map((interview, i) => (
                    <div key={i} className="flex-1 bg-primary/10 rounded-t-sm relative group transition-all duration-300 hover:bg-primary/20" style={{ height: `${Math.max(interview.overall_score || 0, 5)}%` }}>
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: '100%' }} 
                        transition={{ duration: 1, delay: 0.2 + (i * 0.1), ease: [0.32, 0.72, 0, 1] }}
                        className="absolute bottom-0 w-full bg-primary rounded-t-sm opacity-60 group-hover:opacity-100 transition-opacity" 
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between text-xs text-text-tertiary px-2 font-display">
                {studentStats.interviews.length > 0 && studentStats.interviews.map((interview, i) => {
                  const date = new Date(interview.created_at);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  return <span key={i}>{dayName}</span>;
                })}
              </div>
            </div>
          </GlassCard>

          {/* Mini Stats */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <GlassCard glowColor="violet" delay={0.2} className="flex-1 p-6 flex flex-col justify-center">
              <TrendingUp size={24} className="text-primary mb-4" />
              <span className="label mb-1">Growth Rate</span>
              <div className="text-4xl font-display font-bold text-primary">{studentStats.growthRate > 0 ? '+' : ''}{studentStats.growthRate}%</div>
              <p className="text-xs text-text-secondary mt-1">vs last week</p>
            </GlassCard>

            <GlassCard glowColor="amber" delay={0.3} className="flex-1 p-6 flex flex-col justify-center">
              <Clock size={24} className="text-primary mb-4" />
              <span className="label mb-1">Avg Session</span>
              <div className="text-4xl font-display font-bold text-primary">{studentStats.avgSession}<span className="text-xl text-text-tertiary">m</span></div>
              <p className="text-xs text-text-secondary mt-1">focus time</p>
            </GlassCard>
          </div>

        </div>
      )}
    </Layout>
  );
}

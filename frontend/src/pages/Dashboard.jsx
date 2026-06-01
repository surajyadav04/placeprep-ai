import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Flame, Target, LogOut, User, Building, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/');
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(res.data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        navigate('/');
      }
    };
    fetchUser();
  }, [navigate]);

  const firstName = userData?.name?.split(' ')[0] || 'Student';
  const branch = userData?.institutional?.branch;
  const batch = userData?.institutional?.batch;

  return (
    <Layout>
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="mb-12 md:mb-16 flex flex-col md:flex-row md:justify-between md:items-end gap-6"
      >
        <div>
          <span className="label mb-4 inline-block">Command Center</span>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
            Hey {firstName}
          </h2>
          <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
            {branch ? `${branch} | Batch of ${batch}` : 'Your placement journey is 40% complete. Continue your rigorous preparation.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="px-5 py-3 rounded-full text-sm font-medium flex items-center gap-3 bg-white shadow-sm border border-black/5"
            style={{ color: 'var(--color-warning)' }}
          >
            <Flame size={16} /> 5 Day Streak
          </div>
          <button 
            onClick={() => { localStorage.removeItem('token'); navigate('/'); }}
            className="w-11 h-11 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500/20 transition-colors"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </motion.header>

      {/* ── Asymmetrical Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[minmax(180px,auto)] gap-6">

        {/* Today's Challenge (col-span-8, row-span-2) */}
        <GlassCard glowColor="indigo" delay={0.1} className="md:col-span-8 md:row-span-2">
          <div className="h-full flex flex-col justify-between">
            <div>
              <span className="label mb-4">Today's Challenge</span>
              <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display text-primary leading-tight">
                System Design:<br/> Rate Limiter
              </h3>
              <p className="text-base text-text-secondary max-w-md leading-relaxed font-body">
                Master API rate limiting concepts. Highly asked at Amazon, Microsoft, and Google.
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <button className="group flex items-center gap-4 bg-primary text-white pl-8 pr-2 py-2 rounded-full transition-all duration-400 hover:scale-[0.98]">
                <span className="font-medium text-sm">Start Challenge</span>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-400 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                  <Play size={16} className="text-white ml-0.5" />
                </div>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Stats & Confidence (Stacked col-span-4) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <GlassCard glowColor="amber" delay={0.2} className="flex-1 flex flex-col justify-center items-center text-center">
            <span className="label mb-2">Total Hours</span>
            <div className="text-5xl font-display font-bold text-primary mb-1">12</div>
            <p className="text-sm text-text-secondary">spent practicing</p>
          </GlassCard>

          <GlassCard glowColor="cyan" delay={0.3} className="flex-1 flex flex-col justify-center items-center text-center">
            <span className="label mb-2">Confidence Score</span>
            <div className="text-5xl font-display font-bold text-primary mb-1">84<span className="text-xl text-text-muted">%</span></div>
            <p className="text-sm text-text-secondary">top 15% of peers</p>
          </GlassCard>
        </div>

        {/* Preparation Roadmap (col-span-12) */}
        <GlassCard glowColor="violet" delay={0.4} className="md:col-span-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h3 className="text-2xl font-bold font-display text-primary flex items-center gap-3">
              <Target size={24} className="text-primary" /> Preparation Roadmap
            </h3>
            <span className="label">Phase 2 of 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completed */}
            <div className="p-5 rounded-2xl bg-black/5 border border-black/5">
              <h4 className="text-sm font-bold text-text-primary mb-1 line-through opacity-60 font-body">DSA Basics</h4>
              <p className="text-xs text-text-tertiary font-body">Completed 2 days ago</p>
            </div>

            {/* In progress */}
            <div className="p-5 rounded-2xl bg-white shadow-sm border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <h4 className="text-sm font-bold text-primary mb-1 font-body">System Design Fundamentals</h4>
              <p className="text-xs text-text-secondary mb-4 font-body">In Progress · 60%</p>
              <div className="w-full h-1.5 rounded-full bg-black/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  transition={{ duration: 1.5, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>

            {/* Upcoming */}
            <div className="p-5 rounded-2xl border border-black/5 border-dashed">
              <h4 className="text-sm font-bold text-text-tertiary mb-1 font-body">Mock HR Interviews</h4>
              <p className="text-xs text-text-muted font-body">Scheduled for Next Week</p>
            </div>
          </div>
        </GlassCard>

      </div>
    </Layout>
  );
}

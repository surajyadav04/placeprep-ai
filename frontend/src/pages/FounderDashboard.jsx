import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, UserCheck, Shield, Activity, TrendingUp, FileText, Mic, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import UsersTable from '../components/UsersTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FounderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    total_users: 0,
    students: 0,
    mentors: 0,
    founders: 0,
    active_today: 0,
    new_users_this_week: 0,
    resume_analyses: 0,
    interview_evaluations: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'founder') {
      navigate('/dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/founder/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch founder stats", err);
        setError("Failed to load dashboard statistics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate, API_URL]);

  if (!user || user.role !== 'founder') {
    return null; // Let the useEffect navigate away
  }

  return (
    <Layout>
      <motion.header
        initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="mb-12 md:mb-16"
      >
        <span className="label mb-4 inline-block">Platform Overview</span>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
          Founder Dashboard
        </h2>
        <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
          High-level metrics and usage statistics across the entire PlacePrep ecosystem.
        </p>
      </motion.header>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-red-500 text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-50 pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <GlassCard key={i} className="p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* User Metrics */}
          <GlassCard glowColor="violet" delay={0.1} className="p-6 flex flex-col justify-center">
            <Users size={24} className="text-primary mb-4" />
            <span className="label mb-1">Total Users</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.total_users}</div>
            <p className="text-xs text-text-secondary mt-1">All registered accounts</p>
          </GlassCard>

          <GlassCard glowColor="cyan" delay={0.2} className="p-6 flex flex-col justify-center">
            <Activity size={24} className="text-primary mb-4" />
            <span className="label mb-1">Active Today</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.active_today}</div>
            <p className="text-xs text-text-secondary mt-1">Unique logins today</p>
          </GlassCard>

          <GlassCard glowColor="emerald" delay={0.3} className="p-6 flex flex-col justify-center">
            <TrendingUp size={24} className="text-primary mb-4" />
            <span className="label mb-1">New Users</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.new_users_this_week}</div>
            <p className="text-xs text-text-secondary mt-1">Joined in last 7 days</p>
          </GlassCard>
          
          <GlassCard glowColor="amber" delay={0.4} className="p-6 flex flex-col justify-center">
            <User size={24} className="text-primary mb-4" />
            <span className="label mb-1">Students</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.students}</div>
            <p className="text-xs text-text-secondary mt-1">Student accounts</p>
          </GlassCard>

          {/* Breakdown & Features */}
          <GlassCard glowColor="blue" delay={0.5} className="p-6 flex flex-col justify-center">
            <UserCheck size={24} className="text-primary mb-4" />
            <span className="label mb-1">Mentors</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.mentors}</div>
            <p className="text-xs text-text-secondary mt-1">Mentor accounts</p>
          </GlassCard>
          
          <GlassCard glowColor="fuchsia" delay={0.6} className="p-6 flex flex-col justify-center">
            <Shield size={24} className="text-primary mb-4" />
            <span className="label mb-1">Founders</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.founders}</div>
            <p className="text-xs text-text-secondary mt-1">Admin accounts</p>
          </GlassCard>

          <GlassCard glowColor="orange" delay={0.7} className="p-6 flex flex-col justify-center">
            <FileText size={24} className="text-primary mb-4" />
            <span className="label mb-1">Resumes Analyzed</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.resume_analyses}</div>
            <p className="text-xs text-text-secondary mt-1">Total ATS scans</p>
          </GlassCard>
          
          <GlassCard glowColor="rose" delay={0.8} className="p-6 flex flex-col justify-center">
            <Mic size={24} className="text-primary mb-4" />
            <span className="label mb-1">Interviews</span>
            <div className="text-4xl font-display font-bold text-primary">{stats.interview_evaluations}</div>
            <p className="text-xs text-text-secondary mt-1">AI interviews completed</p>
          </GlassCard>
        </motion.div>
      )}

      {/* Phase 3: Analytics Dashboard */}
      {!loading && !error && (
        <AnalyticsCharts API_URL={API_URL} token={localStorage.getItem('token')} />
      )}

      {/* Phase 2: Users Management Table */}
      {!loading && !error && (
        <UsersTable API_URL={API_URL} token={localStorage.getItem('token')} />
      )}
    </Layout>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, UserCheck, Shield, Activity, TrendingUp, FileText, Mic, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import UsersTable from '../components/UsersTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import FounderControlCenter from '../components/FounderControlCenter';
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
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={64} />
            </div>
            <p className="text-sm text-text-secondary font-medium mb-2">Total Users</p>
            <h3 className="text-4xl font-bold text-primary">{stats.total_users}</h3>
            <p className="text-xs text-text-tertiary mt-2">Registered accounts</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-400">
              <User size={64} />
            </div>
            <p className="text-sm text-text-secondary font-medium mb-2">Students</p>
            <h3 className="text-4xl font-bold text-emerald-400">{stats.students}</h3>
            <p className="text-xs text-text-tertiary mt-2">Active candidates</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-blue-400">
              <UserCheck size={64} />
            </div>
            <p className="text-sm text-text-secondary font-medium mb-2">Mentors</p>
            <h3 className="text-4xl font-bold text-blue-400">{stats.mentors}</h3>
            <p className="text-xs text-text-tertiary mt-2">Industry experts</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber-400">
              <Activity size={64} />
            </div>
            <p className="text-sm text-text-secondary font-medium mb-2">Active Today</p>
            <h3 className="text-4xl font-bold text-amber-400">{stats.active_today}</h3>
            <p className="text-xs text-text-tertiary mt-2">Daily active users</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-purple-400">
              <TrendingUp size={64} />
            </div>
            <p className="text-sm text-text-secondary font-medium mb-2">New This Week</p>
            <h3 className="text-4xl font-bold text-purple-400">{stats.new_users_this_week}</h3>
            <p className="text-xs text-text-tertiary mt-2">Signups in last 7 days</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-fuchsia-400">
              <FileText size={64} />
            </div>
            <p className="text-sm text-text-secondary font-medium mb-2">Resumes Analyzed</p>
            <h3 className="text-4xl font-bold text-fuchsia-400">{stats.resume_analyses}</h3>
            <p className="text-xs text-text-tertiary mt-2">Total ATS scans</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-indigo-400">
              <Mic size={64} />
            </div>
            <p className="text-sm text-text-secondary font-medium mb-2">Interviews Conducted</p>
            <h3 className="text-4xl font-bold text-indigo-400">{stats.interview_evaluations}</h3>
            <p className="text-xs text-text-tertiary mt-2">AI mock interviews</p>
          </GlassCard>
        </motion.div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-12">
            <AnalyticsCharts API_URL={API_URL} token={localStorage.getItem('token')} />
          </div>

          <FounderControlCenter API_URL={API_URL} token={localStorage.getItem('token')} />

          <div className="mt-12">
            <UsersTable API_URL={API_URL} token={localStorage.getItem('token')} />
          </div>
        </>
      )}
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import StudentView from '../components/StudentView';
import MentorView from '../components/MentorView';

import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user: userData, logout } = useAuth();
  const navigate = useNavigate();

  const firstName = userData?.name?.split(' ')[0] || (userData?.role === 'mentor' ? 'Mentor' : 'Student');
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
          <span className="label mb-4 inline-block">
            {userData?.role === 'mentor' ? 'Mentor Portal' : 'Command Center'}
          </span>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
            Hey {firstName}
          </h2>
          <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
            {userData?.role === 'mentor' 
              ? 'Manage and share placement opportunities with students.'
              : (branch ? `${branch} | Batch of ${batch}` : 'Your placement journey is 40% complete. Continue your rigorous preparation.')
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userData?.role !== 'mentor' && (
            <div
              className="px-5 py-3 rounded-full text-sm font-medium flex items-center gap-3 bg-white shadow-sm border border-black/5"
              style={{ color: 'var(--color-warning)' }}
            >
              <Flame size={16} /> 5 Day Streak
            </div>
          )}
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="w-11 h-11 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500/20 transition-colors"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </motion.header>

      {/* ── Role Based View Rendering ── */}
      {userData?.role === 'mentor' ? <MentorView /> : <StudentView />}

    </Layout>
  );
}

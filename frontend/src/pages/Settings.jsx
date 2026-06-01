import React from 'react';
import { motion } from 'framer-motion';
import { User, Key, Bell, Shield } from 'lucide-react';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';

export default function Settings() {
  return (
    <Layout>
      <motion.header
        initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="mb-12 md:mb-16"
      >
        <span className="label mb-4 inline-block">Configuration</span>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
          Settings
        </h2>
        <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
          Manage your account, API keys, and notification preferences.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Profile & APIs */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <GlassCard glowColor="indigo" delay={0.1}>
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-black/5">
              <User size={20} className="text-primary" />
              <h3 className="text-xl font-bold font-display text-primary">Profile Details</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Full Name</label>
                <input type="text" className="w-full glass-input" defaultValue="Alex Developer" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Email Address</label>
                <input type="email" className="w-full glass-input" defaultValue="alex@university.edu" />
              </div>
              <button className="btn-primary text-sm py-2 px-6 mt-4">Save Changes</button>
            </div>
          </GlassCard>

          <GlassCard glowColor="amber" delay={0.2}>
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-black/5">
              <Key size={20} className="text-primary" />
              <h3 className="text-xl font-bold font-display text-primary">API Configuration</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Gemini API Key</label>
                <input type="password" className="w-full glass-input font-mono text-sm" placeholder="AIzaSy..." />
                <p className="text-xs text-text-tertiary mt-2">Required for AI Mock Interviews to evaluate speech.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Preferences */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <GlassCard glowColor="cyan" delay={0.3}>
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-black/5">
              <Bell size={20} className="text-primary" />
              <h3 className="text-xl font-bold font-display text-primary">Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/5">
                <div>
                  <p className="text-sm font-bold text-primary mb-1">Interview Reminders</p>
                  <p className="text-xs text-text-secondary">Get notified before scheduled mocks.</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-primary relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-black/5">
                <div>
                  <p className="text-sm font-bold text-primary mb-1">Weekly Reports</p>
                  <p className="text-xs text-text-secondary">Summary of your practice hours.</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-black/10 relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard glowColor="magenta" delay={0.4}>
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-primary" />
              <h3 className="text-xl font-bold font-display text-primary">Privacy Data</h3>
            </div>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              Your resume uploads and interview transcripts are encrypted and deleted within 24 hours of analysis.
            </p>
            <button className="text-sm font-medium text-danger hover:underline">
              Delete Account
            </button>
          </GlassCard>
        </div>

      </div>
    </Layout>
  );
}

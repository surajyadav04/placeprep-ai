import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Edit3, Check, Link as LinkIcon, Building, GraduationCap, MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';

import { useAuth } from '../context/AuthContext';

export default function PersonalDetails() {
  const { user: userData, setUser: setUserData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Editable form state
  const [formData, setFormData] = useState({
    bio: userData?.profile?.bio || '',
    linkedin_url: userData?.profile?.linkedin_url || '',
    github_url: userData?.profile?.github_url || '',
    portfolio_url: userData?.profile?.portfolio_url || '',
    profile_image_url: userData?.profile?.profile_image_url || ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/auth/profile/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };



  const inst = userData?.institutional || {};

  return (
    <Layout>
      <motion.header
        initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="mb-12 md:mb-16"
      >
        <span className="label mb-4 inline-block">Identity & Settings</span>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
          Personal Details
        </h2>
        <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
          Manage your editable profile and view your synchronized institutional records.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Read-Only Institutional Data */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <GlassCard glowColor="slate" delay={0.1} className="relative overflow-hidden border-black/5 bg-black/5 pb-8">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Building size={160} />
            </div>
            
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-black/10">
              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-text-secondary">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-primary leading-tight">Institutional Registry</h3>
                <p className="text-xs font-medium text-text-tertiary font-body">Read-only fields synchronized by the university</p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              
              {/* SECTION: Core Identity */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border-b border-black/5 pb-2 mb-4">Core Identity (Indexed)</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 font-body">Full Name</label>
                    <div className="font-medium text-primary text-sm bg-white/40 px-3 py-2 rounded-lg border border-white/60">{inst.full_name || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 font-body">Roll Number</label>
                    <div className="font-medium text-primary text-sm bg-white/40 px-3 py-2 rounded-lg border border-white/60">{inst.roll_number || 'N/A'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 font-body">Official Email</label>
                    <div className="font-medium text-primary text-sm bg-white/40 px-3 py-2 rounded-lg border border-white/60 truncate">{inst.univ_email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 font-body">Branch / Stream</label>
                    <div className="font-medium text-primary text-sm bg-white/40 px-3 py-2 rounded-lg border border-white/60 truncate">{inst.branch || 'N/A'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 font-body">Batch / Passing Year</label>
                    <div className="font-medium text-primary text-sm bg-white/40 px-3 py-2 rounded-lg border border-white/60 truncate">{inst.batch || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 font-body">CGPA</label>
                    <div className="font-bold text-primary text-sm bg-white/40 px-3 py-2 rounded-lg border border-white/60 flex items-center gap-2">
                      <Award size={14} className="text-amber-500"/>
                      {inst.cgpa ? inst.cgpa.toFixed(2) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Complete Institutional Registry */}
              <div className="space-y-4 pt-4 border-t border-black/5 mt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border-b border-black/5 pb-2 mb-4">Complete Registry (Dynamic)</h4>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  {Object.entries(inst.raw_data || {}).map(([key, value], idx) => {
                    // Prettify key
                    const displayKey = key
                      .replace(/_/g, ' ')
                      .replace(/([A-Z])/g, ' $1')
                      .trim()
                      .toLowerCase();
                      
                    return (
                      <div key={idx} className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 font-body capitalize">
                          {displayKey}
                        </label>
                        <div className="font-medium text-primary text-sm bg-white/40 px-3 py-2 rounded-lg border border-white/60 truncate" title={String(value)}>
                          {value ? String(value) : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!inst.raw_data || Object.keys(inst.raw_data).length === 0) && (
                    <div className="col-span-2 text-sm text-text-tertiary italic">
                      No additional registry data found for this student.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </GlassCard>
        </div>

        {/* Right Column: Editable Profile Settings */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <GlassCard glowColor="indigo" delay={0.2} className="h-full">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-black/5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Edit3 size={18} />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-primary leading-tight">Editable Profile</h3>
                <p className="text-xs font-medium text-text-secondary font-body">Configure your portfolio links and public bio</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Professional Bio</label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full glass-input min-h-[100px] resize-y" 
                  placeholder="Write a short summary about your technical interests and career goals..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body flex items-center gap-2">
                    <LinkIcon size={12}/> LinkedIn URL
                  </label>
                  <input 
                    type="url" 
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleInputChange}
                    className="w-full glass-input" 
                    placeholder="https://linkedin.com/in/..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body flex items-center gap-2">
                    <LinkIcon size={12}/> GitHub URL
                  </label>
                  <input 
                    type="url" 
                    name="github_url"
                    value={formData.github_url}
                    onChange={handleInputChange}
                    className="w-full glass-input" 
                    placeholder="https://github.com/..." 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body flex items-center gap-2">
                  <LinkIcon size={12}/> Portfolio / Website URL
                </label>
                <input 
                  type="url" 
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                  className="w-full glass-input" 
                  placeholder="https://yourdomain.com" 
                />
              </div>

              <div className="pt-6 border-t border-black/5 flex items-center justify-end gap-4">
                {saveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-600"
                  >
                    <Check size={16} /> Saved
                  </motion.div>
                )}
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary py-2.5 px-8 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>

            </form>
          </GlassCard>
        </div>

      </div>
    </Layout>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, Send, Trash2, ExternalLink, Briefcase, PlusCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import GlassCard from './GlassCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MentorView() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [opportunityData, setOpportunityData] = useState(null);
  const [publishing, setPublishing] = useState(false);
  
  const [postedOpps, setPostedOpps] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(true);

  const fetchOpps = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/opportunities/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPostedOpps(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingOpps(false);
  };

  useEffect(() => {
    fetchOpps();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/opportunities/analyze`, { source_url: url }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpportunityData(res.data);
    } catch (err) {
      console.error(err);
      // Fallback if completely fails
      setOpportunityData({
        source_url: url,
        title: "",
        company_name: "",
        opportunity_type: "Full-Time",
        ai_summary: "",
        eligibility: "",
        skills: [],
        location: "",
        deadline: ""
      });
    }
    setAnalyzing(false);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/opportunities/`, opportunityData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpportunityData(null);
      setUrl('');
      fetchOpps();
    } catch (err) {
      console.error("Failed to publish", err);
    }
    setPublishing(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this opportunity?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/opportunities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOpps();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* ── Post Opportunity Section ── */}
      <div className="lg:col-span-5 space-y-6">
        <GlassCard glowColor="indigo" delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-primary">Post Opportunity</h3>
              <p className="text-sm text-text-secondary font-body">Share jobs or internships with students.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!opportunityData ? (
              <motion.form key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Job URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Link2 size={16} className="text-text-muted" /></div>
                    <input 
                      type="url" 
                      value={url} 
                      onChange={e => setUrl(e.target.value)} 
                      className="w-full glass-input !pl-10" 
                      placeholder="https://company.com/careers/job" 
                      required 
                    />
                  </div>
                </div>
                <button type="submit" disabled={analyzing || !url} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                  {analyzing ? <><Sparkles size={16} className="animate-pulse" /> Analyzing URL...</> : <><Sparkles size={16} /> Analyze with AI</>}
                </button>
              </motion.form>
            ) : (
              <motion.form key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handlePublish} className="space-y-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-600 text-sm font-medium mb-4">
                  <CheckCircle2 size={16} /> AI Extraction Complete (Review below)
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Company</label>
                  <input type="text" value={opportunityData.company_name} onChange={e => setOpportunityData({...opportunityData, company_name: e.target.value})} className="w-full glass-input py-2" required />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Title</label>
                  <input type="text" value={opportunityData.title} onChange={e => setOpportunityData({...opportunityData, title: e.target.value})} className="w-full glass-input py-2" required />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1">Type</label>
                  <select value={opportunityData.opportunity_type} onChange={e => setOpportunityData({...opportunityData, opportunity_type: e.target.value})} className="w-full glass-input py-2">
                    <option value="Full-Time">Full-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Placement Drive">Placement Drive</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Competition">Competition</option>
                    <option value="Scholarship">Scholarship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1">AI Summary</label>
                  <textarea value={opportunityData.ai_summary} onChange={e => setOpportunityData({...opportunityData, ai_summary: e.target.value})} className="w-full glass-input py-2 min-h-[80px] resize-none" required />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpportunityData(null)} className="flex-1 py-3 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={publishing} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                    {publishing ? 'Publishing...' : <><Send size={16} /> Publish</>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* ── Active Postings ── */}
      <div className="lg:col-span-7">
        <GlassCard glowColor="emerald" delay={0.2} className="h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display text-primary flex items-center gap-2">
              <Briefcase size={20} /> Active Postings
            </h3>
          </div>

          <div className="space-y-4">
            {loadingOpps ? (
              <div className="animate-pulse space-y-4">
                {[1,2].map(i => <div key={i} className="h-24 bg-black/5 rounded-xl w-full"></div>)}
              </div>
            ) : postedOpps.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-black/10 rounded-xl">
                <Briefcase size={32} className="mx-auto text-text-muted mb-3" />
                <h4 className="text-text-primary font-medium mb-1">No active postings</h4>
                <p className="text-sm text-text-tertiary">Opportunities you post will appear here.</p>
              </div>
            ) : (
              postedOpps.map(opp => (
                <div key={opp.id} className="p-5 rounded-xl bg-white shadow-sm border border-black/5 hover:border-primary/20 transition-all flex flex-col sm:flex-row gap-4 sm:items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{opp.opportunity_type}</span>
                      <span className="text-xs text-text-tertiary">{new Date(opp.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-primary font-display text-lg leading-tight mb-1">{opp.title}</h4>
                    <p className="text-sm font-medium text-text-secondary">{opp.company_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={opp.source_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 text-text-secondary hover:bg-black/10 transition-colors">
                      <ExternalLink size={16} />
                    </a>
                    <button onClick={() => handleDelete(opp.id)} className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

    </div>
  );
}

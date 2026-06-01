import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Target, ExternalLink, Compass } from 'lucide-react';
import axios from 'axios';
import GlassCard from './GlassCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function StudentView() {
  const [opportunities, setOpportunities] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(true);

  useEffect(() => {
    const fetchOpps = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/opportunities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOpportunities(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoadingOpps(false);
    };
    fetchOpps();
  }, []);

  return (
    <div className="space-y-8">
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

      {/* ── Latest Opportunities Feed ── */}
      <GlassCard glowColor="rose" delay={0.5} className="mt-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold font-display text-primary flex items-center gap-3">
            <Compass size={24} className="text-primary" /> Latest Opportunities
          </h3>
        </div>

        {loadingOpps ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-black/5 rounded-2xl w-full"></div>)}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-black/10 rounded-2xl">
            <Compass size={40} className="mx-auto text-text-muted mb-4 opacity-50" />
            <h4 className="text-text-primary text-lg font-medium mb-2">No opportunities yet</h4>
            <p className="text-text-secondary">Mentors are preparing new roles. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp, idx) => (
              <motion.div 
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="group relative bg-white rounded-2xl p-6 border border-black/5 hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">
                        {opp.opportunity_type}
                      </span>
                      <h4 className="font-bold text-xl font-display text-primary leading-tight mb-1">{opp.title}</h4>
                      <p className="text-sm font-medium text-text-secondary">{opp.company_name}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-text-secondary line-clamp-3 mb-6 font-body leading-relaxed">
                    {opp.ai_summary}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-4">
                  <div className="text-xs text-text-tertiary">
                    Posted by {opp.created_by_name} • {new Date(opp.created_at).toLocaleDateString()}
                  </div>
                  <a 
                    href={opp.source_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Apply Now <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

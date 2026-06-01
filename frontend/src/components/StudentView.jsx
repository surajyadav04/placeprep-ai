import React, { useState, useEffect } from 'react';
import { Briefcase, ExternalLink, Flame } from 'lucide-react';
import axios from 'axios';
import GlassCard from './GlassCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function StudentView() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpps = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/opportunities/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOpportunities(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchOpps();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Active Opportunities ── */}
      <div className="lg:col-span-8">
        <GlassCard glowColor="indigo" delay={0.1} className="h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display text-primary flex items-center gap-2">
              <Briefcase size={20} /> Latest Opportunities
            </h3>
            <span className="text-sm font-medium text-text-tertiary">Matched for you</span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-28 bg-black/5 rounded-xl w-full"></div>)}
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-black/10 rounded-xl">
                <Briefcase size={32} className="mx-auto text-text-muted mb-3" />
                <h4 className="text-text-primary font-medium mb-1">No opportunities yet</h4>
                <p className="text-sm text-text-tertiary">Check back soon for new postings.</p>
              </div>
            ) : (
              opportunities.map(opp => (
                <div key={opp.id} className="p-5 rounded-xl bg-white shadow-sm border border-black/5 hover:border-primary/20 transition-all flex flex-col sm:flex-row gap-4 sm:items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{opp.opportunity_type}</span>
                      <span className="text-xs text-text-tertiary font-medium">Posted by {opp.created_by_name}</span>
                    </div>
                    <h4 className="font-bold text-primary font-display text-lg leading-tight mb-1">{opp.title}</h4>
                    <p className="text-sm font-medium text-text-secondary">{opp.company_name}</p>
                    
                    {opp.eligibility && (
                      <p className="text-xs text-text-tertiary mt-2">
                        <span className="font-medium text-text-secondary">Eligibility:</span> {opp.eligibility}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <a href={opp.source_url} target="_blank" rel="noreferrer" className="btn-primary py-2 px-4 text-sm flex items-center justify-center gap-2">
                      Apply <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── Progress & Updates ── */}
      <div className="lg:col-span-4 space-y-8">
        <GlassCard glowColor="emerald" delay={0.2}>
          <h3 className="text-lg font-bold font-display text-primary mb-4 flex items-center gap-2">
            <Flame size={18} /> Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/5">
              <div className="text-sm text-text-secondary mb-1 font-medium">Resumes Scored</div>
              <div className="text-2xl font-bold font-display text-primary">0</div>
            </div>
            <div className="p-4 rounded-xl bg-black/5">
              <div className="text-sm text-text-secondary mb-1 font-medium">Interviews Completed</div>
              <div className="text-2xl font-bold font-display text-primary">0</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

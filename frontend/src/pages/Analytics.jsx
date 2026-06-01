import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';

export default function Analytics() {
  return (
    <Layout>
      <motion.header
        initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="mb-12 md:mb-16"
      >
        <span className="label mb-4 inline-block">Performance Matrix</span>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
          Analytics
        </h2>
        <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
          Track your preparation velocity and mastery over time.
        </p>
      </motion.header>

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
            
            {/* Mock Chart Visualization */}
            <div className="flex-1 flex items-end gap-2 px-2 pb-4 pt-10">
              {[40, 55, 45, 60, 75, 82, 84].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/10 rounded-t-sm relative group transition-all duration-300 hover:bg-primary/20" style={{ height: `${h}%` }}>
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '100%' }} 
                    transition={{ duration: 1, delay: 0.2 + (i * 0.1), ease: [0.32, 0.72, 0, 1] }}
                    className="absolute bottom-0 w-full bg-primary rounded-t-sm opacity-60 group-hover:opacity-100 transition-opacity" 
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-text-tertiary px-2 font-display">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </GlassCard>

        {/* Mini Stats */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <GlassCard glowColor="violet" delay={0.2} className="flex-1 p-6 flex flex-col justify-center">
            <TrendingUp size={24} className="text-primary mb-4" />
            <span className="label mb-1">Growth Rate</span>
            <div className="text-4xl font-display font-bold text-primary">+14%</div>
            <p className="text-xs text-text-secondary mt-1">vs last week</p>
          </GlassCard>

          <GlassCard glowColor="amber" delay={0.3} className="flex-1 p-6 flex flex-col justify-center">
            <Clock size={24} className="text-primary mb-4" />
            <span className="label mb-1">Avg Session</span>
            <div className="text-4xl font-display font-bold text-primary">42<span className="text-xl text-text-tertiary">m</span></div>
            <p className="text-xs text-text-secondary mt-1">focus time</p>
          </GlassCard>
        </div>

      </div>
    </Layout>
  );
}

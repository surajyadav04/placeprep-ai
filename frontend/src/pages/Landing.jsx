import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Mic, FileText, BarChart2, ArrowRight, Zap, Sun, Moon } from 'lucide-react';
import ParticleField from '../components/ParticleField';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../context/ThemeContext';

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeOut' },
  },
};

function AnimatedCounter({ value, label, suffix = '' }) {
  const [display, setDisplay] = React.useState(0);
  const ref = useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = value / 60;
          const animate = () => {
            start += step;
            if (start >= value) { setDisplay(value); return; }
            setDisplay(Math.floor(start));
            requestAnimationFrame(animate);
          };
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl lg:text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-white)' }}>
        {display.toLocaleString()}{suffix}
      </div>
      <div className="text-xs mt-2 uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-display)', letterSpacing: '0.15em' }}>
        {label}
      </div>
    </div>
  );
}

export default function Landing() {
  const heroRef = useRef(null);

  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const { theme, toggleTheme } = useTheme();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 50) {
      setHidden(true); // scrolling down
    } else {
      setHidden(false); // scrolling up
    }
  });

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -60]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-void)' }}>

      {/* ── Living Atmosphere ── */}
      <ParticleField count={140} spread={22} connectionDistance={3} speed={0.1} color="#6366f1" />

      {/* ── Fluid Island Navigation ── */}
      <motion.nav
        initial={{ opacity: 0, y: -40, filter: 'blur(8px)' }}
        animate={{ 
          y: hidden ? -40 : 0, 
          scale: hidden ? 0.85 : 1,
          opacity: hidden ? 0 : 1, 
          filter: 'blur(0px)' 
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed top-6 left-4 right-4 md:left-0 md:right-0 z-50 md:mx-auto md:w-max px-4 py-2 rounded-full flex items-center justify-between gap-6 md:gap-12"
        style={{
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: 'rgba(255, 255, 255, 0.7)',
          borderBottomColor: 'rgba(0, 0, 0, 0.05)',
          boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.1), inset 0 2px 3px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-primary text-white">
            <Zap size={14} />
          </div>
          <span className="text-sm font-bold tracking-tight text-primary" style={{ fontFamily: 'var(--font-display)' }}>
            PlacePrep
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Method', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium transition-all duration-400 text-text-secondary hover:text-primary"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors hover:bg-[var(--color-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <Link
            to="/login"
            className="hidden md:block text-sm font-medium px-4 py-2 transition-colors duration-400 text-text-secondary hover:text-primary"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Log In
          </Link>
          <Link
            to="/login"
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6"
          >
            <span>Start Free</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero: Cinematic Reveal ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6" style={{ paddingTop: '80px' }}>
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 w-full max-w-6xl"
        >
          {/* Asymmetric layout — text left, floating accent right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left: Typography block */}
            <motion.div
              className="lg:col-span-7"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeUp}>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-breathe" style={{ background: 'var(--color-cyan)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)' }}>
                    Campus Placements 2026
                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span style={{ color: 'var(--color-text-white)' }}>Master your</span>
                <br />
                <span className="text-holographic">interviews</span>
                <br />
                <span style={{ color: 'var(--color-text-white)' }}>with precision.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-base lg:text-lg max-w-md mb-10"
                style={{ color: 'var(--color-text-secondary)', lineHeight: '1.75' }}
              >
                AI-powered mock interviews, resume intelligence, and real-time performance analytics — built for engineers who refuse to leave placement to chance.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-sm py-3.5 px-8">
                  Enter Platform <ArrowRight size={15} />
                </Link>
                <Link to="/login" className="btn-ghost text-sm py-3.5 px-8">
                  Watch Demo
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Floating glass accent */}
            <motion.div
              className="lg:col-span-5 hidden lg:flex justify-end"
              initial={{ opacity: 0, x: 60, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative" style={{ perspective: '1000px' }}>
                {/* Floating stat islands */}
                <GlassCard glowColor="indigo" delay={0.8} className="p-5 mb-4 w-72">
                  <div className="label mb-2" style={{ color: 'var(--color-indigo)' }}>Live Interview Score</div>
                  <div className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-white)' }}>87<span className="text-lg" style={{ color: 'var(--color-text-tertiary)' }}>/100</span></div>
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '87%' }}
                      transition={{ duration: 1.5, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, var(--color-indigo), var(--color-violet))' }}
                    />
                  </div>
                </GlassCard>

                <GlassCard glowColor="cyan" delay={1.0} className="p-5 w-64 ml-8" style={{ transform: 'translateZ(20px)' }}>
                  <div className="label mb-2" style={{ color: 'var(--color-cyan)' }}>ATS Resume Score</div>
                  <div className="flex items-end gap-2">
                    <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyan)' }}>92%</div>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>optimized</div>
                  </div>
                </GlassCard>

                {/* Ambient glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)' }} />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,214,160,0.08), transparent 70%)' }} />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--color-void), transparent)' }} />
      </section>

      {/* ── Social Proof: Animated Counters ── */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="glass-panel p-8 lg:p-10"
            style={{
              background: 'rgba(17, 23, 48, 0.4)',
              borderColor: 'rgba(99, 102, 241, 0.08)',
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedCounter value={12500} suffix="+" label="Mock Interviews" />
              <AnimatedCounter value={8400} suffix="+" label="Resumes Analyzed" />
              <AnimatedCounter value={94} suffix="%" label="Placement Rate" />
              <AnimatedCounter value={350} suffix="+" label="Companies" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features: Floating Islands ── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="mb-16"
          >
            <motion.p variants={fadeUp} className="label mb-3" style={{ color: 'var(--color-indigo)' }}>
              Capabilities
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl lg:text-5xl font-bold max-w-2xl leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Three pillars of
              <br />
              <span className="text-holographic">placement mastery.</span>
            </motion.h2>
          </motion.div>

          {/* Asymmetric feature grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Large feature */}
            <div className="lg:col-span-7">
              <GlassCard glowColor="indigo" delay={0.1} className="p-8 lg:p-10 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--color-indigo-glow)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <Mic size={22} style={{ color: 'var(--color-indigo)' }} />
                  </div>
                  <span className="label" style={{ color: 'var(--color-indigo)' }}>01</span>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  AI Mock Interviews
                </h3>
                <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.75' }}>
                  Speak naturally into your microphone. Our AI transcribes in real-time, analyzes your confidence, detects filler words, evaluates technical accuracy, and delivers mentor-grade feedback — instantly.
                </p>
                <div className="mt-6 flex gap-2">
                  {['Speech Analysis', 'Filler Detection', 'AI Scoring'].map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--color-indigo-glow)', color: 'var(--color-indigo)', fontFamily: 'var(--font-display)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Stacked features */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <GlassCard glowColor="cyan" delay={0.25} className="p-7 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--color-cyan-glow)', border: '1px solid rgba(6,214,160,0.2)' }}
                  >
                    <FileText size={18} style={{ color: 'var(--color-cyan)' }} />
                  </div>
                  <span className="label" style={{ color: 'var(--color-cyan)' }}>02</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Resume ATS Intelligence</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                  Upload your resume and get an instant ATS compatibility breakdown — keyword matching, readability, formatting, and completeness scores.
                </p>
              </GlassCard>

              <GlassCard glowColor="violet" delay={0.4} className="p-7 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--color-violet-glow)', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    <BarChart2 size={18} style={{ color: 'var(--color-violet)' }} />
                  </div>
                  <span className="label" style={{ color: 'var(--color-violet)' }}>03</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Performance Analytics</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                  Track confidence trajectories, interview readiness, and technical accuracy across every practice session.
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl lg:text-5xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to own your
            <br />
            <span className="text-holographic">placement season?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm mb-10" style={{ color: 'var(--color-text-secondary)' }}>
            Join thousands of engineers who transformed their interview performance.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2 text-sm py-4 px-10">
              Start Now — It's Free <ArrowRight size={15} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-8 px-6" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)' }}>PlacePrep AI</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>© 2026 PlacePrep AI. Built for campus placements.</p>
        </div>
      </footer>
    </div>
  );
}

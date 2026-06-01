import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Zap, ArrowLeft, CheckCircle2, User, Building, GraduationCap, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import ParticleField from '../components/ParticleField';
import { useTheme } from '../context/ThemeContext';

const API_URL = 'http://localhost:8000';

export default function Auth() {
  const [mode, setMode] = useState('login'); // login, register_email, register_password
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleVerifyStudent = async (e) => {
    e.preventDefault();
    // Temporarily bypassed institutional verification
    setStudentInfo({
      name: "Bypassed User",
      branch: "N/A",
      batch: "N/A",
      roll_number: "N/A"
    });
    setMode('register_password');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { email, password });
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[100dvh] bg-surface-base relative overflow-hidden">
      {/* ── Background Atmosphere ── */}
      <ParticleField count={50} spread={25} speed={0.04} connectionDistance={4} color="#E2E8F0" showGeo={false} />

      {/* ── Floating Nav ── */}
      <div className="absolute top-6 left-6 md:left-10 z-50 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-full glass-subtle text-sm font-medium text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full glass-subtle text-text-secondary hover:text-primary transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="flex flex-col md:flex-row w-full z-10">
        {/* ── Left Side: Editorial Splash (Hidden on mobile) ── */}
        <div className="hidden md:flex w-1/2 flex-col justify-center px-16 lg:px-24">
          <motion.div
            initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="inline-block px-3 py-1.5 rounded-full bg-black/5 text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-6">
              Institutional Gateway
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold font-display text-primary leading-[1.1] mb-6">
              Enter your <br/>
              <span className="italic font-light text-text-secondary">workspace.</span>
            </h1>
            <p className="text-lg text-text-secondary font-body max-w-md leading-relaxed">
              Verify your institutional identity to unlock AI mentorship, resume analytics, and personalized placement prep.
            </p>
          </motion.div>
        </div>

        {/* ── Right Side: Authentication Card ── */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 mt-16 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="w-full max-w-md"
          >
            {/* The "Double-Bezel" Outer Shell */}
            <div className="glass-panel w-full relative">
              {/* The "Double-Bezel" Inner Core */}
              <div className="glass-card w-full p-8 md:p-10 relative z-10">
                
                {/* Header */}
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white shadow-sm mb-6">
                    <Zap size={20} />
                  </div>
                  <h2 className="text-3xl font-bold font-display text-primary mb-2">
                    {mode === 'login' && 'Welcome back'}
                    {mode === 'register_email' && 'Verify Identity'}
                    {mode === 'register_password' && 'Secure Account'}
                  </h2>
                  <p className="text-sm text-text-secondary font-body">
                    {mode === 'login' && 'Sign in to your institutional workspace'}
                    {mode === 'register_email' && 'Enter your university email to begin'}
                    {mode === 'register_password' && 'Confirm your profile and create a password'}
                  </p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                    {error}
                  </motion.div>
                )}

                {/* Form Logic */}
                <div className="relative">
                  <AnimatePresence mode="wait">
                    
                    {/* LOGIN */}
                    {mode === 'login' && (
                      <motion.form key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleLogin} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">University Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-text-muted" /></div>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input !pl-11" placeholder="you@university.edu" required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={16} className="text-text-muted" /></div>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full glass-input !pl-11" placeholder="••••••••" required maxLength={32} />
                          </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full group btn-primary flex items-center justify-center gap-2 py-3.5 mt-6 relative overflow-hidden">
                          <span className="relative z-10 flex items-center gap-2 font-medium">{loading ? 'Signing In...' : 'Sign In'}</span>
                          {!loading && (
                            <div className="absolute right-2 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-400 group-hover:translate-x-1 group-hover:scale-105">
                              <LogIn size={14} className="text-white ml-0.5" />
                            </div>
                          )}
                        </button>
                      </motion.form>
                    )}

                    {/* REGISTER: EMAIL */}
                    {mode === 'register_email' && (
                      <motion.form key="reg_email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyStudent} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">University Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-text-muted" /></div>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input !pl-11" placeholder="you@university.edu" required />
                          </div>
                          <p className="text-[10px] text-text-tertiary mt-2">Only recognized institutional emails can register.</p>
                        </div>
                        <button type="submit" disabled={loading} className="w-full group btn-primary flex items-center justify-center gap-2 py-3.5 mt-6 relative overflow-hidden">
                          <span className="relative z-10 flex items-center gap-2 font-medium">{loading ? 'Verifying...' : 'Continue'}</span>
                          {!loading && (
                            <div className="absolute right-2 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-400 group-hover:translate-x-1 group-hover:scale-105">
                              <ArrowLeft size={14} className="text-white rotate-180" />
                            </div>
                          )}
                        </button>
                      </motion.form>
                    )}

                    {/* REGISTER: PASSWORD & PREVIEW */}
                    {mode === 'register_password' && (
                      <motion.form key="reg_pass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-5">
                        
                        {/* Profile Preview Panel */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3 mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 size={16} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">Identity Verified</span>
                          </div>
                          
                          {studentInfo && (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-text-secondary">
                                <User size={14} className="text-text-muted"/> 
                                <span className="font-medium text-text-primary">{studentInfo.name}</span>
                                <span className="text-xs text-text-tertiary ml-auto">({studentInfo.roll_number})</span>
                              </div>
                              <div className="flex items-center gap-2 text-text-secondary">
                                <Building size={14} className="text-text-muted"/> 
                                <span>{studentInfo.branch}</span>
                              </div>
                              {studentInfo.campus && (
                                <div className="flex items-center gap-2 text-text-secondary">
                                  <Building size={14} className="text-text-muted"/> 
                                  <span>{studentInfo.campus} Campus</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-text-secondary">
                                <GraduationCap size={14} className="text-text-muted"/> 
                                <span>Batch of {studentInfo.batch}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Create Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={16} className="text-text-muted" /></div>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full glass-input !pl-11" placeholder="••••••••" required minLength={8} maxLength={32} />
                          </div>
                        </div>
                        <button type="submit" disabled={loading || password.length < 8} className="w-full group btn-primary flex items-center justify-center gap-2 py-3.5 mt-6 relative overflow-hidden">
                          <span className="relative z-10 flex items-center gap-2 font-medium">{loading ? 'Creating Account...' : 'Create Account'}</span>
                        </button>
                      </motion.form>
                    )}

                  </AnimatePresence>
                </div>

                {/* Toggle Links */}
                <div className="mt-8 text-center text-sm text-text-tertiary font-body">
                  {mode === 'login' ? (
                    <>
                      Don't have an account? 
                      <button onClick={() => {setMode('register_email'); setError(''); setEmail(''); setPassword('');}} className="font-medium text-primary hover:text-text-secondary transition-colors duration-300 ml-1">
                        Register here
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account? 
                      <button onClick={() => {setMode('login'); setError(''); setEmail(''); setPassword('');}} className="font-medium text-primary hover:text-text-secondary transition-colors duration-300 ml-1">
                        Sign in instead
                      </button>
                    </>
                  )}
                </div>
                
              </div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </div>
  );
}

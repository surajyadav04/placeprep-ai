import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Zap, ArrowLeft, Building, GraduationCap, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ParticleField from '../components/ParticleField';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [mentorCode, setMentorCode] = useState('');
  
  const [registerStep, setRegisterStep] = useState(1);
  const [studentProfile, setStudentProfile] = useState(null);
  const [dob, setDob] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleVerifyEmail = async () => {
    if (!email) return;
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-student`, { email });
      if (res.data.found) {
        setStudentProfile(res.data);
        setRegisterStep(2);
      } else {
        setError(res.data.message || 'Email not found in university records.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to verify email');
    }
    setLoading(false);
  };

  const handleVerifyDob = async () => {
    if (!dob) return;
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-student-dob`, { email, dob });
      if (res.data.verified) {
        setRegisterStep(3);
      } else {
        setError(res.data.message || 'Date of Birth does not match university records.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to verify Date of Birth');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (role === 'student' && registerStep !== 3) return;
    
    setLoading(true); setError('');
    try {
      const payload = { email, password, role };
      if (role === 'mentor') {
        payload.mentor_code = mentorCode;
      } else if (role === 'student') {
        payload.dob = dob;
      }
      const res = await axios.post(`${API_URL}/api/auth/register`, payload);
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/google`, { 
        credential: credentialResponse.credential,
        role: mode === 'register' ? role : 'student' // Pass selected role for new users
      });
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Google Sign-In failed');
    }
    setLoading(false);
  };

  const content = (
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
        {/* ── Left Side: Editorial Splash ── */}
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
            <div className="glass-panel w-full relative">
              <div className="glass-card w-full p-8 md:p-10 relative z-10">
                
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white shadow-sm mb-6 mx-auto">
                    <Zap size={20} />
                  </div>
                  <h2 className="text-3xl font-bold font-display text-primary mb-2">
                    {mode === 'login' ? 'Welcome back' : 'Welcome to PlacePrep AI'}
                  </h2>
                  <p className="text-sm text-text-secondary font-body">
                    {mode === 'login' ? 'Sign in to your institutional workspace' : 'Create an account to begin'}
                  </p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                    {error}
                  </motion.div>
                )}

                {/* Form Wrapper */}
                <div className="relative">
                  {/* Google OAuth Section (Disabled for MVP per requirements) */}
                  <div className="mb-6 hidden p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium text-center">
                    Google Login unavailable (VITE_GOOGLE_CLIENT_ID missing)
                  </div>

                  <AnimatePresence mode="wait">
                    
                    {/* LOGIN FORM */}
                    {mode === 'login' && (
                      <motion.form key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleLogin} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-text-muted" /></div>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input !pl-11" placeholder="you@university.edu" required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={16} className="text-text-muted" /></div>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full glass-input !pl-11" placeholder="••••••••" required />
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

                    {/* REGISTER FORM */}
                    {mode === 'register' && (
                      <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-5">
                        
                        {/* Role Selection */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Account Role</label>
                          <div className="flex gap-4">
                            <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border cursor-pointer transition-all ${role === 'student' ? 'border-primary bg-primary/10 text-primary' : 'border-black/10 glass-subtle text-text-secondary hover:bg-black/5'}`}>
                              <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => {setRole('student'); setRegisterStep(1); setError('');}} className="hidden" />
                              <GraduationCap size={16} /> <span className="font-medium text-sm">Student</span>
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border cursor-pointer transition-all ${role === 'mentor' ? 'border-primary bg-primary/10 text-primary' : 'border-black/10 glass-subtle text-text-secondary hover:bg-black/5'}`}>
                              <input type="radio" name="role" value="mentor" checked={role === 'mentor'} onChange={() => {setRole('mentor'); setError('');}} className="hidden" />
                              <Building size={16} /> <span className="font-medium text-sm">Mentor</span>
                            </label>
                          </div>
                        </div>

                        {role === 'mentor' ? (
                          <>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Email</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-text-muted" /></div>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input !pl-11" placeholder="you@company.com" required />
                              </div>
                            </div>
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Mentor Access Code</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Zap size={16} className="text-text-muted" /></div>
                                <input type="password" value={mentorCode} onChange={e => setMentorCode(e.target.value)} className="w-full glass-input !pl-11 border-primary/30 focus:border-primary/60" placeholder="Enter secret code" required />
                              </div>
                              <p className="text-[10px] text-text-tertiary mt-1 ml-1">Required to verify mentor status</p>
                            </motion.div>
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
                          </>
                        ) : (
                          <>
                            {registerStep === 1 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Official University Email</label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-text-muted" /></div>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input !pl-11" placeholder="you@university.edu" required />
                                  </div>
                                </div>
                                <button type="button" onClick={handleVerifyEmail} disabled={loading || !email} className="w-full group btn-primary flex items-center justify-center gap-2 py-3.5 relative overflow-hidden">
                                  <span className="relative z-10 flex items-center gap-2 font-medium">{loading ? 'Verifying...' : 'Verify Email'}</span>
                                </button>
                              </motion.div>
                            )}

                            {registerStep === 2 && studentProfile && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <div className="p-4 rounded-xl bg-black/5 border border-black/10">
                                  <h3 className="text-sm font-bold text-primary mb-3">Student Profile Verified</h3>
                                  <div className="space-y-2 text-sm text-text-secondary">
                                    <p><span className="font-semibold text-text-primary">Name:</span> {studentProfile.full_name}</p>
                                    <p><span className="font-semibold text-text-primary">Roll No:</span> {studentProfile.roll_no}</p>
                                    <p><span className="font-semibold text-text-primary">Branch:</span> {studentProfile.branch}</p>
                                    <p><span className="font-semibold text-text-primary">Batch:</span> {studentProfile.batch}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Date of Birth</label>
                                  <div className="relative">
                                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full glass-input" required />
                                  </div>
                                  <p className="text-[10px] text-text-tertiary mt-1 ml-1">Required to verify identity</p>
                                </div>
                                
                                <button type="button" onClick={handleVerifyDob} disabled={loading || !dob} className="w-full group btn-primary flex items-center justify-center gap-2 py-3.5 relative overflow-hidden">
                                  <span className="relative z-10 flex items-center gap-2 font-medium">{loading ? 'Verifying...' : 'Verify Identity'}</span>
                                </button>
                              </motion.div>
                            )}

                            {registerStep === 3 && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium text-center">
                                  Identity Verified Successfully.
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
                              </motion.div>
                            )}
                          </>
                        )}
                      </motion.form>
                    )}

                  </AnimatePresence>
                </div>

                {/* Toggle Links */}
                <div className="mt-8 text-center text-sm text-text-tertiary font-body">
                  {mode === 'login' ? (
                    <>
                      Don't have an account? 
                      <button onClick={() => {setMode('register'); setError(''); setEmail(''); setPassword(''); setRegisterStep(1); setDob('');}} className="font-medium text-primary hover:text-text-secondary transition-colors duration-300 ml-1">
                        Register here
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account? 
                      <button onClick={() => {setMode('login'); setError(''); setEmail(''); setPassword(''); setRegisterStep(1); setDob('');}} className="font-medium text-primary hover:text-text-secondary transition-colors duration-300 ml-1">
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

  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}

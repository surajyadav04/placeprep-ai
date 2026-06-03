import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Zap, ArrowLeft, Building, GraduationCap, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ParticleField from '../components/ParticleField';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot-password'
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
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

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
    if (!isPasswordValid) {
      setError('Please ensure your password meets all strength requirements.');
      return;
    }
    
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError(''); setForgotPasswordMessage('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setForgotPasswordMessage(res.data.message || 'Reset link sent.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process request');
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
                    {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Welcome to PlacePrep AI' : 'Reset Password'}
                  </h2>
                  <p className="text-sm text-text-secondary font-body">
                    {mode === 'login' ? 'Sign in to your institutional workspace' : mode === 'register' ? 'Create an account to begin' : 'Enter your email to receive a reset link'}
                  </p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                    {error}
                  </motion.div>
                )}
                
                {forgotPasswordMessage && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium text-center">
                    {forgotPasswordMessage}
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
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary font-body">Password</label>
                            <button type="button" onClick={() => {setMode('forgot-password'); setError(''); setForgotPasswordMessage('');}} className="text-[10px] text-primary hover:underline font-medium">
                              Forgot Password?
                            </button>
                          </div>
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

                    {/* REGISTER FORM (MAINTENANCE) */}
                    {mode === 'register' && (
                      <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 text-center">
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 shadow-inner">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🚀</span>
                          </div>
                          <h3 className="text-lg font-bold text-primary mb-3">Upgrading Verification System</h3>
                          <p className="text-sm text-text-secondary leading-relaxed mb-4">
                            Thank you for the incredible response! We are currently upgrading our verification system to provide a more secure onboarding experience.
                          </p>
                          <p className="text-sm text-text-secondary leading-relaxed mb-4">
                            New registrations are temporarily paused while we complete these improvements. Existing users can continue using PlacePrep without interruption.
                          </p>
                          <p className="text-sm font-medium text-primary">
                            We'll be back shortly. Thank you for your patience and support. ❤️
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* FORGOT PASSWORD FORM */}
                    {mode === 'forgot-password' && (
                      <motion.form key="forgot-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleForgotPassword} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-text-muted" /></div>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input !pl-11" placeholder="you@university.edu" required />
                          </div>
                        </div>
                        <button type="submit" disabled={loading || !email} className="w-full group btn-primary flex items-center justify-center gap-2 py-3.5 mt-6 relative overflow-hidden">
                          <span className="relative z-10 flex items-center gap-2 font-medium">{loading ? 'Sending...' : 'Send Reset Link'}</span>
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
                      <button onClick={() => {setMode('register'); setError(''); setEmail(''); setPassword(''); setRegisterStep(1); setDob(''); setForgotPasswordMessage('');}} className="font-medium text-primary hover:text-text-secondary transition-colors duration-300 ml-1">
                        Register here
                      </button>
                    </>
                  ) : mode === 'register' ? (
                    <>
                      Already have an account? 
                      <button onClick={() => {setMode('login'); setError(''); setEmail(''); setPassword(''); setRegisterStep(1); setDob(''); setForgotPasswordMessage('');}} className="font-medium text-primary hover:text-text-secondary transition-colors duration-300 ml-1">
                        Sign in instead
                      </button>
                    </>
                  ) : (
                    <>
                      Remember your password? 
                      <button onClick={() => {setMode('login'); setError(''); setEmail(''); setPassword(''); setRegisterStep(1); setDob(''); setForgotPasswordMessage('');}} className="font-medium text-primary hover:text-text-secondary transition-colors duration-300 ml-1">
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

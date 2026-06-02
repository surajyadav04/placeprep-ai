import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import ParticleField from '../components/ParticleField';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please ensure your password meets all strength requirements.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token: token,
        new_password: password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] bg-surface-base items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-gray-500 mb-6">This password reset link is missing a valid token.</p>
          <Link to="/login" className="btn-primary py-2 px-4 inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] bg-surface-base items-center justify-center p-4 relative overflow-hidden">
      <ParticleField count={40} spread={25} speed={0.03} connectionDistance={3} color="#E2E8F0" showGeo={false} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 md:p-10">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock size={20} />
            </div>
            <h2 className="text-2xl font-bold font-display text-primary mb-2">
              Reset Password
            </h2>
            <p className="text-sm text-text-secondary">
              Please enter your new strong password below.
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {error}
            </motion.div>
          )}

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-sm text-gray-500 mb-6">Redirecting you to login...</p>
              <Link to="/login" className="btn-primary py-2 px-6 inline-block">
                Return to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-text-muted" />
                  </div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full glass-input !pl-11" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <PasswordStrengthMeter password={password} onValidityChange={setIsPasswordValid} />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 mt-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-text-muted" />
                  </div>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full glass-input !pl-11" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !isPasswordValid || password !== confirmPassword} 
                className="w-full btn-primary py-3.5 mt-6 flex items-center justify-center gap-2"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="text-center mt-6">
                <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

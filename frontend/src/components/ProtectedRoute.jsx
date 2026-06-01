import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParticleField from './ParticleField';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Silent Session Restore Loading State
    return (
      <div className="flex min-h-[100dvh] bg-surface-base relative overflow-hidden items-center justify-center">
        <ParticleField count={30} spread={20} speed={0.03} connectionDistance={3} color="#E2E8F0" showGeo={false} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium tracking-widest uppercase text-text-tertiary">Restoring Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { LayoutDashboard, Mic, FileText, BarChart2, Settings, Zap, Menu, X, User, Sun, Moon, BookOpen } from 'lucide-react';
import ParticleField from './ParticleField';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const { user } = useAuth();

  const allNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'mentor'] },
    { to: '/resources', icon: BookOpen, label: 'Resources', roles: ['student', 'mentor'] },
    { to: '/mock-interview', icon: Mic, label: 'Interview', roles: ['student'] },
    { to: '/resume', icon: FileText, label: 'Resume', roles: ['student'] },
    { to: '/analytics', icon: BarChart2, label: 'Analytics', roles: ['student', 'mentor'] },
    { to: '/profile', icon: User, label: 'Profile', roles: ['student', 'mentor'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['student', 'mentor'] },
  ];
  
  const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'student'));

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col bg-surface-base">
      {/* Universal Background */}
      <ParticleField count={60} color={theme === 'dark' ? '#818CF8' : '#A0AEC0'} speed={0.06} />
      <div className="absolute inset-0 grid-overlay pointer-events-none z-[1]" />

      {/* Fluid Island Navbar (Desktop) */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: hidden ? -40 : 0, 
          scale: hidden ? 0.85 : 1,
          opacity: hidden ? 0 : 1 
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed top-6 left-0 right-0 z-40 mx-auto w-max hidden md:flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          background: 'var(--color-surface-low)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.1), inset 0 2px 3px rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 mr-6 pl-2">
          <div className={user ? "w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-white shadow-sm" : "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[var(--color-border)] bg-transparent text-primary"}>
            <Zap size={14} fill={user ? "currentColor" : "none"} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
            PlacePrep
          </span>
        </Link>

        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-400 group"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full -z-10"
                  style={{ background: 'var(--color-secondary)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Theme Toggle */}
        <div className="pl-4 ml-2 border-l border-[var(--color-border)]">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors hover:bg-[var(--color-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Navbar Header */}
      <motion.div 
        animate={{ 
          y: hidden ? -30 : 0, 
          scale: hidden ? 0.9 : 1,
          opacity: hidden ? 0 : 1 
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="md:hidden fixed top-4 left-4 right-4 z-40 flex justify-between items-center px-4 py-3 rounded-2xl"
        style={{
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: 'rgba(255, 255, 255, 0.7)',
          borderBottomColor: 'rgba(0, 0, 0, 0.05)',
          boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.1), inset 0 2px 3px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className={user ? "w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-white shadow-sm" : "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[var(--color-border)] bg-transparent text-primary"}>
            <Zap size={14} fill={user ? "currentColor" : "none"} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
            PlacePrep
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 relative z-50 text-primary transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 relative z-50 text-primary">
            <motion.div
              animate={{ rotate: menuOpen ? 90 : 0 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.div>
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-30 bg-surface-low backdrop-blur-3xl flex flex-col items-center justify-center md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              {navItems.map(({ to, label }, i) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                >
                  <Link
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className="text-3xl font-display font-medium text-primary hover:text-secondary-container transition-colors"
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-24 md:py-32 relative z-10 flex flex-col">
        {children}
      </main>
    </div>
  );
}

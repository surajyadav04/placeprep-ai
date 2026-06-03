import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Bell, Mail, Users, ClipboardList, 
  Power, Send, ShieldAlert, CheckCircle, Search, 
  UserPlus, UserMinus, Shield
} from 'lucide-react';
import GlassCard from './GlassCard';

export default function FounderControlCenter({ API_URL, token }) {
  const [activeTab, setActiveTab] = useState('registration');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const tabs = [
    { id: 'registration', label: 'Registration Control', icon: <Power size={18} /> },
    { id: 'notifications', label: 'Notification Center', icon: <Bell size={18} /> },
    { id: 'broadcast', label: 'Broadcast Email', icon: <Mail size={18} /> },
    { id: 'mentors', label: 'Mentor Management', icon: <Users size={18} /> },
    { id: 'audit', label: 'Audit Logs', icon: <ClipboardList size={18} /> },
  ];

  return (
    <div className="mt-12 space-y-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold font-display text-primary flex items-center gap-2">
            <Settings className="text-fuchsia-400" /> Control Center
          </h3>
          <p className="text-sm text-text-secondary mt-1">Manage system state, communications, and audit trails</p>
        </div>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 border ${
              message.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {message.type === 'error' ? <ShieldAlert size={20} /> : <CheckCircle size={20} />}
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <GlassCard className="p-2 flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-primary border border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <GlassCard className="p-6 min-h-[400px]">
            {activeTab === 'registration' && <RegistrationControl API_URL={API_URL} token={token} showMessage={showMessage} />}
            {activeTab === 'notifications' && <NotificationCenter API_URL={API_URL} token={token} showMessage={showMessage} />}
            {activeTab === 'broadcast' && <BroadcastEmail API_URL={API_URL} token={token} showMessage={showMessage} />}
            {activeTab === 'mentors' && <MentorManagement API_URL={API_URL} token={token} showMessage={showMessage} />}
            {activeTab === 'audit' && <AuditLogs API_URL={API_URL} token={token} />}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponents ---

function RegistrationControl({ API_URL, token, showMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/founder/settings/registration`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setIsOpen(res.data.is_open))
      .catch(() => showMessage('error', 'Failed to load registration setting'))
      .finally(() => setLoading(false));
  }, [API_URL, token]);

  const toggleRegistration = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/founder/settings/registration`, 
        { is_open: !isOpen }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOpen(!isOpen);
      showMessage('success', `Registration has been ${!isOpen ? 'opened' : 'closed'}.`);
    } catch (err) {
      showMessage('error', 'Failed to update registration status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-white/5 rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-border)] pb-4">
        <h4 className="text-xl font-bold font-display text-primary">Registration Gateway</h4>
        <p className="text-sm text-text-secondary mt-1">Control whether new students can create accounts on PlacePrep.</p>
      </div>

      <div className="flex items-center justify-between p-6 bg-surface-low border border-[var(--color-border)]/50 rounded-xl">
        <div>
          <h5 className="font-bold text-primary flex items-center gap-2">
            Status: 
            <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wider ${isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </h5>
          <p className="text-sm text-text-secondary mt-1">
            {isOpen ? 'Students can currently verify emails and register.' : 'Registration is locked. OTP requests are blocked.'}
          </p>
        </div>
        <button 
          onClick={toggleRegistration}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isOpen 
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30' 
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
          } disabled:opacity-50`}
        >
          <Power size={18} />
          {saving ? 'Processing...' : isOpen ? 'Lock Registration' : 'Open Registration'}
        </button>
      </div>
    </div>
  );
}

function NotificationCenter({ API_URL, token, showMessage }) {
  const [message, setNotifMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    axios.get(`${API_URL}/api/founder/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setHistory(res.data))
      .catch(console.error);
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API_URL}/api/founder/notifications`, { message, audience }, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('success', 'Notification broadcasted successfully.');
      setNotifMessage('');
      fetchHistory();
    } catch (err) {
      showMessage('error', 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--color-border)] pb-4">
        <h4 className="text-xl font-bold font-display text-primary">In-App Notifications</h4>
        <p className="text-sm text-text-secondary mt-1">Push alerts to users' dashboards instantly.</p>
      </div>

      <form onSubmit={sendNotification} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Audience</label>
          <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-surface-low border border-[var(--color-border)] rounded-lg p-3 text-primary focus:outline-none focus:border-primary/50">
            <option value="all">All Users</option>
            <option value="student">Students Only</option>
            <option value="mentor">Mentors Only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
          <textarea 
            value={message} 
            onChange={e => setNotifMessage(e.target.value)}
            rows={3}
            placeholder="System maintenance at midnight..."
            className="w-full bg-surface-low border border-[var(--color-border)] rounded-lg p-3 text-primary focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>
        <button type="submit" disabled={sending || !message.trim()} className="px-6 py-2 bg-primary text-background rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          <Bell size={18} /> {sending ? 'Broadcasting...' : 'Broadcast Notification'}
        </button>
      </form>

      <div>
        <h5 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider">Recent Broadcasts</h5>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-text-tertiary italic">No notifications sent yet.</p>
          ) : (
            history.map(n => (
              <div key={n.id} className="p-4 bg-surface-low border border-[var(--color-border)]/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-primary">{n.message}</p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary whitespace-nowrap">
                  <span className="px-2 py-1 bg-white/5 rounded border border-white/10 uppercase">{n.audience}</span>
                  {new Date(n.date).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BroadcastEmail({ API_URL, token, showMessage }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('student');
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!confirm) {
      setConfirm(true);
      return;
    }
    
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/api/founder/broadcast`, { subject, message, audience }, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('success', `Broadcast complete. Delivered to ${res.data.sent} of ${res.data.attempted} users.`);
      setSubject('');
      setMessage('');
      setConfirm(false);
    } catch (err) {
      showMessage('error', 'Broadcast failed. Check SMTP settings.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--color-border)] pb-4">
        <h4 className="text-xl font-bold font-display text-primary">Email Broadcasts</h4>
        <p className="text-sm text-text-secondary mt-1">Send bulk emails using the configured SMTP server.</p>
      </div>

      <form onSubmit={handleBroadcast} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Target Audience</label>
          <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-surface-low border border-[var(--color-border)] rounded-lg p-3 text-primary focus:outline-none focus:border-primary/50">
            <option value="student">All Students</option>
            <option value="mentor">All Mentors</option>
            <option value="all">Entire Database (High Risk)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Subject Line</label>
          <input 
            type="text" 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
            required
            className="w-full bg-surface-low border border-[var(--color-border)] rounded-lg p-3 text-primary focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">HTML Message</label>
          <textarea 
            value={message} 
            onChange={e => setMessage(e.target.value)}
            required
            rows={6}
            placeholder="<h1>Hello!</h1>..."
            className="w-full bg-surface-low border border-[var(--color-border)] rounded-lg p-3 text-primary focus:outline-none focus:border-primary/50 font-mono text-sm"
          />
        </div>
        
        {confirm ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-400 font-medium mb-3">You are about to blast an email to the selected audience. Are you absolutely sure?</p>
            <div className="flex gap-3">
              <button type="submit" disabled={sending} className="px-6 py-2 bg-amber-500 text-background rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:opacity-50">
                {sending ? 'Sending emails...' : 'Yes, Send Now'}
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="px-6 py-2 bg-surface-high text-text-secondary rounded-lg font-medium hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="submit" className="px-6 py-2 bg-primary text-background rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Send size={18} /> Review & Broadcast
          </button>
        )}
      </form>
    </div>
  );
}

function MentorManagement({ API_URL, token, showMessage }) {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  const searchUser = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSearching(true);
    setUser(null);
    try {
      const res = await axios.get(`${API_URL}/api/founder/users?search=${encodeURIComponent(email)}&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.users.length > 0 && res.data.users[0].email.toLowerCase() === email.toLowerCase()) {
        setUser(res.data.users[0]);
      } else {
        showMessage('error', 'Exact email match not found.');
      }
    } catch (err) {
      showMessage('error', 'Failed to search for user.');
    } finally {
      setSearching(false);
    }
  };

  const changeRole = async (newRole) => {
    setUpdating(true);
    try {
      await axios.post(`${API_URL}/api/founder/users/${user.id}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
      setUser({ ...user, role: newRole });
      showMessage('success', `Role successfully updated to ${newRole}.`);
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to update role.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-border)] pb-4">
        <h4 className="text-xl font-bold font-display text-primary">Role Management</h4>
        <p className="text-sm text-text-secondary mt-1">Promote or demote users between Student and Mentor roles.</p>
      </div>

      <form onSubmit={searchUser} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input 
            type="email" 
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Exact user email address..." 
            className="w-full pl-9 pr-4 py-3 bg-surface-low border border-[var(--color-border)] rounded-lg text-sm text-primary focus:outline-none focus:border-primary/50"
          />
        </div>
        <button type="submit" disabled={searching} className="px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap disabled:opacity-50 font-medium">
          {searching ? 'Looking up...' : 'Find User'}
        </button>
      </form>

      {user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-surface-low border border-[var(--color-border)]/50 rounded-xl space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="text-lg font-bold text-primary">{user.name || 'No Name Provided'}</h5>
              <p className="text-text-secondary">{user.email}</p>
              <div className="mt-2 inline-flex px-2 py-1 rounded bg-black/20 border border-white/5 text-xs font-mono">
                Current Role: <span className="ml-1 text-primary">{user.role.toUpperCase()}</span>
              </div>
            </div>
            {user.role === 'founder' && (
              <Shield className="text-fuchsia-400" size={32} />
            )}
          </div>

          {user.role !== 'founder' ? (
            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]/50">
              <button 
                onClick={() => changeRole('mentor')}
                disabled={user.role === 'mentor' || updating}
                className="flex-1 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium"
              >
                <UserPlus size={16} /> Promote to Mentor
              </button>
              <button 
                onClick={() => changeRole('student')}
                disabled={user.role === 'student' || updating}
                className="flex-1 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium"
              >
                <UserMinus size={16} /> Demote to Student
              </button>
            </div>
          ) : (
            <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 text-sm rounded-lg border border-fuchsia-500/20 text-center">
              Founder roles cannot be modified via the dashboard.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function AuditLogs({ API_URL, token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/founder/audit-logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API_URL, token]);

  if (loading) return <div className="animate-pulse h-32 bg-white/5 rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-border)] pb-4">
        <h4 className="text-xl font-bold font-display text-primary">System Audit Trail</h4>
        <p className="text-sm text-text-secondary mt-1">Immutable ledger of all founder actions.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text-secondary">
          <thead className="text-xs uppercase bg-black/10 text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Action Details</th>
              <th className="px-4 py-3 text-right">Actor ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]/50">
            {logs.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center">No audit logs found.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(log.date).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded uppercase">{log.module}</span>
                  </td>
                  <td className="px-4 py-3 text-primary">{log.action}</td>
                  <td className="px-4 py-3 text-right font-mono">#{log.by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
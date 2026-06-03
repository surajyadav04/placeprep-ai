import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, X, Mail, Calendar, User as UserIcon, Shield, BookOpen } from 'lucide-react';
import GlassCard from './GlassCard';

export default function UsersTable({ API_URL, token }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/founder/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit: 10,
            search: debouncedSearch || undefined,
            role: roleFilter !== 'all' ? roleFilter : undefined
          }
        });
        setUsers(res.data.users);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_URL, token, page, debouncedSearch, roleFilter]);

  const getRoleIcon = (role) => {
    switch(role) {
      case 'student': return <BookOpen size={14} className="mr-1" />;
      case 'mentor': return <UserIcon size={14} className="mr-1" />;
      case 'founder': return <Shield size={14} className="mr-1 text-fuchsia-400" />;
      default: return <UserIcon size={14} className="mr-1" />;
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'student': return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case 'mentor': return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case 'founder': return "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20";
      default: return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  return (
    <div className="mt-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold font-display text-primary">User Directory</h3>
          <p className="text-sm text-text-secondary mt-1">Manage and view all registered accounts ({total} total)</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-low border border-[var(--color-border)] rounded-lg text-sm text-primary focus:outline-none focus:border-primary/50 transition-colors w-full sm:w-64"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select 
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2 bg-surface-low border border-[var(--color-border)] rounded-lg text-sm text-primary focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="mentor">Mentors</option>
              <option value="founder">Founders</option>
            </select>
          </div>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="text-xs uppercase bg-black/10 text-text-tertiary font-display">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-24"></div></td>
                    <td className="px-6 py-4 flex justify-end"><div className="h-8 bg-white/5 rounded w-8"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-tertiary">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{u.name || 'N/A'}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="p-2 bg-surface-high border border-[var(--color-border)] rounded-lg text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--color-border)]/50 flex items-center justify-between bg-black/5">
            <span className="text-sm text-text-tertiary">
              Showing page <span className="font-medium text-primary">{page}</span> of <span className="font-medium text-primary">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1 rounded border border-[var(--color-border)] text-text-secondary hover:text-primary hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-1 rounded border border-[var(--color-border)] text-text-secondary hover:text-primary hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface-base border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold font-display text-primary mb-1">User Details</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(selectedUser.role)}`}>
                      {getRoleIcon(selectedUser.role)}
                      {selectedUser.role}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-2 text-text-tertiary hover:text-primary transition-colors rounded-full hover:bg-white/5"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
                    <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-1 block">Full Name</span>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <UserIcon size={16} className="text-primary/50" />
                      {selectedUser.name || 'Not provided'}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
                    <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-1 block">Email Address</span>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Mail size={16} className="text-primary/50" />
                      {selectedUser.email}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
                    <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-1 block">Joined Date</span>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Calendar size={16} className="text-primary/50" />
                      {new Date(selectedUser.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-surface-low rounded-xl border border-[var(--color-border)]/50">
                    <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-1 block">Internal ID</span>
                    <div className="flex items-center gap-2 text-text-secondary font-mono text-sm">
                      #{selectedUser.id}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, UploadCloud, Trash2, X, Plus } from 'lucide-react';
import axios from 'axios';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';

export default function Resources() {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(res.data);
    } catch (err) {
      console.error("Failed to fetch resources", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert("Only PDF files are allowed.");
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert("File size exceeds 20MB limit.");
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !title) return;
    
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('file', selectedFile);
      
      await axios.post(`${API_URL}/api/resources/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      fetchResources();
    } catch (err) {
      console.error("Upload failed", err);
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/resources/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchResources();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete resource");
    }
  };

  const handleDownload = (id) => {
    const token = localStorage.getItem('token');
    // We can't just use a simple href if we want to pass the bearer token easily in some setups,
    // but typically a GET request with axios and creating a blob URL is better for authenticated downloads.
    axios.get(`${API_URL}/api/resources/download/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Try to extract filename from content-disposition header if available, else default
      let fileName = 'resource.pdf';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) fileName = matches[1].replace(/['"]/g, '');
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }).catch(err => {
      console.error("Download failed", err);
      alert("Failed to download resource");
    });
  };

  return (
    <Layout>
      <motion.header
        initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <span className="label mb-4 inline-block">Knowledge Base</span>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-primary leading-tight font-display">
            Resources
          </h2>
          <p className="text-lg mt-3 text-text-secondary max-w-lg font-body">
            {isMentor ? 'Manage and share placement preparation material with students.' : 'Access preparation material shared by your mentors.'}
          </p>
        </div>
        
        {isMentor && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn-primary py-3 px-6 flex items-center gap-2 rounded-full"
          >
            <Plus size={18} /> Share Resource
          </button>
        )}
      </motion.header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : resources.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-xl font-bold text-primary font-display mb-2">No resources available</h3>
          <p className="text-text-secondary max-w-md">
            {isMentor 
              ? "You haven't shared any resources yet. Upload PDF guides to help students prepare."
              : "Mentors haven't shared any resources yet. Check back later."}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <GlassCard glowColor="indigo" className="h-full flex flex-col p-6 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <FileText size={20} />
                  </div>
                  {isMentor && res.uploaded_by_name === user?.name && (
                    <button 
                      onClick={() => handleDelete(res.id)}
                      className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete Resource"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-primary font-display mb-2 line-clamp-1" title={res.title}>
                  {res.title}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-2 mb-6 flex-grow font-body">
                  {res.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                  <div className="text-xs text-text-tertiary">
                    By <span className="font-medium text-text-secondary">{res.uploaded_by_name}</span>
                  </div>
                  <button 
                    onClick={() => handleDownload(res.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-low/80 backdrop-blur-sm"
              onClick={() => !uploading && setShowUploadModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface-base border border-[var(--color-border)] rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-primary font-display">Share Resource</h3>
                <button 
                  onClick={() => !uploading && setShowUploadModal(false)}
                  className="p-2 text-text-tertiary hover:text-primary transition-colors rounded-full hover:bg-black/5"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpload} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Resource Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full glass-input" 
                    placeholder="e.g., Ultimate Placement Guide 2024" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full glass-input min-h-[80px] resize-y" 
                    placeholder="What will students learn from this resource?" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 font-body">PDF File</label>
                  <div 
                    className="border-2 border-dashed border-black/10 hover:border-primary/50 rounded-2xl p-8 text-center transition-colors cursor-pointer bg-black/5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <UploadCloud size={32} className="mx-auto text-primary/60 mb-3" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-bold text-primary truncate max-w-xs mx-auto">{selectedFile.name}</p>
                        <p className="text-xs text-text-tertiary mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-text-secondary">Click to upload PDF</p>
                        <p className="text-xs text-text-tertiary mt-1">Max size: 20MB</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="px-5 py-2.5 rounded-full text-sm font-medium text-text-secondary hover:text-primary hover:bg-black/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading || !selectedFile || !title}
                    className="btn-primary py-2.5 px-6"
                  >
                    {uploading ? 'Uploading...' : 'Publish Resource'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

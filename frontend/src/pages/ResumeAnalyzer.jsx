import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  UploadCloud, CheckCircle2, AlertCircle, Target, Sparkles,
  BookOpen, TrendingUp, X, ChevronDown,
  Brain, Layers, Star, AlertTriangle, Lightbulb,
  Code2, Cloud, Wrench, GraduationCap, BarChart3,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Layout from '../components/Layout';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ─────────────────────────────────────────────
   Score Ring — pastel‑theme compatible
───────────────────────────────────────────── */
function ScoreRing({ score, label, color = 'slate', size = 'md' }) {
  const clamp = Math.max(0, Math.min(100, score || 0));
  const colorMap = {
    green:  '#38A169', yellow: '#DD6B20', blue: '#5A67D8',
    purple: '#805AD5', orange: '#DD6B20', slate: '#2D3748',
    coral:  '#E53E3E', mint:   '#38A169',
  };
  const stroke = colorMap[color] || colorMap.slate;
  const dim    = size === 'lg' ? { w: 80, h: 80, r: 15.9, sw: 3, fs: 'text-xl' }
               : size === 'sm' ? { w: 52, h: 52, r: 15.9, sw: 2, fs: 'text-xs' }
               :                 { w: 64, h: 64, r: 15.9, sw: 2.5, fs: 'text-sm' };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative`} style={{ width: dim.w, height: dim.h }}>
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={dim.sw} />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={stroke} strokeWidth={dim.sw}
            strokeDasharray={`${clamp}, 100`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold ${dim.fs}`}
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          {Math.round(clamp)}
        </span>
      </div>
      <span className="text-xs text-center leading-tight"
        style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)', maxWidth: 70 }}>
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Thin progress bar
───────────────────────────────────────────── */
function SectionBar({ label, value }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  const color = pct >= 70 ? '#38A169' : pct >= 40 ? '#DD6B20' : '#E53E3E';
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color, fontFamily: 'var(--font-display)' }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skill tag
───────────────────────────────────────────── */
const CATEGORY_COLORS = {
  language:  { bg: 'rgba(90,103,216,0.07)', color: '#5A67D8', border: 'rgba(90,103,216,0.15)' },
  framework: { bg: 'rgba(56,161,105,0.07)', color: '#38A169', border: 'rgba(56,161,105,0.15)' },
  cloud:     { bg: 'rgba(128,90,213,0.07)', color: '#805AD5', border: 'rgba(128,90,213,0.15)' },
  devops:    { bg: 'rgba(221,107,32,0.07)', color: '#DD6B20', border: 'rgba(221,107,32,0.15)' },
  database:  { bg: 'rgba(0,128,128,0.07)',  color: '#2C7A7B', border: 'rgba(0,128,128,0.15)' },
  tool:      { bg: 'rgba(0,0,0,0.04)',       color: '#4A5568', border: 'rgba(0,0,0,0.08)' },
  practice:  { bg: 'rgba(45,55,72,0.05)',    color: '#2D3748', border: 'rgba(45,55,72,0.12)' },
  ai:        { bg: 'rgba(229,62,62,0.06)',   color: '#C53030', border: 'rgba(229,62,62,0.14)' },
};

function SkillTag({ name, category, size = 'sm' }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.tool;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: size === 'sm' ? 11 : 12 }}>
      {name}
    </span>
  );
}

function MissingSkillTag({ name }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium"
      style={{ background: 'rgba(229,62,62,0.05)', color: '#C53030', border: '1px solid rgba(229,62,62,0.12)', fontSize: 11 }}>
      <X size={8} /> {name}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Section Badge (filled / missing)
───────────────────────────────────────────── */
function SectionBadge({ filled, label }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
      style={{
        background: filled ? 'rgba(56,161,105,0.06)' : 'rgba(229,62,62,0.05)',
        color:      filled ? 'var(--color-success)' : 'var(--color-danger)',
        border:    `1px solid ${filled ? 'rgba(56,161,105,0.1)' : 'rgba(229,62,62,0.1)'}`,
      }}>
      {filled ? <CheckCircle2 size={10} /> : <X size={10} />} {label}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Score label helper
───────────────────────────────────────────── */
function getScoreLabel(s) {
  if (s >= 80) return { text: 'Excellent', color: 'var(--color-success)',  bg: 'rgba(56,161,105,0.08)' };
  if (s >= 65) return { text: 'Good',      color: '#DD6B20',               bg: 'rgba(221,107,32,0.08)' };
  if (s >= 45) return { text: 'Fair',      color: '#DD6B20',               bg: 'rgba(221,107,32,0.06)' };
  return              { text: 'Needs Work', color: 'var(--color-danger)',   bg: 'rgba(229,62,62,0.08)' };
}
function getScoreColor(s) {
  return s >= 80 ? 'green' : s >= 65 ? 'yellow' : 'orange';
}

/* ─────────────────────────────────────────────
   Category icon helper for skills
───────────────────────────────────────────── */
function CategoryIcon({ category }) {
  const icons = {
    language: Code2, framework: Layers, cloud: Cloud,
    devops: Wrench, database: BarChart3, ai: Brain,
    practice: GraduationCap, tool: Wrench,
  };
  const Icon = icons[category] || Wrench;
  return <Icon size={10} />;
}

/* ═════════════════════════════════════════════
   MAIN PAGE
═════════════════════════════════════════════ */
export default function ResumeAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]           = useState(null);
  const [file, setFile]               = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [error, setError]             = useState(null);
  const [jdText, setJdText]           = useState('');
  const [showJD, setShowJD]           = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const ext = f.name.split('.').pop().toLowerCase();
    if (!allowed.includes(f.type) && !['pdf', 'doc', 'docx'].includes(ext)) {
      setError('Upload a PDF or DOCX file.'); return;
    }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setFile(f); setError(null); setResult(null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Select a file first.'); return; }
    setIsAnalyzing(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (jdText.trim()) formData.append('jd_text', jdText.trim());
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/resume/analyze`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Resume analysis failed. Make sure the backend server is running.');
    } finally { setIsAnalyzing(false); }
  };

  /* ── Derived state ── */
  const parsed           = result?.parsed           || {};
  const extractedSkills  = result?.extracted_skills || [];
  const missingSkills    = result?.missing_skills   || [];
  const sectionScores    = result?.section_scores   || {};
  const atsTips          = result?.ats_tips         || [];
  const impactLines      = result?.impact_lines     || [];
  const formattingIssues = result?.formatting_issues || [];
  const hasJD            = jdText.trim().length > 0;

  const allSections = [
    { label: 'Name',           key: 'name'           },
    { label: 'Email',          key: 'email'          },
    { label: 'Phone',          key: 'phone'          },
    { label: 'LinkedIn',       key: 'linkedin'       },
    { label: 'GitHub',         key: 'github'         },
    { label: 'Summary',        key: 'summary'        },
    { label: 'Skills',         key: 'skills'         },
    { label: 'Education',      key: 'education'      },
    { label: 'Experience',     key: 'experience'     },
    { label: 'Projects',       key: 'projects'       },
    { label: 'Certifications', key: 'certifications' },
  ];

  // Group skills by category
  const skillsByCategory = extractedSkills.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s.name);
    return acc;
  }, {});

  return (
    <Layout>

          {/* ── Header ── */}
          <motion.header
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8">
            <p className="label mb-3">ATS Intelligence Engine</p>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              Resume Analyzer
            </h2>
            <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Semantic ATS scoring · Skill extraction · Impact analysis · JD matching
            </p>
          </motion.header>

          {/* ── Row 1: Upload + ATS Score ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

            {/* Upload */}
            <div className="lg:col-span-2">
              <GlassCard glowColor="cyan" delay={0.1} className="p-6 flex flex-col h-full">
                <h3 className="text-xs font-semibold mb-4 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                  <UploadCloud size={14} style={{ color: 'var(--color-primary)' }} /> Upload Resume
                </h3>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 min-h-[130px] mb-4"
                  style={{
                    borderColor: dragOver ? '#2D3748' : file ? 'var(--color-success)' : 'rgba(0,0,0,0.08)',
                    background:  dragOver ? 'rgba(45,55,72,0.03)' : file ? 'rgba(56,161,105,0.03)' : 'rgba(0,0,0,0.01)',
                  }}>
                  <input ref={inputRef} type="file" accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFile(e.target.files[0])} className="hidden" id="resume-upload-input" />
                  {file ? (
                    <>
                      <CheckCircle2 size={26} style={{ color: 'var(--color-success)' }} className="mb-2" />
                      <p className="text-sm font-medium text-center px-2" style={{ color: 'var(--color-text-primary)' }}>{file.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                        className="mt-2 text-xs transition-colors" style={{ color: 'var(--color-danger)' }}>Remove</button>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={26} className="mb-2" style={{ color: 'var(--color-text-muted)' }} />
                      <p className="text-xs text-center px-4" style={{ color: 'var(--color-text-tertiary)' }}>Drag & drop or click</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>PDF / DOCX · Max 10 MB</p>
                    </>
                  )}
                </div>

                {/* JD toggle */}
                <div className="mb-3">
                  <button
                    onClick={() => setShowJD(!showJD)}
                    className="w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl transition-colors"
                    style={{ color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <span className="flex items-center gap-1.5">
                      <Brain size={11} /> {jdText.trim() ? '✓ Job description added' : 'Add Job Description (optional)'}
                    </span>
                    <ChevronDown size={11} style={{ transform: showJD ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                  </button>
                  <AnimatePresence>
                    {showJD && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                        <textarea
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          placeholder="Paste the job description here for semantic JD matching, missing skill detection, and tailored feedback…"
                          rows={5}
                          className="glass-input w-full mt-2 text-xs resize-none"
                          style={{ borderRadius: '0.75rem', padding: '10px 12px' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {error && (
                  <div className="mb-3 p-3 rounded-lg text-xs flex items-start gap-2"
                    style={{ background: 'rgba(229,62,62,0.05)', border: '1px solid rgba(229,62,62,0.1)', color: 'var(--color-danger)' }}>
                    <AlertCircle size={12} className="mt-0.5 shrink-0" /> {error}
                  </div>
                )}

                <button id="analyze-resume-btn" onClick={handleUpload} disabled={isAnalyzing || !file}
                  className="btn-primary w-full py-2.5 text-xs">
                  {isAnalyzing
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing…
                      </span>
                    : <span className="flex items-center justify-center gap-1.5">
                        <Sparkles size={12} /> Analyze Resume
                      </span>
                  }
                </button>
              </GlassCard>
            </div>

            {/* ATS Score Panel */}
            <div className="lg:col-span-3">
              <GlassCard glowColor="indigo" delay={0.2} className="p-6 h-full">
                <h3 className="text-xs font-semibold mb-4 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                  <Target size={14} style={{ color: 'var(--color-primary)' }} /> ATS Score Breakdown
                </h3>

                {!result && !isAnalyzing && (
                  <div className="h-40 flex flex-col items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                    <TrendingUp size={32} className="mb-3 opacity-20" />
                    <p className="text-xs">Upload a resume to see your ATS score</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="h-40 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 rounded-full animate-spin"
                      style={{ border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--color-primary)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Running ATS intelligence…
                    </p>
                  </div>
                )}

                {result && !isAnalyzing && (() => {
                  const { text: lblTxt, color: lblColor, bg: lblBg } = getScoreLabel(result.ats_score);
                  return (
                    <div>
                      {/* Main score + label */}
                      <div className="flex items-center gap-5 mb-5 pb-5"
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <ScoreRing score={result.ats_score} label="ATS Score" color={getScoreColor(result.ats_score)} size="lg" />
                        <div>
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-1"
                            style={{ background: lblBg, color: lblColor, border: `1px solid ${lblColor}22` }}>
                            {lblTxt}
                          </span>
                          <p className="font-semibold text-sm"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                            ATS Compatibility Score
                          </p>
                          <p className="text-xs mt-0.5"
                            style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                            {result.ats_score >= 80 ? 'Highly optimized — passes most ATS systems.'
                             : result.ats_score >= 65 ? 'Good foundation — a few targeted tweaks will push you over.'
                             : 'Improvements needed to clear ATS filters.'}
                          </p>
                        </div>
                      </div>

                      {/* Sub-score rings */}
                      <div className={`grid gap-3 ${hasJD ? 'grid-cols-6' : 'grid-cols-4'}`}>
                        <ScoreRing score={result.keyword_match}  label="Keywords"    color={getScoreColor(result.keyword_match)} />
                        <ScoreRing score={result.readability}    label="Readability" color={getScoreColor(result.readability)} />
                        <ScoreRing score={result.completeness}   label="Complete"    color={getScoreColor(result.completeness)} />
                        <ScoreRing score={result.formatting}     label="Format"      color={getScoreColor(result.formatting)} />
                        {hasJD && <ScoreRing score={result.semantic_score || 0} label="JD Match"  color={getScoreColor(result.semantic_score)} />}
                        <ScoreRing score={result.impact_score || 0}   label="Impact"     color={getScoreColor(result.impact_score)} />
                      </div>
                    </div>
                  );
                })()}
              </GlassCard>
            </div>
          </div>

          {/* ── Row 2: Results ── */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5">

                {/* Row: Strengths / Weaknesses / Section Coverage */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* Strengths */}
                  <GlassCard glowColor="cyan" delay={0.2} className="p-5">
                    <h3 className="text-xs font-semibold mb-4 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-success)' }}>
                      <CheckCircle2 size={13} /> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {(result.strengths || []).length > 0
                        ? result.strengths.map((s, i) => (
                            <li key={i} className="text-xs p-3 rounded-lg flex items-start gap-2"
                              style={{ background: 'rgba(56,161,105,0.04)', border: '1px solid rgba(56,161,105,0.08)', color: 'var(--color-text-secondary)' }}>
                              <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--color-success)' }} /> {s}
                            </li>
                          ))
                        : <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No strengths detected yet.</p>
                      }
                    </ul>
                  </GlassCard>

                  {/* Weaknesses */}
                  <GlassCard glowColor="magenta" delay={0.3} className="p-5">
                    <h3 className="text-xs font-semibold mb-4 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-danger)' }}>
                      <AlertCircle size={13} /> Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {(result.weaknesses || []).length > 0
                        ? result.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs p-3 rounded-lg flex items-start gap-2"
                              style={{ background: 'rgba(229,62,62,0.04)', border: '1px solid rgba(229,62,62,0.08)', color: 'var(--color-text-secondary)' }}>
                              <AlertCircle size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--color-danger)' }} /> {w}
                            </li>
                          ))
                        : <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No major issues found.</p>
                      }
                    </ul>
                    {formattingIssues.length > 0 && (
                      <div className="mt-4">
                        <p className="label mb-2" style={{ color: '#DD6B20' }}>Format Issues</p>
                        {formattingIssues.map((fi, i) => (
                          <div key={i} className="text-xs p-2 rounded-lg mb-1 flex items-start gap-1.5"
                            style={{ background: 'rgba(221,107,32,0.04)', border: '1px solid rgba(221,107,32,0.08)', color: 'var(--color-text-secondary)' }}>
                            <AlertTriangle size={9} className="mt-0.5 shrink-0" style={{ color: '#DD6B20' }} /> {fi}
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>

                  {/* Section Coverage */}
                  <GlassCard glowColor="violet" delay={0.4} className="p-5">
                    <h3 className="text-xs font-semibold mb-4 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                      <BookOpen size={13} style={{ color: '#805AD5' }} /> Detected Info
                    </h3>
                    {(parsed.name || parsed.email || parsed.phone) && (
                      <div className="mb-4 p-3 rounded-xl"
                        style={{ background: 'rgba(128,90,213,0.04)', border: '1px solid rgba(128,90,213,0.08)' }}>
                        {parsed.name  && <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{parsed.name}</p>}
                        {parsed.email && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{parsed.email}</p>}
                        {parsed.phone && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{parsed.phone}</p>}
                        {parsed.linkedin && <p className="text-xs" style={{ color: '#5A67D8' }}>{parsed.linkedin}</p>}
                        {parsed.github   && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{parsed.github}</p>}
                      </div>
                    )}
                    <p className="label mb-2">Section Coverage</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allSections.map(({ label, key }) => (
                        <SectionBadge key={key} label={label} filled={!!parsed[key]} />
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Row: Extracted Skills + Section Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Extracted Skills */}
                  <GlassCard glowColor="indigo" delay={0.5} className="p-5">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                      <Code2 size={13} style={{ color: '#5A67D8' }} /> Detected Skills
                      <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--color-text-tertiary)' }}>
                        {extractedSkills.length} found
                      </span>
                    </h3>
                    {extractedSkills.length === 0
                      ? <p className="text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>No recognized skills found. Make sure your skills section uses standard terminology.</p>
                      : (
                        <div className="mt-4 space-y-3">
                          {Object.entries(skillsByCategory).map(([cat, skills]) => (
                            <div key={cat}>
                              <p className="text-xs mb-1.5 flex items-center gap-1"
                                style={{ color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>
                                <CategoryIcon category={cat} /> {cat}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {skills.map(s => <SkillTag key={s} name={s} category={cat} />)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </GlassCard>

                  {/* Section Intelligence */}
                  <GlassCard glowColor="cyan" delay={0.55} className="p-5">
                    <h3 className="text-xs font-semibold mb-4 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                      <BarChart3 size={13} style={{ color: '#38A169' }} /> Section Intelligence
                    </h3>
                    {Object.keys(sectionScores).length === 0
                      ? <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No section data available.</p>
                      : Object.entries(sectionScores).map(([sec, val]) => (
                          <SectionBar key={sec} label={sec} value={val} />
                        ))
                    }
                  </GlassCard>
                </div>

                {/* Row: Missing Skills (only with JD) + Impact Lines + ATS Tips */}
                <div className={`grid grid-cols-1 gap-5 ${hasJD && missingSkills.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>

                  {/* Missing Skills — only when JD provided */}
                  {hasJD && missingSkills.length > 0 && (
                    <GlassCard glowColor="magenta" delay={0.6} className="p-5">
                      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-danger)' }}>
                        <AlertTriangle size={13} /> Missing Skills
                        <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(229,62,62,0.06)', color: 'var(--color-danger)' }}>
                          {missingSkills.length} gaps
                        </span>
                      </h3>
                      <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        Skills in the job description not found in your resume:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.map(s => <MissingSkillTag key={s} name={s} />)}
                      </div>
                    </GlassCard>
                  )}

                  {/* Impact Lines */}
                  <GlassCard glowColor="indigo" delay={0.65} className="p-5">
                    <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                      <Star size={13} style={{ color: '#DD6B20' }} /> Impact Highlights
                    </h3>
                    {impactLines.length === 0 ? (
                      <div className="mt-2">
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          No quantified achievements detected. Add metrics like:
                        </p>
                        <div className="mt-2 space-y-1">
                          {['Reduced latency by 40%', 'Scaled to 1M+ users', 'Cut build time by 3x'].map(ex => (
                            <div key={ex} className="text-xs px-2.5 py-1.5 rounded-lg italic"
                              style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--color-text-tertiary)' }}>"{ex}"</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ul className="space-y-2 mt-1">
                        {impactLines.map((line, i) => (
                          <li key={i} className="text-xs p-2.5 rounded-lg flex items-start gap-2"
                            style={{ background: 'rgba(221,107,32,0.04)', border: '1px solid rgba(221,107,32,0.08)', color: 'var(--color-text-secondary)' }}>
                            <Star size={9} className="mt-0.5 shrink-0" style={{ color: '#DD6B20' }} /> {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>

                  {/* ATS Tips */}
                  <GlassCard glowColor="violet" delay={0.7} className="p-5">
                    <h3 className="text-xs font-semibold mb-3 flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                      <Lightbulb size={13} style={{ color: '#805AD5' }} /> ATS Tips
                    </h3>
                    {atsTips.length === 0
                      ? <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Great job — no major tips needed!</p>
                      : (
                        <ul className="space-y-2">
                          {atsTips.map((tip, i) => (
                            <li key={i} className="text-xs p-2.5 rounded-lg flex items-start gap-2"
                              style={{ background: 'rgba(128,90,213,0.04)', border: '1px solid rgba(128,90,213,0.07)', color: 'var(--color-text-secondary)' }}>
                              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
                                style={{ background: '#805AD5', fontSize: 9, marginTop: 1 }}>{i + 1}</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )
                    }
                  </GlassCard>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

    </Layout>
  );
}

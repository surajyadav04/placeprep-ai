import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Mic, MicOff, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, Bot, FileText, Sparkles, RotateCcw, Award
} from 'lucide-react';
import Layout from '../components/Layout';
import GlassCard from '../components/GlassCard';

const MOCK_QUESTIONS = [
  "Explain the difference between a process and a thread.",
  "How does a hash table work under the hood?",
  "What happens when you type a URL into a browser?",
  "Describe a time you solved a difficult technical problem.",
  "What is the difference between TCP and UDP?"
];

export default function MockInterview() {
  const navigate = useNavigate();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onresult = (event) => {
        let ct = '';
        for (let i = 0; i < event.results.length; i++) ct += event.results[i][0].transcript;
        setTranscript(ct);
      };
      rec.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') alert("Microphone permission was denied.");
      };
      recognitionRef.current = rec;
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) { alert("Speech Recognition not supported. Use Chrome."); return; }
    if (isRecording) { recognitionRef.current.stop(); }
    else { setTranscript(''); setFeedback(null); try { recognitionRef.current.start(); } catch (err) { console.error(err); } }
  };

  const submitAnswer = async () => {
    if (isRecording) recognitionRef.current.stop();
    if (!transcript.trim()) { alert("Please provide an answer before submitting."); return; }
    setIsEvaluating(true); setFeedback(null);
    try {
      const response = await axios.post('http://localhost:8000/api/interview/evaluate', { question: MOCK_QUESTIONS[currentQuestionIdx], answer: transcript });
      setFeedback(response.data);
    } catch (err) {
      console.error("Failed to evaluate", err);
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      let score = wordCount < 15 ? 45 : wordCount > 50 ? 82 : 68;
      let review = wordCount < 15 ? "Your answer was too brief." : wordCount > 50 ? "Great depth! Well structured." : "Good effort, expand on key concepts.";
      setFeedback({ score, review, strengths: ["Clear spoken voice", "Structured attempt"], weaknesses: ["Expand with more keywords", "Check backend connection"], filler_words_count: Math.floor(Math.random() * 4), filler_words_detected: ["like", "um"], ideal_answer: "Backend offline. Ensure FastAPI runs on http://127.0.0.1:8000.", sandbox: true });
    } finally { setIsEvaluating(false); }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx === MOCK_QUESTIONS.length - 1) { navigate('/dashboard'); return; }
    setTranscript(''); setFeedback(null); setCurrentQuestionIdx(p => p + 1);
  };

  const retryQuestion = () => { setTranscript(''); setFeedback(null); };

  return (
    <Layout>
      {/* Sandbox Banner */}
      <AnimatePresence>
        {feedback?.sandbox && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 rounded-xl flex items-start gap-3 text-xs bg-amber-50 border border-amber-200 text-amber-800">
            <AlertCircle className="shrink-0 mt-0.5" size={14} />
            <div>
              <span className="font-semibold">Sandbox Mode</span>
              <span className="text-amber-700/80"> — No Gemini API key. Using local evaluator. Add <code className="px-1 py-0.5 rounded text-xs bg-amber-100 font-mono">GEMINI_API_KEY</code> to backend <code className="font-mono">.env</code> for AI assessments.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Header */}
      <motion.header key={currentQuestionIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="label inline-block">
            Question {currentQuestionIdx + 1} / {MOCK_QUESTIONS.length}
          </span>
          {currentQuestionIdx === MOCK_QUESTIONS.length - 1 && (
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1 font-body">
              <Award size={14} /> Final
            </span>
          )}
        </div>
        <h2 className="text-3xl md:text-5xl font-bold leading-tight font-display text-primary">
          {MOCK_QUESTIONS[currentQuestionIdx]}
        </h2>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 mb-10">

        {/* Left — Recording / Ideal Answer */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {feedback ? (
              <GlassCard key="ideal" glowColor="violet" className="flex-1">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5">
                  <h3 className="text-sm font-bold flex items-center gap-2 font-display text-primary">
                    <Sparkles size={16} className="text-primary" /> AI Ideal Answer
                  </h3>
                  <button onClick={() => { navigator.clipboard.writeText(feedback.ideal_answer); alert("Copied!"); }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-black/5 hover:bg-black/10 transition-colors text-text-secondary">
                    Copy
                  </button>
                </div>
                <div className="flex-1 rounded-xl p-5 overflow-y-auto text-sm bg-surface-base border border-black/5 text-text-secondary leading-relaxed font-body">
                  <p className="whitespace-pre-line">{feedback.ideal_answer}</p>
                </div>
              </GlassCard>
            ) : (
              <GlassCard key="mic" glowColor="indigo" className="flex-1 flex flex-col items-center justify-center p-10 min-h-[300px]">
                <div className="relative mb-8 z-10">
                  <button onClick={toggleRecording} disabled={isEvaluating}
                    className="relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm"
                    style={{
                      background: isRecording ? 'var(--color-primary)' : 'var(--color-surface-base)',
                      border: isRecording ? 'none' : '1px solid rgba(0,0,0,0.08)',
                      cursor: isEvaluating ? 'not-allowed' : 'pointer',
                      opacity: isEvaluating ? 0.5 : 1,
                      transform: isRecording ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isRecording ? '0 10px 40px rgba(99,102,241,0.2)' : 'none',
                    }}>
                    {isRecording ? <Mic size={40} className="text-white" /> : <MicOff size={40} className="text-text-tertiary" />}
                  </button>
                </div>
                <p className="text-base font-bold font-display transition-colors duration-300" style={{ color: isRecording ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {isRecording ? 'Listening…' : 'Tap to speak'}
                </p>
                <p className="text-sm mt-2 text-center max-w-[280px] text-text-tertiary font-body">
                  Speech will be transcribed and evaluated by Gemini AI.
                </p>
              </GlassCard>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {!feedback ? (
            <div className="flex gap-4">
              <button onClick={nextQuestion} disabled={isRecording || isEvaluating} className="px-6 py-3 rounded-full text-sm font-medium text-text-secondary bg-white shadow-sm border border-black/5 hover:bg-black/5 transition-colors disabled:opacity-40">
                Skip
              </button>
              <button onClick={submitAnswer} disabled={isEvaluating || (!transcript.trim() && !isRecording)} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-40">
                {isEvaluating ? <><Loader2 className="animate-spin" size={16} /> Evaluating…</> : 'Submit Answer'}
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button onClick={retryQuestion} className="px-6 py-3 rounded-full text-sm font-medium text-text-secondary bg-white shadow-sm border border-black/5 hover:bg-black/5 transition-colors flex items-center gap-2">
                <RotateCcw size={14} /> Retry
              </button>
              <button onClick={nextQuestion} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm">
                {currentQuestionIdx === MOCK_QUESTIONS.length - 1 ? 'Finish' : 'Next Question'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Right — Transcript + Feedback */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Transcript */}
          <GlassCard glowColor="cyan" delay={0.1} className="flex flex-col min-h-[200px]">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 font-display text-primary">
              <FileText size={16} className="text-primary" /> Transcript
            </h3>
            <div className="flex-1 rounded-xl p-5 overflow-y-auto relative min-h-[100px] bg-surface-base border border-black/5">
              {transcript ? (
                <p className="text-sm text-text-secondary leading-relaxed font-body">{transcript}</p>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-sm italic text-text-muted font-body">Speech appears here in real-time…</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex-1">
                <GlassCard glowColor="amber" className="h-full">
                  <h3 className="text-sm font-bold mb-5 flex items-center gap-2 font-display text-primary">
                    <Bot size={16} className="text-primary" /> AI Evaluation
                  </h3>

                  {/* Score */}
                  <div className="flex items-end gap-2 mb-6 pb-6 border-b border-black/5">
                    <span className="text-5xl font-bold tracking-tight font-display text-primary leading-none">{feedback.score}</span>
                    <span className="text-sm text-text-muted mb-1 font-body">/ 100</span>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      feedback.score >= 80 ? 'bg-green-50 text-green-700 border border-green-200' : 
                      feedback.score >= 65 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {feedback.score >= 80 ? 'Excellent' : feedback.score >= 65 ? 'Good' : 'Practice'}
                    </span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2 font-body">Assessment</p>
                      <p className="text-sm p-4 rounded-xl bg-surface-base border border-black/5 text-text-secondary leading-relaxed font-body">
                        "{feedback.review}"
                      </p>
                    </div>

                    {feedback.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-2 font-body flex items-center gap-1">
                          <CheckCircle2 size={12} /> Strengths
                        </p>
                        <ul className="space-y-1">
                          {feedback.strengths.map((s, i) => (
                            <li key={i} className="text-sm flex items-start gap-2 text-text-secondary font-body">
                              <span className="text-green-500 mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.weaknesses?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 font-body flex items-center gap-1">
                          <AlertCircle size={12} /> Improve
                        </p>
                        <ul className="space-y-1">
                          {feedback.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm flex items-start gap-2 text-text-secondary font-body">
                              <span className="text-amber-500 mt-0.5">•</span>{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

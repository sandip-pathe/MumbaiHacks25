import React, { useState, useEffect } from 'react';
import { AGENT_LOGS } from '../constants';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { CheckCircle, AlertCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface CodeScanProps {
  onComplete: () => void;
}

// Internal Toast
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
      type === 'success' 
        ? 'bg-success/10 border-success/20 text-success' 
        : 'bg-danger/10 border-danger/20 text-danger'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
};

export const CodeScan: React.FC<CodeScanProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [activeLogs, setActiveLogs] = useState<typeof AGENT_LOGS>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Progress Bar Animation
  useEffect(() => {
    const duration = 5500; // slightly longer than logs to ensure smooth 100% hit
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Agent Logs Simulation
  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    
    AGENT_LOGS.forEach((log, index) => {
      const timeout = setTimeout(() => {
        setActiveLogs(prev => [...prev, log]);
        
        // If last log
        if(index === AGENT_LOGS.length - 1) {
          setIsScanning(false);
          setShowToast(true);
        }
      }, log.timestamp);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bgMain p-6">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent2/10 rounded-full blur-[120px]" />

      {showToast && (
        <Toast 
          message="Code scanning complete! Your compliance report is ready." 
          type="success" 
          onClose={() => setShowToast(false)} 
        />
      )}

      <div className="max-w-4xl w-full relative z-10 space-y-8 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="text-center mb-8">
           <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">System Audit In Progress</h1>
           <p className="text-accent3">Our multi-agent system is analyzing your repository.</p>
        </div>

        {/* Progress Loader */}
        <div className="relative w-full bg-white/5 rounded-full h-8 border border-white/10 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
           <div 
             className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-accent1 to-primary bg-[length:200%_100%] animate-[shimmer_2s_infinite] transition-all duration-300 ease-out"
             style={{ width: `${progress}%` }}
           />
           <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono tracking-wider text-white mix-blend-difference z-10">
              Scanning Repository… {progress}%
           </div>
        </div>

        {/* Live Agent Activity Card */}
        <GlassCard className="min-h-[500px] flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center mb-6 relative z-10 border-b border-white/5 pb-4">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 text-white">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-accent1 opacity-75 ${isScanning ? '' : 'hidden'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isScanning ? 'bg-accent1' : 'bg-success'}`}></span>
              </span>
              {isScanning ? 'Live Agent Activity' : 'Audit Complete'}
            </h3>
            <span className="text-xs text-accent3 font-mono">
                {isScanning ? 'Processing...' : 'All Tasks Done'}
            </span>
          </div>

          <div className="relative flex-1 overflow-y-auto custom-scrollbar pr-2">
             {/* Timeline Line */}
             <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-white/10 z-0"></div>

             <div className="space-y-8 relative z-10 pb-4">
                {activeLogs.map((log, idx) => (
                  <div key={log.id} className="flex gap-4 animate-slide-in-right">
                    <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 z-10 shrink-0 bg-bgMain
                      ${idx === activeLogs.length - 1 && isScanning ? 'border-accent1 shadow-[0_0_10px_rgba(0,245,212,0.5)]' : 'border-accent3/50'}
                    `}></div>
                    <div>
                      <div className="text-xs font-bold text-secondary mb-1 uppercase tracking-wide flex items-center gap-2">
                        {log.agent}
                      </div>
                      <div className="text-sm text-accent3 leading-relaxed">
                        {log.message}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isScanning && (
                   <div className="flex gap-4 opacity-50">
                      <div className="mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-white/10 bg-bgMain z-10 shrink-0 animate-pulse"></div>
                      <div className="text-sm text-accent3 italic">Agent thinking...</div>
                   </div>
                )}
             </div>
          </div>
        </GlassCard>

        {/* Completion Section */}
        {!isScanning && (
            <div className="flex flex-col items-center justify-center gap-4 pt-4 animate-fade-in-up">
                <div className="flex items-center gap-2 text-white font-medium text-lg">
                    <ShieldCheck className="text-success" size={24} />
                    Let’s see how compliant you are!
                </div>
                <Button 
                    onClick={onComplete} 
                    className="h-12 px-8 text-base shadow-[0_0_30px_rgba(255,107,155,0.3)] hover:scale-105"
                    icon={<ArrowRight size={18} />}
                >
                    Go to Dashboard
                </Button>
            </div>
        )}

      </div>
    </div>
  );
};
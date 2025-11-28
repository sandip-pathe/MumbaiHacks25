import React, { useState, useEffect } from 'react';
import { RECENT_RUNS, REGULATOR_STATS, VIOLATIONS, AGENT_LOGS } from '../constants';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusPill } from '../components/ui/StatusPill';
import { AlertTriangle, Building2, Clock, ExternalLink, CheckCircle, XCircle, Play, Sparkles, Bell, AlertCircle, X, FileText } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/Button';

interface DashboardProps {
  onSelectRun: (runId: string) => void;
}

// Internal Toast (Consistent with other views)
interface ToastProps {
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-success/10 border-success/20 text-success',
    info: 'bg-accent1/10 border-accent1/20 text-accent1'
  };

  return (
    <div className={`fixed top-6 right-6 z-50 animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${styles[type]}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <Bell size={18} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
};

// Dummy data for small trend chart
const CHART_DATA = [
  { name: 'Mon', score: 80 },
  { name: 'Tue', score: 92 },
  { name: 'Wed', score: 88 },
  { name: 'Thu', score: 95 },
  { name: 'Fri', score: 70 }, // The dip
  { name: 'Sat', score: 85 },
  { name: 'Sun', score: 90 },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'RBI: Master Direction - Know Your Customer (KYC) Direction, 2016 (Updated)', date: 'Oct 15, 2023', pdfUrl: '#' },
  { id: 2, title: 'SEBI: Master Circular for Stock Brokers', date: 'Oct 12, 2023', pdfUrl: '#' },
  { id: 3, title: 'RBI: Framework for Geo-tagging of Payment System Touch Points', date: 'Oct 10, 2023', pdfUrl: '#' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onSelectRun }) => {
  const [activeLogs, setActiveLogs] = useState<typeof AGENT_LOGS>([]);
  const [activeRegulator, setActiveRegulator] = useState<'RBI' | 'SEBI'>('RBI');
  const [isScanning, setIsScanning] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Simulate Agent typing effect
  useEffect(() => {
    startAgentSimulation();
  }, []);

  // Simulate incoming RSS feed notification
  useEffect(() => {
    const timer = setTimeout(() => {
      const newNotif = { 
        id: 4, 
        title: 'SEBI: New Disclosure Norms for FPIs', 
        date: 'Just now', 
        pdfUrl: '#' 
      };
      setNotifications(prev => [newNotif, ...prev]);
      setToast({ message: `New Policy Notification Added: ${newNotif.title}`, type: 'info' });
    }, 5000); // 5 seconds delay to simulate real-time update
    return () => clearTimeout(timer);
  }, []);

  const startAgentSimulation = () => {
    setIsScanning(true);
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    setActiveLogs([]); // Reset
    
    AGENT_LOGS.forEach((log, index) => {
      const timeout = setTimeout(() => {
        setActiveLogs(prev => [...prev, log]);
        if(index === AGENT_LOGS.length - 1) setIsScanning(false);
      }, log.timestamp);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  };

  const filteredViolations = VIOLATIONS.filter(v => v.regulator === activeRegulator);
  const currentRegulatorStats = REGULATOR_STATS.find(r => r.regulator === activeRegulator);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Demo / Controls Banner */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-white">Compliance Overview</h2>
          <div className="flex items-center gap-2 mt-1">
             <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/20 text-white uppercase tracking-wider flex items-center gap-1">
               <Sparkles size={10} className="text-primary" /> Multi-Agent System Active
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-accent3">
             <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> RBI
             <span className="w-1.5 h-1.5 rounded-full bg-accent1"></span> SEBI
          </div>
          <Button 
            onClick={startAgentSimulation} 
            variant="primary" 
            className={`h-10 text-sm px-4 ${isScanning ? 'opacity-80' : ''}`}
            icon={isScanning ? <span className="animate-spin text-lg">⟳</span> : <Play size={14} fill="currentColor" />}
          >
            {isScanning ? 'Scanning...' : 'Re-run Scan'}
          </Button>
        </div>
      </div>

      {/* Top Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-accent3 text-sm font-medium mb-1">Last Scan Result</h3>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-heading font-bold text-white">85%</span>
                <span className="text-danger text-sm font-mono">2 Critical</span>
              </div>
            </div>
            <div className="p-2 bg-danger/10 rounded-lg text-danger border border-danger/20">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-auto h-10 w-full opacity-50">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                   <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <Tooltip cursor={false} content={<></>} />
                   <Area type="monotone" dataKey="score" stroke="#EF4444" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-40">
           <div className="flex justify-between items-start">
            <div>
              <h3 className="text-accent3 text-sm font-medium mb-1">Regulators Covered</h3>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md text-sm font-semibold">RBI</span>
                <span className="px-3 py-1 bg-accent1/20 text-accent1 border border-accent1/30 rounded-md text-sm font-semibold">SEBI</span>
              </div>
            </div>
            <div className="p-2 bg-accent2/10 rounded-lg text-accent2 border border-accent2/20">
              <Building2 size={20} />
            </div>
          </div>
           <div className="mt-auto text-sm text-accent3">
             Module coverage: <span className="text-white">UPI, Investments, KYC</span>
           </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-40">
           <div className="flex justify-between items-start">
            <div>
              <h3 className="text-accent3 text-sm font-medium mb-1">Last Run</h3>
              <div className="mt-2">
                 <div className="text-2xl font-heading font-bold text-white">2 mins ago</div>
                 <div className="text-xs font-mono text-accent3 mt-1">SHA: abcd1234</div>
              </div>
            </div>
            <div className="p-2 bg-accent1/10 rounded-lg text-accent1 border border-accent1/20">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-2 text-xs text-success">
             <CheckCircle size={12} />
             <span>Pipeline Healthy</span>
          </div>
        </GlassCard>
      </div>

      {/* Middle Section: Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Runs */}
        <GlassCard className="lg:col-span-2 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading font-semibold text-lg">Recent Runs</h3>
            <button className="text-xs text-primary hover:text-primary/80 transition-colors">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-accent3 text-xs uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="pb-3 font-medium pl-2">Status</th>
                  <th className="pb-3 font-medium">Commit</th>
                  <th className="pb-3 font-medium">Message</th>
                  <th className="pb-3 font-medium text-right pr-2">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {RECENT_RUNS.map((run) => (
                  <tr 
                    key={run.id} 
                    onClick={() => onSelectRun(run.id)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 pl-2">
                      <StatusPill status={run.status} size="sm" />
                    </td>
                    <td className="py-4 font-mono text-accent3 group-hover:text-white transition-colors">{run.commitSha}</td>
                    <td className="py-4 font-medium text-white">{run.commitMessage}</td>
                    <td className="py-4 text-right text-accent3 pr-2">{run.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Agent Activity Log */}
        <GlassCard className="min-h-[400px] flex flex-col relative">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-accent1 opacity-75 ${isScanning ? '' : 'hidden'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isScanning ? 'bg-accent1' : 'bg-accent3'}`}></span>
              </span>
              Live Agent Activity
            </h3>
            <span className="text-xs text-accent3 font-mono">Multi-Agent Mode</span>
          </div>

          <div className="relative flex-1 overflow-hidden">
             {/* Timeline Line */}
             <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-white/10 z-0"></div>

             <div className="space-y-6 relative z-10">
                {activeLogs.map((log, idx) => (
                  <div key={log.id} className="flex gap-4 animate-slide-in-right">
                    <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 z-10 shrink-0 bg-bgMain
                      ${idx === activeLogs.length - 1 && isScanning ? 'border-accent1 shadow-[0_0_10px_rgba(0,245,212,0.5)]' : 'border-accent3/50'}
                    `}></div>
                    <div>
                      <div className="text-xs font-bold text-secondary mb-0.5 uppercase tracking-wide">
                        {log.agent}
                      </div>
                      <div className="text-sm text-accent3 leading-relaxed">
                        {log.message}
                      </div>
                    </div>
                  </div>
                ))}
                {activeLogs.length < AGENT_LOGS.length && (
                   <div className="flex gap-4 opacity-50">
                      <div className="mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-white/10 bg-bgMain z-10 shrink-0 animate-pulse"></div>
                      <div className="text-sm text-accent3 italic">Agent thinking...</div>
                   </div>
                )}
             </div>
          </div>
        </GlassCard>
      </div>

      {/* Violations Section */}
      <div>
         <div className="flex items-center gap-4 mb-6">
            <h3 className="font-heading font-semibold text-xl">Compliance Violations</h3>
            <div className="flex bg-bgCard border border-white/10 rounded-lg p-1">
               <button 
                 onClick={() => setActiveRegulator('RBI')}
                 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeRegulator === 'RBI' ? 'bg-primary/20 text-primary shadow-sm' : 'text-accent3 hover:text-white'}`}
               >
                 RBI
               </button>
               <button 
                 onClick={() => setActiveRegulator('SEBI')}
                 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeRegulator === 'SEBI' ? 'bg-secondary/20 text-secondary shadow-sm' : 'text-accent3 hover:text-white'}`}
               >
                 SEBI
               </button>
            </div>
         </div>

         <GlassCard className={`border-t-4 ${activeRegulator === 'RBI' ? 'border-t-primary' : 'border-t-accent1'}`}>
            <div className="flex flex-wrap gap-6 mb-8 border-b border-white/5 pb-6">
               <div className="flex items-center gap-2">
                  <span className="text-accent3 text-sm">Critical:</span>
                  <span className="text-danger font-bold text-lg">{currentRegulatorStats?.critical}</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-accent3 text-sm">Medium:</span>
                  <span className="text-warning font-bold text-lg">{currentRegulatorStats?.medium}</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-accent3 text-sm">Passed:</span>
                  <span className="text-success font-bold text-lg">{currentRegulatorStats?.passed}</span>
               </div>
            </div>

            <div className="grid gap-4">
               {filteredViolations.map((violation) => (
                  <div key={violation.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer hover:bg-white/10">
                     <div className="flex items-start gap-4">
                        <div className="mt-1">
                           {violation.status === 'FAIL' && <XCircle className="text-danger" size={20} />}
                           {violation.status === 'PASS' && <CheckCircle className="text-success" size={20} />}
                           {violation.status === 'NOT_INTEGRATED' && <AlertTriangle className="text-accent3" size={20} />}
                        </div>
                        <div>
                           <div className="font-medium text-white group-hover:text-primary transition-colors">{violation.rule}</div>
                           <div className="text-xs font-mono text-accent3 mt-1 flex items-center gap-2">
                              <span>{violation.file}</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-6 mt-4 md:mt-0 pl-9 md:pl-0">
                        <StatusPill status={violation.status} />
                        {violation.jiraId !== '-' && (
                           <div className="flex items-center gap-1 text-xs text-accent2 bg-accent2/10 px-2 py-1 rounded border border-accent2/20 hover:bg-accent2/20 transition-colors">
                              <ExternalLink size={10} />
                              {violation.jiraId}
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </GlassCard>
      </div>

      {/* Policy Notifications Section */}
      <div>
         <div className="flex items-center gap-4 mb-6">
            <h3 className="font-heading font-semibold text-xl">Policy Notifications</h3>
            <div className="flex items-center gap-2 text-xs text-accent1 bg-accent1/10 px-2 py-1 rounded border border-accent1/20 animate-pulse">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent1 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent1"></span>
               </span>
               Live Updates
            </div>
         </div>

         <GlassCard className="p-0 overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead>
                         <tr className="bg-white/5 border-b border-white/10">
                             <th className="py-4 px-6 text-xs font-bold text-accent1 uppercase tracking-wider w-3/5">Notification Name</th>
                             <th className="py-4 px-6 text-xs font-bold text-accent1 uppercase tracking-wider">Date</th>
                             <th className="py-4 px-6 text-xs font-bold text-accent1 uppercase tracking-wider text-center">Document</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                         {notifications.map((notif, index) => (
                             <tr key={notif.id} className="group hover:bg-white/5 transition-colors animate-fade-in">
                                 <td className="py-4 px-6">
                                     <div className="text-sm font-medium text-white group-hover:text-accent1 transition-colors">{notif.title}</div>
                                 </td>
                                 <td className="py-4 px-6">
                                     <div className="text-sm text-accent3 font-mono">{notif.date}</div>
                                 </td>
                                 <td className="py-4 px-6 text-center">
                                     <a 
                                        href={notif.pdfUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-block transform hover:scale-125 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-200 text-2xl"
                                        title="Open PDF"
                                     >
                                         📄
                                     </a>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </GlassCard>
      </div>
    </div>
  );
};
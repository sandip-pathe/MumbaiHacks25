import React from 'react';
import { Run, ComplianceStatus } from '../types';
import { RECENT_RUNS, AGENT_LOGS } from '../constants';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusPill } from '../components/ui/StatusPill';
import { ArrowLeft, GitCommit, User, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface RunDetailProps {
  runId: string;
  onBack: () => void;
}

export const RunDetail: React.FC<RunDetailProps> = ({ runId, onBack }) => {
  const run = RECENT_RUNS.find(r => r.id === runId);

  if (!run) return <div>Run not found</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <Button variant="outline" onClick={onBack} className="pl-4 pr-6 py-2 text-sm h-auto border-white/20 text-accent3 hover:text-white mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Button>

      {/* Header Card */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <StatusPill status={run.status} />
                 <span className="font-mono text-accent3 text-sm">#{run.id}</span>
              </div>
              <h1 className="text-3xl font-heading font-bold text-white mb-4">{run.commitMessage}</h1>
              <div className="flex flex-wrap gap-6 text-sm text-accent3">
                 <div className="flex items-center gap-2">
                    <GitCommit size={16} />
                    <span className="font-mono">{run.commitSha}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{run.author}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{run.time}</span>
                 </div>
              </div>
           </div>
           <Button>View in GitHub</Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Timeline */}
         <div className="lg:col-span-1">
            <h3 className="font-heading font-semibold text-lg mb-4 text-accent3">Agent Execution Timeline</h3>
            <div className="relative pl-4 border-l border-white/10 space-y-8">
               {AGENT_LOGS.map((log, idx) => (
                  <div key={log.id} className="relative">
                     <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-bgCard border-2 border-accent1 shadow-[0_0_10px_rgba(0,245,212,0.3)]"></div>
                     <div className="text-xs font-bold text-accent1 mb-1 uppercase">{log.agent}</div>
                     <div className="text-sm text-gray-400">{log.message}</div>
                     <div className="text-[10px] text-gray-600 mt-1 font-mono">+{log.timestamp}ms</div>
                  </div>
               ))}
            </div>
         </div>

         {/* Checks */}
         <div className="lg:col-span-2">
            <h3 className="font-heading font-semibold text-lg mb-4 text-accent3">Checks Performed</h3>
            <GlassCard>
               <div className="space-y-1">
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <span className="text-white">RBI – UPI New User Limits</span>
                     <StatusPill status={ComplianceStatus.FAIL} size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <span className="text-white">SEBI – Trade Risk Disclosure</span>
                     <StatusPill status={ComplianceStatus.FAIL} size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <span className="text-white">RBI – Data Localization</span>
                     <StatusPill status={ComplianceStatus.PASS} size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-4">
                     <span className="text-white">SEBI – Fee Disclosure</span>
                     <StatusPill status={ComplianceStatus.PASS} size="sm" />
                  </div>
               </div>
            </GlassCard>
         </div>
      </div>
    </div>
  );
};
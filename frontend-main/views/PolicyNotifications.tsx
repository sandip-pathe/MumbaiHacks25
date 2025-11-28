import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Bell, CheckCircle, X, Sparkles, FileText, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';

// --- Types & Data ---

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'RBI: Master Direction - Know Your Customer (KYC) Direction, 2016 (Updated)', date: 'Oct 15, 2023', pdfUrl: '#', type: 'RBI' },
  { id: 2, title: 'SEBI: Master Circular for Stock Brokers', date: 'Oct 12, 2023', pdfUrl: '#', type: 'SEBI' },
  { id: 3, title: 'RBI: Framework for Geo-tagging of Payment System Touch Points', date: 'Oct 10, 2023', pdfUrl: '#', type: 'RBI' },
  { id: 4, title: 'IRDAI: Cyber Security Guidelines for Insurance Companies', date: 'Oct 08, 2023', pdfUrl: '#', type: 'IRDAI' },
  { id: 5, title: 'RBI: Lending Service Provider (LSP) Guidelines', date: 'Oct 05, 2023', pdfUrl: '#', type: 'RBI' },
];

// Internal Toast
interface ToastProps {
  message: string;
  type: 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md bg-accent1/10 border-accent1/20 text-accent1">
      <Bell size={18} />
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
};

export const PolicyNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState<{message: string, type: 'info'} | null>(null);
  const [filter, setFilter] = useState('ALL');

  // Simulate incoming RSS feed notification
  useEffect(() => {
    const timer = setTimeout(() => {
      const newNotif = { 
        id: 99, 
        title: 'SEBI: New Disclosure Norms for FPIs', 
        date: 'Just now', 
        pdfUrl: '#',
        type: 'SEBI'
      };
      setNotifications(prev => [newNotif, ...prev]);
      setToast({ message: `New Policy Notification Added: ${newNotif.title}`, type: 'info' });
    }, 2000); // 2 seconds delay for demo
    return () => clearTimeout(timer);
  }, []);

  const filteredData = filter === 'ALL' ? notifications : notifications.filter(n => n.type === filter);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Policy Notifications</h1>
          <p className="text-accent3">Real-time updates from regulatory bodies (RBI, SEBI, IRDAI).</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-accent1 bg-accent1/10 px-3 py-1.5 rounded-full border border-accent1/20 animate-pulse">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent1 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent1"></span>
           </span>
           Live RSS Feed Active
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden min-h-[600px] flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5">
             <div className="flex items-center gap-2 bg-bgMain/50 border border-white/10 rounded-lg px-3 py-2 w-full md:w-64">
                <Search size={16} className="text-accent3" />
                <input type="text" placeholder="Search updates..." className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600" />
             </div>
             
             <div className="flex gap-2">
                {['ALL', 'RBI', 'SEBI', 'IRDAI'].map(f => (
                   <button
                     key={f}
                     onClick={() => setFilter(f)}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === f ? 'bg-primary text-bgMain shadow-[0_0_10px_rgba(255,107,155,0.4)]' : 'bg-white/5 text-accent3 hover:text-white'}`}
                   >
                     {f}
                   </button>
                ))}
             </div>
          </div>

          <div className="overflow-x-auto flex-1">
             <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="bg-white/5 border-b border-white/10">
                         <th className="py-4 px-6 text-xs font-bold text-accent1 uppercase tracking-wider w-16">Source</th>
                         <th className="py-4 px-6 text-xs font-bold text-accent1 uppercase tracking-wider">Notification Name</th>
                         <th className="py-4 px-6 text-xs font-bold text-accent1 uppercase tracking-wider w-32">Date</th>
                         <th className="py-4 px-6 text-xs font-bold text-accent1 uppercase tracking-wider w-24 text-center">PDF</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                     {filteredData.map((notif) => (
                         <tr key={notif.id} className="group hover:bg-white/5 transition-colors animate-fade-in">
                             <td className="py-4 px-6">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                  notif.type === 'RBI' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  notif.type === 'SEBI' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                  {notif.type}
                                </span>
                             </td>
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
          
          <div className="p-4 border-t border-white/10 text-center text-xs text-accent3 bg-white/5">
             Auto-refreshing every 5 minutes from official RSS sources.
          </div>
      </GlassCard>
    </div>
  );
};
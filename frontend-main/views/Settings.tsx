import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { User, Github, Ticket, Bell, CheckCircle, AlertCircle, X, Loader2, GitBranch, Briefcase } from 'lucide-react';

// Internal Toast
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-success/10 border-success/20 text-success',
    error: 'bg-danger/10 border-danger/20 text-danger',
    info: 'bg-accent1/10 border-accent1/20 text-accent1'
  };

  return (
    <div className={`fixed top-6 right-6 z-50 animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${styles[type]}`}>
      {type === 'success' && <CheckCircle size={18} />}
      {type === 'error' && <AlertCircle size={18} />}
      {type === 'info' && <Bell size={18} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
};

export const Settings: React.FC = () => {
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // --- 1. Account Control State ---
  const [account, setAccount] = useState({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@fintech.com',
    companyName: 'Acme Financial'
  });
  const [savingAccount, setSavingAccount] = useState(false);

  // --- 2. GitHub Control State ---
  const [githubUser] = useState('jane-doe-dev');
  const [repos] = useState(['fintech-org/upi-gateway', 'fintech-org/kyc-service', 'fintech-org/risk-engine']);
  const [selectedRepo, setSelectedRepo] = useState(repos[0]);
  const [updatingRepo, setUpdatingRepo] = useState(false);

  // --- 3. Jira Config State ---
  const [jiraUser] = useState('jane.doe@acme.atlassian.net');
  const [projects] = useState(['FIN-101 (Compliance)', 'DEV-202 (Core Banking)', 'OPS-303 (Infrastructure)']);
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [updatingJira, setUpdatingJira] = useState(false);

  // --- 4. Notifications State ---
  const [notifications, setNotifications] = useState({
    regulatory: true,
    jira: true,
    runs: false
  });

  // Handlers
  const handleAccountSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setTimeout(() => {
      setSavingAccount(false);
      setToast({ message: "Account details updated successfully.", type: 'success' });
    }, 1000);
  };

  const handleUpdateRepo = () => {
    setUpdatingRepo(true);
    setTimeout(() => {
      setUpdatingRepo(false);
      setToast({ message: "Repository updated successfully.", type: 'success' });
    }, 1000);
  };

  const handleUpdateJira = () => {
    setUpdatingJira(true);
    setTimeout(() => {
      setUpdatingJira(false);
      setToast({ message: "Jira project updated successfully.", type: 'success' });
    }, 1000);
  };

  const toggleNotification = (key: keyof typeof notifications, label: string) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));
    setToast({ 
      message: `${label} Alerts ${newValue ? 'Enabled' : 'Disabled'}`, 
      type: 'info' 
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Settings</h1>
        <p className="text-accent3">Manage your account, integrations, and preferences.</p>
      </div>

      {/* --- SECTION 1: ACCOUNT CONTROL --- */}
      <GlassCard className="animate-fade-up">
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
             <User size={20} />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-white">Account Control</h2>
            <p className="text-xs text-accent3">Manage your account details</p>
          </div>
        </div>

        <form onSubmit={handleAccountSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">First Name</label>
              <input 
                type="text" 
                value={account.firstName}
                onChange={(e) => setAccount({...account, firstName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">Last Name</label>
              <input 
                type="text" 
                value={account.lastName}
                onChange={(e) => setAccount({...account, lastName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 opacity-60">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">Email (Read-only)</label>
              <input 
                type="email" 
                value={account.email}
                readOnly
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">Company Name</label>
              <input 
                type="text" 
                value={account.companyName}
                onChange={(e) => setAccount({...account, companyName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button disabled={savingAccount}>
              {savingAccount ? <><Loader2 size={16} className="animate-spin mr-2"/> Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* --- SECTION 2: GITHUB REPOSITORY CONTROL --- */}
      <GlassCard className="animate-fade-up-delay-1">
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
             <Github size={20} />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-white">GitHub Repository Control</h2>
            <p className="text-xs text-accent3">Switch repositories or connect a different GitHub account</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Github size={16} />
               </div>
               <div>
                  <div className="text-sm font-medium text-white">Connected as <span className="text-accent1">{githubUser}</span></div>
                  <div className="text-xs text-accent3">Access granted to 3 repositories</div>
               </div>
            </div>
            <Button variant="outline" className="text-xs px-3 h-8">Change Account</Button>
          </div>

          <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">Select Active Repository</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3" size={16} />
                  <select 
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-secondary/50 focus:bg-white/10 focus:outline-none transition-all"
                  >
                    {repos.map(r => <option key={r} value={r} className="bg-bgCard text-white">{r}</option>)}
                  </select>
                </div>
                <Button onClick={handleUpdateRepo} disabled={updatingRepo}>
                   {updatingRepo ? <Loader2 size={16} className="animate-spin"/> : 'Update Repository'}
                </Button>
              </div>
          </div>
        </div>
      </GlassCard>

      {/* --- SECTION 3: JIRA CONFIGURATION --- */}
      <GlassCard className="animate-fade-up-delay-2">
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <div className="p-2 bg-accent1/10 rounded-lg text-accent1">
             <Ticket size={20} />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-white">Jira Integration</h2>
            <p className="text-xs text-accent3">Manage Jira account and project mapping</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-accent1/10 flex items-center justify-center text-accent1">
                  <Ticket size={16} />
               </div>
               <div>
                  <div className="text-sm font-medium text-white">Connected as <span className="text-accent1">{jiraUser}</span></div>
                  <div className="text-xs text-accent3">Jira Cloud Instance</div>
               </div>
            </div>
            <Button variant="outline" className="text-xs px-3 h-8">Change Account</Button>
          </div>

          <div className="space-y-2">
              <label className="text-xs font-bold text-accent3 uppercase tracking-wider">Select Jira Project</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3" size={16} />
                  <select 
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-accent1/50 focus:bg-white/10 focus:outline-none transition-all"
                  >
                    {projects.map(p => <option key={p} value={p} className="bg-bgCard text-white">{p}</option>)}
                  </select>
                </div>
                <Button onClick={handleUpdateJira} disabled={updatingJira} variant="primary">
                   {updatingJira ? <Loader2 size={16} className="animate-spin"/> : 'Update Config'}
                </Button>
              </div>
          </div>
        </div>
      </GlassCard>

      {/* --- SECTION 4: NOTIFICATION PREFERENCES --- */}
      <GlassCard className="animate-fade-up-delay-2">
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <div className="p-2 bg-accent2/10 rounded-lg text-accent2">
             <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-white">Notifications</h2>
            <p className="text-xs text-accent3">Control alerts and automation notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleItem 
            label="Regulatory Updates Alerts" 
            checked={notifications.regulatory} 
            onChange={() => toggleNotification('regulatory', 'Regulatory')}
          />
          <ToggleItem 
            label="Jira Ticket Alerts" 
            checked={notifications.jira} 
            onChange={() => toggleNotification('jira', 'Jira')}
          />
          <ToggleItem 
            label="Compliance Run Alerts" 
            checked={notifications.runs} 
            onChange={() => toggleNotification('runs', 'Compliance Run')}
          />
        </div>
      </GlassCard>

    </div>
  );
};

// Helper Component for Toggle Switch
const ToggleItem: React.FC<{ label: string, checked: boolean, onChange: () => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
     <span className="text-sm font-medium text-white">{label}</span>
     <button 
       onClick={onChange}
       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-accent1 shadow-[0_0_10px_rgba(0,245,212,0.4)]' : 'bg-white/10'}`}
     >
       <span 
         className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} 
       />
     </button>
  </div>
);
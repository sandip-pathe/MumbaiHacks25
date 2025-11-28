import React, { useState } from 'react';
import { Splash } from './views/Splash';
import { Onboarding } from './views/Onboarding';
import { CodeScan } from './views/CodeScan';
import { Dashboard } from './views/Dashboard';
import { RunDetail } from './views/RunDetail';
import { Settings } from './views/Settings';
import { PolicyNotifications } from './views/PolicyNotifications';
import { AuthLanding, Login, Register } from './views/Auth';
import { LayoutDashboard, History, Ticket, FileCheck, Bell, Settings as SettingsIcon, Search } from 'lucide-react';

type ViewState = 'SPLASH' | 'AUTH_LANDING' | 'AUTH_LOGIN' | 'AUTH_REGISTER' | 'ONBOARDING' | 'CODE_SCAN' | 'DASHBOARD' | 'RUN_DETAIL' | 'SETTINGS' | 'POLICY_NOTIFICATIONS';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('SPLASH');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Initial Splash Actions
  const handleStart = () => {
    setView('AUTH_LANDING');
  };

  const handleSignIn = () => {
    setView('AUTH_LOGIN');
  };

  // Auth Navigation
  const handleAuthNavigate = (target: 'LANDING' | 'LOGIN' | 'REGISTER' | 'ONBOARDING') => {
    switch(target) {
      case 'LANDING': setView('AUTH_LANDING'); break;
      case 'LOGIN': setView('AUTH_LOGIN'); break;
      case 'REGISTER': setView('AUTH_REGISTER'); break;
      case 'ONBOARDING': setView('ONBOARDING'); break;
    }
  };

  const handleOnboardingComplete = () => {
    setView('CODE_SCAN');
  };

  const handleScanComplete = () => {
    setView('DASHBOARD');
  };

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    setView('RUN_DETAIL');
  };

  const handleBackToDashboard = () => {
    setView('DASHBOARD');
    setSelectedRunId(null);
  };

  const handleNavigateToSettings = () => {
    setView('SETTINGS');
  };

  const handleNavigateToPolicies = () => {
    setView('POLICY_NOTIFICATIONS');
  };

  if (view === 'SPLASH') {
    return <Splash onStart={handleStart} onSignIn={handleSignIn} />;
  }

  if (view === 'AUTH_LANDING') {
    return <AuthLanding onNavigate={handleAuthNavigate} />;
  }

  if (view === 'AUTH_LOGIN') {
    return <Login onNavigate={handleAuthNavigate} />;
  }

  if (view === 'AUTH_REGISTER') {
    return <Register onNavigate={handleAuthNavigate} />;
  }

  if (view === 'ONBOARDING') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === 'CODE_SCAN') {
    return <CodeScan onComplete={handleScanComplete} />;
  }

  return (
    <div className="min-h-screen flex bg-bgMain text-white selection:bg-primary/30 animate-fade-in">
      {/* Sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 bg-bgCard/50 backdrop-blur-xl border-r border-white/5 z-50 hidden md:flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-bgMain shadow-[0_0_15px_rgba(255,107,155,0.4)]">
              R
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl tracking-tight">ReguPulse</h1>
              <p className="text-[10px] text-accent3 uppercase tracking-wider">AI Compliance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            active={view === 'DASHBOARD' || view === 'RUN_DETAIL'} 
            onClick={handleBackToDashboard} 
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Recent Runs" 
            active={false} 
          />
          <NavItem 
            icon={<Ticket size={20} />} 
            label="Jira Tickets" 
            active={false} 
          />
          <NavItem 
            icon={<FileCheck size={20} />} 
            label="Audit Report" 
            active={false} 
          />
          <NavItem 
            icon={<Bell size={20} />} 
            label="Policy Notifications" 
            active={view === 'POLICY_NOTIFICATIONS'}
            onClick={handleNavigateToPolicies}
          />
          <NavItem 
            icon={<SettingsIcon size={20} />} 
            label="Settings" 
            active={view === 'SETTINGS'} 
            onClick={handleNavigateToSettings}
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-xl p-4">
             <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
               <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
               System Operational
             </div>
             <div className="text-xs text-accent3">5 Agents Active</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen relative">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-bgMain/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6 md:px-10">
          <div className="md:hidden font-heading font-bold text-xl">ReguPulse</div>
          
          <div className="hidden md:block">
            {/* Spacer for where search used to be */}
          </div>

          <div className="flex items-center gap-6">
             <div className="relative text-accent3 hover:text-white cursor-pointer transition-colors">
                <Bell size={20} />
                <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-bgMain"></div>
             </div>
             <div className="h-8 w-8 rounded-full bg-gradient-to-r from-accent1 to-blue-500 flex items-center justify-center text-xs font-bold text-bgMain shadow-lg">
                DU
             </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {view === 'DASHBOARD' && <Dashboard onSelectRun={handleSelectRun} />}
          {view === 'RUN_DETAIL' && selectedRunId && <RunDetail runId={selectedRunId} onBack={handleBackToDashboard} />}
          {view === 'SETTINGS' && <Settings />}
          {view === 'POLICY_NOTIFICATIONS' && <PolicyNotifications />}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
    ${active 
      ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,107,155,0.1)]' 
      : 'text-accent3 hover:bg-white/5 hover:text-white'
    }`}
  >
    <span className={`${active ? 'text-primary' : 'text-accent3 group-hover:text-white'}`}>
      {icon}
    </span>
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default App;
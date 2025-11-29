import React from 'react';
import { Button } from '../components/ui/Button';
import { ArrowRight, CheckCircle2, Bot, FileSearch, Scale, Ticket, ClipboardList, MessageSquare, Code, ShieldAlert, BarChart3, RefreshCw } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

interface SplashProps {
  onStart: () => void;
  onSignIn?: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onStart, onSignIn }) => {
  
  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-bgMain relative overflow-x-hidden text-white">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-primary/10 via-bgMain to-bgMain pointer-events-none opacity-50"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent1/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-bgMain shadow-lg">R</div>
          <span className="font-heading font-bold text-xl tracking-tight">ReguPulse</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-accent3">
          <a href="#features" onClick={scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">Features</a>
          <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">How it works</a>
          <a href="#agents" onClick={scrollToSection('agents')} className="hover:text-white transition-colors cursor-pointer">Agents</a>
        </div>
        <Button onClick={onSignIn || onStart} className="h-10 px-5 text-sm">Sign In</Button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent1/30 bg-accent1/5 text-accent1 text-xs font-mono mb-8 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent1 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent1"></span>
            </span>
            Live Compliance Engine v2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight mb-6 leading-[1.1]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-accent2 to-white">
              ReguPulse
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-light text-white/90 mb-8 max-w-3xl mx-auto font-heading">
            AI-powered compliance for fintech code — <span className="text-primary font-normal">RBI, SEBI & more.</span>
          </h2>

          <div className="flex flex-col gap-3 text-lg text-accent3 mb-10 max-w-2xl mx-auto">
             <div className="flex items-center gap-3 justify-center">
                <CheckCircle2 className="text-accent1" size={20} />
                <span>Automatically analyzes your GitHub repositories for compliance violations.</span>
             </div>
             <div className="flex items-center gap-3 justify-center">
                <CheckCircle2 className="text-accent1" size={20} />
                <span>Auto-creates Jira tickets for confirmed issues.</span>
             </div>
             <div className="flex items-center gap-3 justify-center">
                <CheckCircle2 className="text-accent1" size={20} />
                <span>Generates complete audit reports for every run.</span>
             </div>
          </div>

          <div className="inline-block p-[1px] rounded-xl bg-gradient-to-r from-primary/50 to-secondary/50 mb-12 animate-fade-up-delay-1">
             <div className="px-6 py-3 rounded-xl bg-bgMain/90 backdrop-blur-md">
                <p className="font-medium text-white">
                   Human validation is built into every workflow — <span className="text-secondary">experts stay in control.</span>
                </p>
             </div>
          </div>

          <div className="animate-fade-up-delay-2 flex flex-col md:flex-row items-center justify-center gap-4">
            <Button onClick={onStart} icon={<ArrowRight size={20} />} className="text-lg px-10 py-4 h-auto shadow-[0_0_40px_rgba(255,107,155,0.3)]">
              Get Started
            </Button>
            <a 
              href="#how-it-works" 
              onClick={scrollToSection('how-it-works')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-heading font-semibold transition-all duration-300 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 text-lg cursor-pointer"
            >
              How it Works
            </a>
          </div>
        </div>
      </section>

      {/* --- WORKFLOW SECTION --- */}
      <section id="how-it-works" className="w-full bg-bgCard/30 border-y border-white/5 py-16 backdrop-blur-sm relative z-10 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-4 text-center z-10 group">
                 <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/10 group-hover:border-accent1/50 transition-all duration-300 shadow-lg">
                    <Code size={32} />
                 </div>
                 <div className="font-heading font-semibold text-lg">GitHub Push</div>
              </div>

              {/* Arrow */}
              <div className="hidden md:block h-[1px] flex-1 bg-white/10 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent1 to-transparent w-1/2 animate-[shimmer_2s_infinite] translate-x-[-100%]"></div>
              </div>
              <ArrowRight className="md:hidden text-accent3 rotate-90 md:rotate-0" />

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-4 text-center z-10 group">
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-bgCard border border-primary/50 flex items-center justify-center text-primary shadow-[0_0_25px_rgba(255,107,155,0.2)] animate-pulse-slow">
                    <ShieldAlert size={32} />
                 </div>
                 <div className="font-heading font-semibold text-lg text-primary">Compliance Check</div>
              </div>

              {/* Arrow */}
              <div className="hidden md:block h-[1px] flex-1 bg-white/10"></div>
              <ArrowRight className="md:hidden text-accent3 rotate-90 md:rotate-0" />

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-4 text-center z-10 group">
                 <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/10 group-hover:border-accent1/50 transition-all duration-300 shadow-lg">
                    <Ticket size={32} />
                 </div>
                 <div className="font-heading font-semibold text-lg">Jira Tickets</div>
              </div>

              {/* Arrow */}
              <div className="hidden md:block h-[1px] flex-1 bg-white/10"></div>
              <ArrowRight className="md:hidden text-accent3 rotate-90 md:rotate-0" />

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-4 text-center z-10 group">
                 <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/10 group-hover:border-accent1/50 transition-all duration-300 shadow-lg">
                    <ClipboardList size={32} />
                 </div>
                 <div className="font-heading font-semibold text-lg">Auto Audit Report</div>
              </div>
           </div>
        </div>
      </section>

      {/* --- MULTI-AGENT SECTION --- */}
      <section id="agents" className="py-24 max-w-7xl mx-auto px-6 relative z-10 overflow-hidden scroll-mt-24">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Our Multi-Agent System</h2>
            <p className="text-accent3 max-w-2xl mx-auto">Specialized AI agents working in harmony to ensure zero-risk deployments.</p>
         </div>

         <div className="relative w-full h-[700px] hidden md:block">
             {/* Background Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 via-accent1/5 to-primary/5 rounded-full blur-[100px] opacity-40"></div>
            
             {/* Connecting Lines Layer */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
               <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#FF6B9B" stopOpacity="0.4" />
                     <stop offset="100%" stopColor="#00F5D4" stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="glow">
                     <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                     <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                     </feMerge>
                  </filter>
               </defs>
               
               {/* 6-Point Star / Hexagon Connections from Center (50%, 50%) */}
               
               {/* 1. Regulation Reader (Top) - 50%, 15% */}
               <line x1="50%" y1="50%" x2="50%" y2="15%" stroke="url(#line-gradient)" strokeWidth="1.5" filter="url(#glow)" className="opacity-50" />
               
               {/* 2. Advisor Chatbot (Top Right) - 80%, 30% */}
               <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="url(#line-gradient)" strokeWidth="1.5" filter="url(#glow)" className="opacity-50" />
               
               {/* 3. Jira Agent (Bottom Right) - 80%, 70% */}
               <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="url(#line-gradient)" strokeWidth="1.5" filter="url(#glow)" className="opacity-50" />
               
               {/* 4. Audit Builder (Bottom) - 50%, 85% */}
               <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="url(#line-gradient)" strokeWidth="1.5" filter="url(#glow)" className="opacity-50" />
               
               {/* 5. Compliance Matcher (Bottom Left) - 20%, 70% */}
               <line x1="50%" y1="50%" x2="20%" y2="70%" stroke="url(#line-gradient)" strokeWidth="1.5" filter="url(#glow)" className="opacity-50" />
               
               {/* 6. Code Scanner (Top Left) - 20%, 30% */}
               <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="url(#line-gradient)" strokeWidth="1.5" filter="url(#glow)" className="opacity-50" />
             </svg>

             {/* Center Node: Orchestrator */}
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="flex flex-col items-center animate-float">
                  <div className="w-28 h-28 rounded-full bg-bgMain border-2 border-primary shadow-[0_0_60px_rgba(255,107,155,0.4)] flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent"></div>
                     <Bot size={48} className="text-primary relative z-10" />
                  </div>
                  <div className="mt-4 text-center bg-bgMain/90 backdrop-blur px-5 py-2.5 rounded-xl border border-primary/30 shadow-lg">
                     <div className="font-heading font-bold text-white text-lg">Orchestrator Agent</div>
                     <div className="text-xs text-accent3 max-w-[200px] mt-1">Coordinates the entire audit workflow.</div>
                  </div>
                </div>
             </div>

             {/* Radial Nodes */}
             
             {/* 1. Regulation Reader (Top) */}
             <AgentNode 
                icon={<FileSearch />} 
                title="Regulation Reader Agent" 
                desc="Reads RBI/SEBI circulars & converts them to rules."
                style={{ top: '15%', left: '50%' }}
                delay="0s"
             />

             {/* 2. Advisor Chatbot (Top Right) */}
             <AgentNode 
                icon={<MessageSquare />} 
                title="Advisor Chatbot" 
                desc="Answers questions about rules & risks using RAG."
                style={{ top: '30%', left: '80%' }}
                delay="1s"
             />

             {/* 3. Jira Agent (Bottom Right) */}
             <AgentNode 
                icon={<Ticket />} 
                title="Jira Agent" 
                desc="Creates and updates tickets for violations."
                style={{ top: '70%', left: '80%' }}
                delay="2s"
             />

             {/* 4. Audit Builder (Bottom) */}
             <AgentNode 
                icon={<ClipboardList />} 
                title="Audit Builder Agent" 
                desc="Generates reports with evidence & scores."
                style={{ top: '85%', left: '50%' }}
                delay="3s"
             />

             {/* 5. Compliance Matcher (Bottom Left) */}
             <AgentNode 
                icon={<Scale />} 
                title="Compliance Matcher Agent" 
                desc="Matches every regulation with the right code."
                style={{ top: '70%', left: '20%' }}
                delay="4s"
             />

             {/* 6. Code Scanner (Top Left) */}
             <AgentNode 
                icon={<Code />} 
                title="Code Scanner Agent" 
                desc="Scans repo & builds a real-time intelligence map."
                style={{ top: '30%', left: '20%' }}
                delay="5s"
             />
         </div>

         {/* Mobile Layout (Vertical Stack) */}
         <div className="md:hidden flex flex-col gap-6 relative z-10">
            {/* Orchestrator Mobile */}
            <div className="flex flex-col items-center text-center mb-8">
               <div className="w-20 h-20 rounded-full bg-bgMain border border-primary shadow-[0_0_30px_rgba(255,107,155,0.3)] flex items-center justify-center mb-4">
                  <Bot size={32} className="text-primary" />
               </div>
               <h3 className="font-bold text-lg text-white">Orchestrator Agent</h3>
               <p className="text-sm text-accent3">Coordinates every step of the process.</p>
            </div>

            <div className="grid gap-4">
               <MobileAgentCard icon={<FileSearch />} title="Regulation Reader Agent" desc="Reads circulars, creates rules." />
               <MobileAgentCard icon={<Code />} title="Code Scanner Agent" desc="Maps codebase intelligence." />
               <MobileAgentCard icon={<Scale />} title="Compliance Matcher Agent" desc="Matches rules to code." />
               <MobileAgentCard icon={<Ticket />} title="Jira Agent" desc="Creates tickets for violations." />
               <MobileAgentCard icon={<ClipboardList />} title="Audit Builder Agent" desc="Generates audit reports." />
               <MobileAgentCard icon={<MessageSquare />} title="Advisor Chatbot" desc="Explains risks & rules." />
            </div>
         </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 w-full bg-bgCard/20 border-t border-white/5 relative z-10 scroll-mt-24">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Platform Features</h2>
               <p className="text-accent3">Everything you need to stay compliant at the speed of code.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <FeatureCard 
                  icon={<Code className="text-accent1" />}
                  title="Code Analysis"
                  desc="Deep analysis of your entire codebase in real time using AST parsing and semantic search."
               />
               <FeatureCard 
                  icon={<ShieldAlert className="text-primary" />}
                  title="Compliance Check"
                  desc="Evaluates code against RBI, SEBI, IRDAI and other dynamic regulations automatically."
               />
               <FeatureCard 
                  icon={<BarChart3 className="text-secondary" />}
                  title="Analytics Dashboard"
                  desc="Compliance percentage, last run details, regulation coverage, and trend insights."
               />
               <FeatureCard 
                  icon={<Ticket className="text-accent2" />}
                  title="Jira Ticket Creation"
                  desc="Auto-generates detailed Jira issues with code snippets and remediation steps for validated violations."
               />
               <FeatureCard 
                  icon={<ClipboardList className="text-success" />}
                  title="Audit Report Generator"
                  desc="Creates complete audit-ready PDF/HTML reports with fixes & evidence for regulators."
               />
               <FeatureCard 
                  icon={<RefreshCw className="text-accent3" />}
                  title="Regulation Updates"
                  desc="Live updates of new circulars with links to RBI/SEBI official sources."
               />
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="w-full bg-bgCard border-t border-white/10 pt-16 pb-8 relative z-10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
               <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded flex items-center justify-center font-bold text-bgMain text-xs">R</div>
                     <span className="font-heading font-bold text-lg">ReguPulse</span>
                  </div>
                  <p className="text-accent3 text-sm leading-relaxed">
                     Empowering fintechs to deploy with confidence through agentic AI compliance.
                  </p>
               </div>
               
               <div>
                  <h4 className="font-heading font-bold text-white mb-4">Company</h4>
                  <ul className="space-y-2 text-sm text-accent3">
                     <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Blogs</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-heading font-bold text-white mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-accent3">
                     <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Terms of Use</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">DPA</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-heading font-bold text-white mb-4">Locations</h4>
                  <ul className="space-y-2 text-sm text-accent3">
                     <li>San Francisco, CA</li>
                     <li>Mumbai, India</li>
                     <li>London, UK</li>
                  </ul>
               </div>
            </div>
            
            <div className="border-t border-white/5 pt-8 text-center text-xs text-accent3 font-mono">
               © {new Date().getFullYear()} ReguPulse AI Inc. All rights reserved.
            </div>
         </div>
      </footer>
    </div>
  );
};

// Helper Components for Splash
const AgentNode: React.FC<{ icon: React.ReactNode, title: string, desc: string, style?: React.CSSProperties, delay?: string }> = ({ icon, title, desc, style, delay }) => (
   <div className="absolute transform -translate-x-1/2 -translate-y-1/2 w-64 z-10" style={style}>
      <div className="flex flex-col items-center gap-3 animate-float-delayed" style={{ animationDelay: delay }}>
         <div className="w-16 h-16 rounded-2xl bg-bgCard border border-white/10 flex items-center justify-center text-accent1 shadow-[0_0_20px_rgba(0,245,212,0.15)] backdrop-blur-md group hover:scale-110 transition-transform duration-300">
            {icon}
         </div>
         <div className="text-center bg-bgMain/60 backdrop-blur-sm p-3 rounded-lg border border-white/5">
            <div className="text-sm font-bold text-white mb-1">{title}</div>
            <div className="text-xs text-accent3 leading-tight">{desc}</div>
         </div>
      </div>
   </div>
);

const MobileAgentCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
   <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="p-2.5 bg-accent1/10 rounded-lg text-accent1">
         {icon}
      </div>
      <div>
         <div className="font-bold text-white text-sm">{title}</div>
         <div className="text-xs text-accent3">{desc}</div>
      </div>
   </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
   <GlassCard hoverEffect={true} className="flex flex-col gap-4 p-6 min-h-[220px]">
      <div className="p-3 rounded-lg bg-white/5 w-fit border border-white/5">
         {icon}
      </div>
      <div>
         <h3 className="font-heading font-semibold text-lg mb-2 text-white">{title}</h3>
         <p className="text-sm text-accent3 leading-relaxed">{desc}</p>
      </div>
   </GlassCard>
);
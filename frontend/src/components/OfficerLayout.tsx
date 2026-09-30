import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { LayoutDashboard, Map, BarChart3, LogOut, Lightbulb, Calculator, FileText, Activity, PlayCircle, X, ChevronRight, Moon, Sun, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegionProvider } from './RegionContext';

export default function OfficerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('mock_role');
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/officer', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/officer/hotspots', icon: Map, label: 'Hotspot Map' },
    { to: '/officer/gaps', icon: BarChart3, label: 'Gap Analysis' },
    { to: '/officer/recommendations', icon: Lightbulb, label: 'AI Interventions' },
    { to: '/officer/simulator', icon: Calculator, label: 'Budget Sandbox' },
    { to: '/officer/policy', icon: FileText, label: 'Policy Brief' },
    { to: '/officer/impact', icon: Activity, label: 'Impact Tracker' },
  ];

  const tourSteps = [
    { path: '/officer', title: 'Welcome to the Control Room', desc: 'Start here for a high-level overview of live activity and key performance indicators.' },
    { path: '/officer/hotspots', title: 'Identify Crisis Zones', desc: 'Use the interactive time-slider map to pinpoint growing infrastructure bottlenecks.' },
    { path: '/officer/gaps', title: 'Analyze the Data', desc: 'Cross-reference citizen demand with existing supply to find where resources are lacking.' },
    { path: '/officer/recommendations', title: 'Let AI Suggest', desc: 'Review AI-generated interventions ranked by maximum impact per rupee.' },
    { path: '/officer/simulator', title: 'Simulate Outcomes', desc: 'Play with budget constraints and instantly see how reallocating funds changes lives.' },
    { path: '/officer/policy', title: 'Policy Brief', desc: 'Generate automated, AI-driven reports for specific regions to present to stakeholders and policymakers.' },
    { path: '/officer/impact', title: 'Impact Tracker', desc: 'Monitor request resolution rates across districts to evaluate operational efficiency.' }
  ];

  useEffect(() => {
    if (tourActive && tourSteps[tourStep]) {
      navigate(tourSteps[tourStep].path);
    }
  }, [tourStep, tourActive]);

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1);
    else setTourActive(false);
  };

  return (
    <RegionProvider>
      <div className="flex flex-col md:flex-row h-screen bg-[#FBF6EC] dark:bg-[#0E1226] text-[#1B1F3B] dark:text-white font-sans overflow-hidden">
        {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#1B1F3B] text-white z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold font-serif text-[#FBF6EC]">
            JanSetu <span className="text-[#F28C28]">Control</span>
          </h1>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'md:w-20' : 'md:w-72'} w-72
        bg-[#1B1F3B] dark:bg-[#0E1226] border-r border-[#1B1F3B]/10 dark:border-white/5 flex flex-col shrink-0 text-white
      `}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        
        <div className="p-6 border-b border-white/10 relative z-10 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-tight text-[#FBF6EC]">
                JanSetu <span className="text-[#F28C28]">Control</span>
              </h1>
              <p className="text-white/40 text-xs font-mono mt-1 uppercase tracking-widest">Command Center</p>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto w-8 h-8 bg-[#F28C28] rounded-lg flex items-center justify-center font-serif font-bold text-lg">
              J
            </div>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 relative z-10">
          {!isCollapsed && <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 ml-2">Modules</div>}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-white/10 text-white font-bold' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white font-medium'
                }`
              }
              title={isCollapsed ? item.label : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#F28C28] rounded-r-md"></div>}
                  <item.icon size={20} className={isActive ? 'text-[#F28C28]' : 'text-white/40 group-hover:text-white/80 transition-colors'} />
                  {!isCollapsed && item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 relative z-10 space-y-2">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 w-full text-left text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors font-medium`}
            title={isCollapsed ? (isCollapsed ? 'Expand' : 'Collapse') : undefined}
          >
            <ChevronRight size={20} className={`transform transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} />
            {!isCollapsed && 'Collapse'}
          </button>
          
          <button 
            onClick={() => { setTourActive(true); setTourStep(0); }}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 w-full bg-white/5 hover:bg-[#1E7B4F] text-white rounded-xl transition-colors font-medium border border-white/10 hover:border-transparent group`}
            title={isCollapsed ? 'Demo Tour' : undefined}
          >
            <span className="flex items-center gap-3">
              <PlayCircle size={20} className="text-[#1E7B4F] group-hover:text-white" />
              {!isCollapsed && 'Demo Tour'}
            </span>
          </button>
          <button 
            onClick={toggleDarkMode}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 w-full text-left text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors font-medium`}
            title={isCollapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            {!isCollapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
          </button>
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 w-full text-left text-white/50 hover:bg-[#C8553D]/20 hover:text-[#C8553D] rounded-xl transition-colors font-medium`}
            title={isCollapsed ? 'Secure Logout' : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && 'Secure Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#FBF6EC] dark:bg-[#0E1226]">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1B1F3B 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <Outlet />
      </main>

      {/* Guided Tour Floating UI */}
      <AnimatePresence>
        {tourActive && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 w-80 bg-[#1B1F3B] text-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
          >
            <div className="h-1 bg-white/10 w-full relative">
              <motion.div 
                className="h-full bg-[#F28C28]"
                initial={{ width: `${(tourStep / tourSteps.length) * 100}%` }}
                animate={{ width: `${((tourStep + 1) / tourSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="p-6 relative">
              <button 
                onClick={() => setTourActive(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="text-[10px] font-bold text-[#F28C28] uppercase tracking-widest mb-2">
                Step {tourStep + 1} of {tourSteps.length}
              </div>
              <h3 className="text-lg font-bold font-serif mb-2">{tourSteps[tourStep].title}</h3>
              <p className="text-white/70 text-sm leading-relaxed font-medium mb-6">
                {tourSteps[tourStep].desc}
              </p>
              
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setTourActive(false)}
                  className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-wider transition-colors"
                >
                  End Tour
                </button>
                <button 
                  onClick={nextTourStep}
                  className="flex items-center gap-1 bg-[#F28C28] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#E9B44C] transition-colors"
                >
                  {tourStep < tourSteps.length - 1 ? 'Next Step' : 'Finish'}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </RegionProvider>
  );
}

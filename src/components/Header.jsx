import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { LogOut, CheckCircle2, Moon, Sun, LayoutDashboard, FileText, Menu, Settings, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || true; // Default to true if not set
  });
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'hh:mm:ss a'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const currentDate = new Date();
  const location = useLocation();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'hh:mm:ss a'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
            <div className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">
                Attendance Manager
              </h1>
            </div>

          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="hidden md:block text-right mr-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{format(currentDate, 'EEEE, MMM do')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentTime}</p>
            </div>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* Top Right Dropdown Navigation */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400 transition-colors rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md flex items-center justify-center"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transform transition-all duration-200 origin-top-right z-50">
                  <div className="py-2">
                    <button 
                      onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 flex items-center text-sm font-medium transition-colors ${
                        location.pathname === '/dashboard' 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-3" />
                      Dashboard
                    </button>
                    
                    <button 
                      onClick={() => { navigate('/reports'); setIsMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 flex items-center text-sm font-medium transition-colors ${
                        location.pathname === '/reports' 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-3" />
                      Reports
                    </button>
                    
                    <div className="h-px bg-gray-200 dark:bg-gray-700/50 my-1"></div>
                    
                    <button 
                      onClick={() => { /* Settings placeholder */ setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    
                    <button
                      onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 flex items-center text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
}

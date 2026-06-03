import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Activity, PlaySquare, LogIn, LogOut } from 'lucide-react';
import { ModelLimitations } from './ModelLimitations';

export const Layout = () => {
  const { user, profile, signIn, signOut } = useAuth();
  const location = useLocation();
  const suppressGlobalChrome =
    location.pathname === '/workbench' ||
    location.pathname.startsWith('/workbench/') ||
    location.pathname.startsWith('/lesson/');

  const navItems = [
    { name: 'Home', path: '/', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Cases', path: '/cases', icon: <Activity className="w-4 h-4" /> },
    { name: 'Workbench', path: '/workbench', icon: <PlaySquare className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {!suppressGlobalChrome && <header className="h-14 bg-slate-900 border-b border-slate-800 shrink-0 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              CircleHeart
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ModelLimitations />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-medium text-slate-200">{user.displayName || user.email}</span>
                {profile?.role === 'admin' && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Admin</span>}
              </div>
              <button
                onClick={signOut}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold shadow transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}
        </div>
      </header>}
      
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      {!suppressGlobalChrome && <div className="md:hidden flex items-center justify-around pb-safe bg-slate-900 border-t border-slate-800 z-50 shrink-0">
         {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col flex-1 items-center gap-1 py-3 rounded-md text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'text-blue-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
      </div>}
    </div>
  );
};

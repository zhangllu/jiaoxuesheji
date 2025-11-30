import React from 'react';
import { ViewState } from '../types';
import { IconLayout, IconZap, IconBrainCircuit } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-20 shadow-sm">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mr-0 lg:mr-3 shadow-lg shadow-indigo-200">
                <IconBrainCircuit className="w-5 h-5" />
             </div>
             <span className="font-bold text-xl tracking-tight hidden lg:block text-slate-800">TeacherMind</span>
          </div>

          <nav className="mt-6 px-2 lg:px-4 space-y-2">
            <button
              onClick={() => onChangeView('shortcuts')}
              className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                currentView === 'shortcuts'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconZap className={`w-6 h-6 lg:w-5 lg:h-5 ${currentView === 'shortcuts' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="hidden lg:block ml-3">快捷指令</span>
            </button>

            <button
              onClick={() => onChangeView('boards')}
              className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                currentView === 'boards' || currentView === 'project'
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconLayout className={`w-6 h-6 lg:w-5 lg:h-5 ${currentView === 'boards' || currentView === 'project' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="hidden lg:block ml-3">我的项目</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 hidden lg:block">
           <div className="flex items-center p-3 bg-slate-50 rounded-xl">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
               TM
             </div>
             <div className="ml-3">
               <p className="text-sm font-medium text-slate-700">教师用户</p>
               <p className="text-xs text-slate-400">免费版</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;
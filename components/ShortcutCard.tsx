import React from 'react';
import { Shortcut } from '../types';
import * as Icons from './Icons';

interface ShortcutCardProps {
  shortcut: Shortcut;
  onClick: () => void;
}

const ShortcutCard: React.FC<ShortcutCardProps> = ({ shortcut, onClick }) => {
  // Dynamic icon rendering
  const IconComponent = (Icons as any)[`Icon${shortcut.iconName.charAt(0).toUpperCase() + shortcut.iconName.slice(1)}`] || Icons.IconZap;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${shortcut.color} transition-transform group-hover:scale-110 duration-300`}>
          <IconComponent className="w-6 h-6" />
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
        {shortcut.title}
      </h3>
      
      <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-grow">
        {shortcut.description}
      </p>
      
      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
          {shortcut.category}
        </span>
        <span className="text-sm font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          开始使用
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </span>
      </div>
    </div>
  );
};

export default ShortcutCard;


import React, { useState, useEffect } from 'react';
import { Project, Message, ViewState, Role, Shortcut, QuickAction } from './types';
import Layout from './components/Layout';
import ShortcutCard from './components/ShortcutCard';
import ChatInterface from './components/ChatInterface';
import { SHORTCUTS } from './constants';
import { IconPlus, IconMessageSquare, IconLayout } from './components/Icons';

// Use a simple ID generator for this stateless demo
const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1', label: '润色', prompt: '请润色上述内容，使其语言更加专业、学术，符合教学设计的规范。' },
  { id: 'qa-2', label: '扩写', prompt: '请详细扩写上述点，补充更多具体的教学细节和操作步骤。' },
  { id: 'qa-3', label: '举例', prompt: '请针对核心概念给出3个具体的课堂教学案例。' },
  { id: 'qa-4', label: '生成量规', prompt: '请根据上述任务设计一个包含4个等级的评价量规(Rubric)。' },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('shortcuts');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // Initialize with some sample data or empty
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('tm_projects');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Migration: Ensure 'works' array exists on old projects
            return parsed.map((p: any) => ({
                ...p,
                works: p.works || []
            }));
        } catch (e) {
            return [];
        }
    }
    return [];
  });

  // Persist projects to local storage
  useEffect(() => {
    localStorage.setItem('tm_projects', JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const createProject = (initialMessage?: string, title?: string, category?: string) => {
    const newProject: Project = {
      id: generateId(),
      title: title || '未命名项目',
      description: initialMessage ? (title ? `基于: ${title}` : initialMessage.slice(0, 30) + '...') : '新创建的教学设计项目',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      category: category,
      materials: [],
      works: [],
      quickActions: [...DEFAULT_QUICK_ACTIONS]
    };

    if (initialMessage) {
        newProject.messages.push({
            id: generateId(),
            role: Role.USER,
            text: initialMessage,
            timestamp: Date.now()
        });
        // We add a system-like prompt in the chat history invisible or just let user start
    }

    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setCurrentView('project');
  };

  const handleShortcutClick = (shortcut: Shortcut) => {
    createProject(shortcut.promptTemplate, shortcut.title, shortcut.category);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => 
        p.id === updatedProject.id ? { ...updatedProject, updatedAt: Date.now() } : p
    ));
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if(confirm('确定要删除这个项目吗？')) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (activeProjectId === projectId) {
            setActiveProjectId(null);
            setCurrentView('boards');
        }
    }
  };

  // --- RENDER VIEWS ---

  const renderShortcuts = () => (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">快捷指令库</h1>
          <p className="text-slate-500">选择一个教学场景，快速开始您的AI辅助设计。</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SHORTCUTS.map(shortcut => (
            <ShortcutCard 
              key={shortcut.id} 
              shortcut={shortcut} 
              onClick={() => handleShortcutClick(shortcut)} 
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderBoards = () => (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">我的项目</h1>
            <p className="text-slate-500">管理您的所有教学设计方案。</p>
          </div>
          <button 
            onClick={() => createProject(undefined, '新项目')}
            className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors font-medium"
          >
            <IconPlus className="w-5 h-5 mr-2" />
            创建新项目
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
               <IconLayout className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">还没有项目</h3>
            <p className="text-slate-500 mt-1 mb-6">从快捷指令库开始，或者创建一个空白项目。</p>
            <button 
                onClick={() => setCurrentView('shortcuts')}
                className="text-indigo-600 font-medium hover:underline"
            >
                去浏览指令库 &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => {
                    setActiveProjectId(project.id);
                    setCurrentView('project');
                }}
                className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-5 ${project.messages.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        <IconMessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {project.title}
                        </h3>
                        <div className="flex items-center text-sm text-slate-400 mt-1 space-x-3">
                            <span>{project.category || '通用'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             <span>{project.messages.length} 条对话</span>
                             {project.works && project.works.length > 0 && (
                                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs">
                                    {project.works.length} 作品
                                </span>
                             )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除项目"
                    >
                        <IconLayout className="w-5 h-5 text-current" />
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <svg className="w-5 h-5 text-slate-300 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
        {currentView === 'shortcuts' && renderShortcuts()}
        {currentView === 'boards' && renderBoards()}
        {currentView === 'project' && activeProject && (
            <ChatInterface 
                project={activeProject} 
                onBack={() => setCurrentView('boards')}
                onUpdateProject={handleUpdateProject}
            />
        )}
        {currentView === 'project' && !activeProject && renderBoards()}
    </Layout>
  );
}

export default App;
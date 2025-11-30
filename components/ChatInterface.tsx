

import React, { useState, useEffect, useRef } from 'react';
import { Project, Message, Role, Material, QuickAction, Work, AppSettings } from '../types';
import { 
  IconSend, IconArrowLeft, IconLoader, IconBrainCircuit, 
  IconSidebar, IconPlus, IconX, IconFileText, IconTrash, 
  IconCheck, IconLink, IconEdit, IconPaperclip, IconImage, 
  IconBook, IconMarkdown, IconDownload, IconCopy, IconSettings
} from './Icons';
import { streamChat, ImagePart } from '../services/geminiService';

interface ChatInterfaceProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ project, onBack, onUpdateProject }) => {
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>(project.messages);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'materials' | 'works'>('materials');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Materials State
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterialType, setNewMaterialType] = useState<'text'|'link'>('text');
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialContent, setNewMaterialContent] = useState('');

  // Quick Action State
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActionLabel, setNewActionLabel] = useState('');
  const [newActionPrompt, setNewActionPrompt] = useState('');

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    apiKey: '',
    model: 'gemini-2.5-flash'
  });

  // Load Settings from LocalStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tm_settings');
    if (savedSettings) {
        try {
            setAppSettings(JSON.parse(savedSettings));
        } catch(e) { console.error('Failed to parse settings', e); }
    }
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
      setAppSettings(newSettings);
      localStorage.setItem('tm_settings', JSON.stringify(newSettings));
      setShowSettings(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim() || isStreaming) return;

    const userText = textToSend.trim();
    setInputValue('');
    
    // Create User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now()
    };

    // Optimistic Update
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    
    const updatedProject = { ...project, messages: newMessages };
    onUpdateProject(updatedProject);
    
    setIsStreaming(true);

    try {
      // Prepare Context from Active Materials
      const activeMaterials = project.materials.filter(m => m.isActive);
      
      // Separate text/links and images
      const textMaterials = activeMaterials.filter(m => m.type === 'text' || m.type === 'link' || (m.type === 'file' && !m.mimeType?.startsWith('image/')));
      const imageMaterials = activeMaterials.filter(m => m.type === 'image' || (m.type === 'file' && m.mimeType?.startsWith('image/')));

      const materialsContext = textMaterials.map(m => 
        `[资料: ${m.title}]\n${m.content}\n`
      ).join('\n---\n');

      const imageParts: ImagePart[] = imageMaterials
        .filter(m => m.data)
        .map(m => ({
          inlineData: {
            data: m.data!.split(',')[1], // Remove "data:image/jpeg;base64," prefix
            mimeType: m.mimeType || 'image/jpeg',
          }
        }));

      // Create Placeholder for AI Message
      const aiMsgId = (Date.now() + 1).toString();
      const initialAiMsg: Message = {
        id: aiMsgId,
        role: Role.MODEL,
        text: '', // Start empty
        timestamp: Date.now()
      };
      
      let currentAiText = '';
      setMessages(prev => [...prev, initialAiMsg]);

      // Pass user's custom settings (API Key, Model) to the service
      await streamChat(
        newMessages, 
        userText, 
        materialsContext, 
        imageParts, 
        (textChunk) => {
            currentAiText = textChunk;
            setMessages(prev => 
            prev.map(msg => msg.id === aiMsgId ? { ...msg, text: currentAiText } : msg)
            );
        },
        appSettings.apiKey,
        appSettings.model
      );
      
      // Final update to parent
      onUpdateProject({ 
        ...updatedProject, 
        messages: [...newMessages, { ...initialAiMsg, text: currentAiText }] 
      });

    } catch (error: any) {
      console.error("Failed to generate response", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: `Error: ${error.message || 'Unknown error'}\n\nHint: Check your API Key in Settings (Gear Icon).`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMarkdown = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
          alert('Markdown 内容已复制到剪贴板');
      });
  };

  // --- Material Handlers ---

  const handleAddMaterial = () => {
    if (!newMaterialTitle.trim() || !newMaterialContent.trim()) return;
    
    const newMat: Material = {
      id: Date.now().toString(),
      type: newMaterialType,
      title: newMaterialTitle,
      content: newMaterialContent,
      isActive: true
    };
    
    const updatedMaterials = [...project.materials, newMat];
    onUpdateProject({ ...project, materials: updatedMaterials });
    
    // Reset Form
    setNewMaterialTitle('');
    setNewMaterialContent('');
    setIsAddingMaterial(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const isImage = file.type.startsWith('image/');
      
      const newMat: Material = {
        id: Date.now().toString(),
        type: isImage ? 'image' : 'file',
        title: file.name,
        content: isImage ? '图片附件' : '文件附件',
        data: result,
        mimeType: file.type,
        isActive: true
      };

      const updatedMaterials = [...project.materials, newMat];
      onUpdateProject({ ...project, materials: updatedMaterials });
      
      // Switch to materials tab if not already
      setRightPanelTab('materials');
      if (!showRightPanel) setShowRightPanel(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleMaterial = (id: string) => {
    const updatedMaterials = project.materials.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    onUpdateProject({ ...project, materials: updatedMaterials });
  };

  const deleteMaterial = (id: string) => {
    if (confirm('确定删除这份资料吗？')) {
      const updatedMaterials = project.materials.filter(m => m.id !== id);
      onUpdateProject({ ...project, materials: updatedMaterials });
    }
  };

  // --- Quick Action Handlers ---

  const handleAddAction = () => {
    if (!newActionLabel.trim() || !newActionPrompt.trim()) return;
    
    const newAction: QuickAction = {
      id: Date.now().toString(),
      label: newActionLabel,
      prompt: newActionPrompt
    };
    
    const updatedActions = [...project.quickActions, newAction];
    onUpdateProject({ ...project, quickActions: updatedActions });
    
    setNewActionLabel('');
    setNewActionPrompt('');
    setIsAddingAction(false);
  };

  const deleteAction = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('删除这个快捷指令？')) {
      const updatedActions = project.quickActions.filter(a => a.id !== id);
      onUpdateProject({ ...project, quickActions: updatedActions });
    }
  };

  // --- Work (Artifact) Handlers ---

  const saveAsWork = (text: string) => {
    const title = prompt("请输入作品标题", "新生成的教学设计");
    if (!title) return;

    const newWork: Work = {
      id: Date.now().toString(),
      title,
      content: text,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedWorks = [...(project.works || []), newWork];
    onUpdateProject({ ...project, works: updatedWorks });
    setRightPanelTab('works');
    setShowRightPanel(true);
  };

  const deleteWork = (id: string) => {
    if (confirm('确定删除这个作品吗？')) {
      const updatedWorks = project.works.filter(w => w.id !== id);
      onUpdateProject({ ...project, works: updatedWorks });
    }
  };

  const handleDownloadWork = (work: Work) => {
    const element = document.createElement("a");
    const file = new Blob([work.content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${work.title}.md`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex h-full bg-white relative overflow-hidden">
      
      {/* Settings Modal */}
      {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <IconSettings className="w-5 h-5 mr-2 text-indigo-600" />
                          模型设置
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                          <IconX className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gemini API Key</label>
                          <input 
                              type="password"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                              placeholder="输入您的 Google Gemini API Key"
                              value={appSettings.apiKey}
                              onChange={(e) => setAppSettings({...appSettings, apiKey: e.target.value})}
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                              如果您没有设置环境变量，请在此处输入 Key。密钥仅存储在您的本地浏览器中。
                          </p>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Model Name</label>
                          <select 
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white"
                              value={appSettings.model}
                              onChange={(e) => setAppSettings({...appSettings, model: e.target.value})}
                          >
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                          </select>
                      </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button 
                          onClick={() => saveSettings(appSettings)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                      >
                          保存设置
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LEFT COLUMN: CHAT */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center px-4 lg:px-6 justify-between bg-white z-10 shrink-0">
          <div className="flex items-center min-w-0">
            <button 
              onClick={onBack}
              className="p-2 mr-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <IconArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 truncate">{project.title}</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{project.description || "新项目"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                title="模型设置"
            >
                <IconSettings className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
            <button 
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-2 rounded-lg transition-colors ${showRightPanel ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
              title="切换侧边栏"
            >
              <IconSidebar className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
              <IconBrainCircuit className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">开始您的教学设计对话</p>
              {!appSettings.apiKey && !process.env.API_KEY && (
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="mt-4 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm text-indigo-600 hover:bg-indigo-50"
                  >
                    配置 API Key
                  </button>
              )}
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`group flex w-full flex-col ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] lg:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm text-sm leading-relaxed ${
                  msg.role === Role.USER
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              
              {/* Tool Bar for AI Messages */}
              {msg.role === Role.MODEL && msg.text && (
                 <div className="mt-2 ml-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => saveAsWork(msg.text)}
                        className="flex items-center space-x-1 px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
                        title="将此回复保存到作品集"
                    >
                        <IconMarkdown className="w-3 h-3" />
                        <span>存为作品</span>
                    </button>
                    <button 
                        onClick={() => handleCopyMarkdown(msg.text)}
                        className="flex items-center space-x-1 px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
                        title="复制 Markdown 源码"
                    >
                        <IconCopy className="w-3 h-3" />
                        <span>复制 MD</span>
                    </button>
                 </div>
              )}
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role === Role.USER && (
               <div className="flex justify-start w-full">
                  <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex items-center space-x-2">
                      <IconLoader className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-slate-500">正在思考...</span>
                  </div>
               </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions & Input Area */}
        <div className="bg-white border-t border-slate-100 shrink-0">
          
          {/* Quick Actions Bar */}
          <div className="px-4 py-2 border-b border-slate-50 flex items-center space-x-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">快捷:</span>
            
            {project.quickActions.map(action => (
              <div 
                key={action.id}
                onClick={() => setInputValue(action.prompt)}
                className="group relative flex-shrink-0"
              >
                <button 
                  className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                >
                  {action.label}
                </button>
                <button 
                    onClick={(e) => deleteAction(e, action.id)}
                    className="absolute -top-1 -right-1 bg-red-100 text-red-500 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => setIsAddingAction(true)}
              className="px-2 py-1.5 bg-white border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 rounded-full text-xs transition-all flex items-center shrink-0"
            >
              <IconPlus className="w-3 h-3 mr-1" />
              添加
            </button>
          </div>

          {/* Quick Action Input Form (Conditional) */}
          {isAddingAction && (
             <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-col space-y-2">
                 <div className="flex space-x-2">
                    <input 
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500" 
                        placeholder="按钮名称 (如: 润色)"
                        value={newActionLabel}
                        onChange={e => setNewActionLabel(e.target.value)}
                    />
                    <input 
                        className="flex-[2] px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500" 
                        placeholder="对应的指令内容"
                        value={newActionPrompt}
                        onChange={e => setNewActionPrompt(e.target.value)}
                    />
                    <button 
                        onClick={handleAddAction}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs"
                    >确认</button>
                    <button 
                        onClick={() => setIsAddingAction(false)}
                        className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs"
                    >取消</button>
                 </div>
             </div>
          )}

          {/* Main Input */}
          <div className="p-4">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的指令，或按 Enter 发送..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-slate-700 text-sm max-h-48"
                rows={2}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isStreaming}
                className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                  !inputValue.trim() || isStreaming
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                }`}
              >
                {isStreaming ? <IconLoader className="w-5 h-5" /> : <IconSend className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-center mt-2 flex justify-center items-center">
                <p className="text-[10px] text-slate-400">AI 可能会产生错误，请核对重要信息。TeacherMind 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: TABS (MATERIALS / WORKS) */}
      <div 
        className={`border-l border-slate-200 bg-white flex flex-col transition-all duration-300 ease-in-out ${
          showRightPanel ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'
        } absolute lg:relative right-0 h-full z-20 shadow-xl lg:shadow-none`}
      >
        {showRightPanel && (
          <>
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setRightPanelTab('materials')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${rightPanelTab === 'materials' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <div className="flex items-center justify-center">
                        <IconFileText className="w-4 h-4 mr-2" />
                        资料库
                    </div>
                </button>
                <button 
                    onClick={() => setRightPanelTab('works')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${rightPanelTab === 'works' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <div className="flex items-center justify-center">
                        <IconBook className="w-4 h-4 mr-2" />
                        作品集
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white relative">
              
              {/* === MATERIALS TAB === */}
              {rightPanelTab === 'materials' && (
                <>
                  <div className="flex space-x-2 mb-4">
                     <button 
                        onClick={() => setIsAddingMaterial(true)}
                        className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center"
                     >
                        <IconPlus className="w-3 h-3 mr-1" />
                        文本/链接
                     </button>
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors flex items-center justify-center"
                     >
                        <IconPaperclip className="w-3 h-3 mr-1" />
                        上传附件
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*,application/pdf,text/*" 
                        onChange={handleFileUpload} 
                     />
                  </div>

                  {/* Add Material Form */}
                  {isAddingMaterial && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-indigo-100 shadow-sm text-sm space-y-2 animate-fadeIn mb-4">
                       <div className="flex space-x-2 mb-2">
                          <button 
                            onClick={() => setNewMaterialType('text')}
                            className={`flex-1 text-center py-1 rounded text-xs ${newMaterialType === 'text' ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-slate-500'}`}
                          >文本</button>
                          <button 
                            onClick={() => setNewMaterialType('link')}
                            className={`flex-1 text-center py-1 rounded text-xs ${newMaterialType === 'link' ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-slate-500'}`}
                          >链接</button>
                       </div>
                       <input 
                          placeholder="标题 (如: 课程标准)"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-indigo-500 bg-white"
                          value={newMaterialTitle}
                          onChange={e => setNewMaterialTitle(e.target.value)}
                       />
                       <textarea 
                          placeholder={newMaterialType === 'text' ? "粘贴内容..." : "输入URL..."}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-indigo-500 bg-white resize-none h-20"
                          value={newMaterialContent}
                          onChange={e => setNewMaterialContent(e.target.value)}
                       />
                       <div className="flex space-x-2 pt-1">
                          <button onClick={handleAddMaterial} className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-xs">保存</button>
                          <button onClick={() => setIsAddingMaterial(false)} className="flex-1 bg-slate-200 text-slate-600 py-1.5 rounded text-xs">取消</button>
                       </div>
                    </div>
                  )}

                  {/* Materials List */}
                  {project.materials.length === 0 && !isAddingMaterial && (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-xs mb-2">暂无资料</p>
                      <p className="text-[10px]">添加文本或图片，AI可基于此进行创作。</p>
                    </div>
                  )}

                  {project.materials.map(mat => (
                    <div key={mat.id} className="group bg-white border border-slate-100 rounded-xl p-3 hover:shadow-md transition-shadow relative">
                       <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 overflow-hidden">
                             {mat.type === 'link' ? <IconLink className="w-4 h-4 text-blue-400 shrink-0" /> : 
                              mat.type === 'image' || mat.mimeType?.startsWith('image/') ? <IconImage className="w-4 h-4 text-purple-400 shrink-0" /> :
                              <IconFileText className="w-4 h-4 text-orange-400 shrink-0" />}
                             <span className="font-medium text-slate-700 text-sm truncate">{mat.title}</span>
                          </div>
                          <button 
                            onClick={() => deleteMaterial(mat.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                             <IconTrash className="w-4 h-4" />
                          </button>
                       </div>
                       
                       {/* Preview Content */}
                       {mat.data && (mat.type === 'image' || mat.mimeType?.startsWith('image/')) ? (
                           <div className="mb-3 rounded-lg overflow-hidden border border-slate-100 h-24 bg-slate-50 flex items-center justify-center relative">
                               <img src={mat.data} alt={mat.title} className="max-h-full max-w-full object-contain" />
                           </div>
                       ) : (
                           <div className="text-xs text-slate-500 line-clamp-3 mb-3 bg-slate-50 p-2 rounded">
                              {mat.content}
                           </div>
                       )}

                       <div 
                         onClick={() => toggleMaterial(mat.id)}
                         className={`flex items-center justify-between text-xs cursor-pointer select-none px-2 py-1 rounded transition-colors ${mat.isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}
                       >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full border mr-2 flex items-center justify-center ${mat.isActive ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                               {mat.isActive && <IconCheck className="w-2 h-2 text-white" />}
                            </div>
                            <span>{mat.isActive ? '已启用参考' : '未启用'}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                  
                  <div className="p-2 border-t border-slate-100 mt-4 text-[10px] text-slate-400 text-center">
                     图片资料将在发送消息时传给AI
                  </div>
                </>
              )}

              {/* === WORKS TAB === */}
              {rightPanelTab === 'works' && (
                <>
                   {(!project.works || project.works.length === 0) && (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                      <IconMarkdown className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs mb-2">暂无作品</p>
                      <p className="text-[10px]">在对话中点击“存为作品”保存满意的成果。</p>
                    </div>
                   )}

                   {(project.works || []).map(work => (
                       <div key={work.id} className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow group mb-3">
                           <div className="flex justify-between items-start mb-2">
                               <h4 className="font-bold text-slate-800 text-sm">{work.title}</h4>
                               <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                      onClick={() => handleDownloadWork(work)}
                                      className="p-1 text-slate-400 hover:text-indigo-600"
                                      title="下载 .md 文件"
                                   >
                                       <IconDownload className="w-3 h-3" />
                                   </button>
                                   <button 
                                      onClick={() => deleteWork(work.id)}
                                      className="p-1 text-slate-400 hover:text-red-500"
                                      title="删除"
                                   >
                                       <IconTrash className="w-3 h-3" />
                                   </button>
                               </div>
                           </div>
                           <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded line-clamp-4 font-mono">
                               {work.content}
                           </div>
                           <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                               <span>Markdown</span>
                               <span>{new Date(work.createdAt).toLocaleDateString()}</span>
                           </div>
                       </div>
                   ))}
                </>
              )}

            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default ChatInterface;
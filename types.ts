

export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

export interface Material {
  id: string;
  type: 'text' | 'link' | 'image' | 'file';
  title: string;
  content: string; // Text content or description
  data?: string;   // Base64 data for files/images
  mimeType?: string;
  isActive: boolean;
}

export interface Work {
  id: string;
  title: string;
  content: string; // Markdown content
  createdAt: number;
  updatedAt: number;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  category?: string;
  materials: Material[];
  works: Work[];
  quickActions: QuickAction[];
}

export interface Shortcut {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string; // Mapping to an icon component
  promptTemplate: string;
  color: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
}

export type ViewState = 'shortcuts' | 'boards' | 'project';
export type SEOPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type SEOStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Testing' | 'Completed';

export type SEOImpact = 'Traffic' | 'Conversion' | 'Indexing' | 'Technical' | 'Brand';

export type SEODifficulty = 'Easy' | 'Medium' | 'Hard';

export interface SEOChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: SEOPriority;
  status: SEOStatus;
  assignee: string;
  estimated_impact: SEOImpact;
  difficulty: SEODifficulty;
}

export interface SEOChecklistCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: SEOChecklistItem[];
}

export interface SEOKeyword {
  keyword: string;
  search_volume: string;
  difficulty: string;
  intent: string;
  priority: SEOPriority;
}

export interface SEOBlogIdea {
  title: string;
  type: 'Informational' | 'Transactional' | 'Comparison';
  target_keyword: string;
  estimated_traffic: string;
}

export interface SEOQuickWin {
  id: number;
  task: string;
  impact: string;
  time_estimate: string;
  category: string;
}

export interface SEOChecklistDocument {
  projectName: string;
  version: string;
  generatedAt: string;
  totalTasks: number;
  categories: SEOChecklistCategory[];
  keywords: SEOKeyword[];
  blogIdeas: SEOBlogIdea[];
  quickWins: SEOQuickWin[];
}

export type LaunchChecklistPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type LaunchChecklistStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'Testing'
  | 'Completed';

export interface LaunchChecklistItem {
  id: number;
  section_id: number;
  title: string;
  description: string;
  priority: LaunchChecklistPriority;
  status: LaunchChecklistStatus;
  owner: string;
  notes: string;
  is_completed: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LaunchChecklistSection {
  id: number;
  title: string;
  description: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  items: LaunchChecklistItem[];
}

export interface LaunchChecklistDocument {
  project_name: string;
  sections: LaunchChecklistSection[];
}

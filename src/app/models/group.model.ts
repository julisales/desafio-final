// src/app/models/group.model.ts
export interface Group {
  id: string;
  name: string;
  description?: string;
  adminIds: string[];
  memberIds: string[];
  goalsIds: string[];
  createdAt: string;
  totalXp: number;
  category?: 'fitness' | 'study' | 'work' | 'health' | 'other';
}

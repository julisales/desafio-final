export interface Goal {
  id: string;
  ownerId: string;
  ownerType: 'user' | 'group';
  title: string;
  category: string;
  daysTotal: number;
  daysCompleted: number;
  rewardXp: number;
  dueDate?: string;
  startDate?: string;        // nova: YYYY-MM-DD ou ISO string
  lastCompletedDate?: string;
  periodicity: 'daily' | 'weekly' | 'monthly' | 'once';
  completedAt?: string;      // ISO string quando a meta é totalmente concluída
  shared?: boolean;          // se a meta já foi compartilhada (stories etc.)
  createdAt?: string;        // ISO string
}
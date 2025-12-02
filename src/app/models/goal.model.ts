// models/goal.model.ts
export interface Goal {
  id: string;
  ownerId: string; // user id or group id (use ownerType?)
  ownerType: 'user' | 'group';
  title: string;
  category: string;
  daysTotal: number;
  daysCompleted: number;
  rewardXp: number;
  dueDate?: string; // ISO
  lastCompletedDate?: string; // ISO to handle streaks
}
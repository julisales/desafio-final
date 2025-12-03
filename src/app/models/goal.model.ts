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
  lastCompletedDate?: string; // ISO para controle diário/semana/mês
  periodicity: 'daily' | 'weekly' | 'monthly' | 'once'; // 'once' para metas únicas
  completedAt?: string; // Adicione esta linha - ISO string para data de conclusão total
  shared?: boolean; // Adicione esta linha - se já foi compartilhado
}
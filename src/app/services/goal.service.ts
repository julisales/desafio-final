// services/goal.service.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Goal } from '../models/goal.model';
import { v4 as uuid } from 'uuid';
import { of } from 'rxjs';
import { getWeekNumber } from '../utils/utils';

@Injectable({ providedIn: 'root' })
export class GoalService {
  constructor(private storage: StorageService) {}

  

  getAll(): Goal[] {
    return this.storage.get<Goal[]>('goals') ?? [];
  }

  save(goal: Goal) {
    const arr = this.getAll();
    const idx = arr.findIndex((g) => g.id === goal.id);
    if (idx >= 0) arr[idx] = goal;
    else arr.push(goal);
    this.storage.set('goals', arr);
  }

  // services/goal.service.ts
  createForUser(userId: string, payload: Partial<Goal>) {
    const g: Goal = {
      id: uuid(),
      ownerId: userId,
      ownerType: 'user',
      title: payload.title ?? 'Nova meta',
      category: payload.category ?? 'Geral',
      daysTotal: payload.daysTotal ?? 30,
      daysCompleted: payload.daysCompleted ?? 0,
      rewardXp: payload.rewardXp ?? 100,
      dueDate: payload.dueDate,
      lastCompletedDate: payload.lastCompletedDate,
      periodicity: payload.periodicity ?? 'daily', // Define um valor padrão
    };
    this.save(g);
    return g;
  }

  markComplete(goalId: string) {
    const arr = this.getAll();
    const g = arr.find((x) => x.id === goalId);
    if (!g) return null;

    const now = new Date();
    let canComplete = false;

    if (!g.lastCompletedDate) {
      canComplete = true;
    } else {
      const last = new Date(g.lastCompletedDate);
      switch (g.periodicity) {
        case 'daily':
          canComplete = last.toDateString() !== now.toDateString();
          break;
        case 'weekly':
          canComplete = getWeekNumber(last) !== getWeekNumber(now);
          break;
        case 'monthly':
          canComplete =
            last.getMonth() !== now.getMonth() ||
            last.getFullYear() !== now.getFullYear();
          break;
        default:
          canComplete = true; // metas sem periodicidade podem ser concluídas sempre
      }
    }

    if (!canComplete) return null; // já concluída neste período

    g.daysCompleted = Math.min((g.daysCompleted ?? 0) + 1, g.daysTotal);
    g.lastCompletedDate = now.toISOString();

    this.storage.set('goals', arr);
    return g;
  }

  
}



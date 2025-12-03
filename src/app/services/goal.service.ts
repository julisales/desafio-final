// src/app/services/goal.service.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Goal } from '../models/goal.model';
import { v4 as uuid } from 'uuid';
import { getWeekNumber } from '../utils/utils';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private STORAGE_KEY = 'goals';
  private XP_PER_LEVEL = 1000; // ajuste se quiser curva diferente

  constructor(
    private storage: StorageService,
    private auth: AuthService
  ) {}

  getAll(): Goal[] {
    return this.storage.get<Goal[]>(this.STORAGE_KEY) ?? [];
  }

  private saveAll(arr: Goal[]) {
    this.storage.set(this.STORAGE_KEY, arr);
  }

  save(goal: Goal) {
    const arr = this.getAll();
    const idx = arr.findIndex((g) => g.id === goal.id);
    if (idx >= 0) arr[idx] = goal;
    else arr.push(goal);
    this.saveAll(arr);
    // notifica UI
    try {
      window.dispatchEvent(new CustomEvent('goals-reset'));
    } catch (e) {}
  }

  createForUser(userId: string, payload: Partial<Goal>): Goal {
    const arr = this.getAll();

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
      periodicity: payload.periodicity ?? 'daily',
    };

    arr.push(g);
    this.saveAll(arr);

    // adiciona referência no usuário (se o usuário atual coincidir)
    const user = this.auth.getCurrentUserSnapshot();
    if (user && user.id === userId) {
      user.goalsIds = Array.isArray(user.goalsIds) ? user.goalsIds : [];
      if (!user.goalsIds.includes(g.id)) user.goalsIds.push(g.id);
      this.auth.updateUser(user);
    }

    try {
      window.dispatchEvent(new CustomEvent('goals-reset'));
    } catch (e) {}

    return g;
  }

  /**
   * Retorna a goal atualizada ou null (se não puder completar no período).
   */
  markComplete(goalId: string): Goal | null {
    const arr = this.getAll();
    const idx = arr.findIndex((x) => x.id === goalId);
    if (idx < 0) return null;

    const g = { ...arr[idx] };

    const now = new Date();
    const todayIsoDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

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
          canComplete = true;
      }
    }

    if (!canComplete) return null;

    g.daysCompleted = Math.min((g.daysCompleted ?? 0) + 1, g.daysTotal);
    // grava apenas a data em ISO (mantém compatível com suas comparações)
    g.lastCompletedDate = now.toISOString();

    // persiste a goal atualizada
    arr[idx] = g;
    this.saveAll(arr);

    // Atualiza usuário: XP, level, streak (aplica somente se user logado)
    const user = this.auth.getCurrentUserSnapshot();
    if (user) {
      // XP
      const reward = g.rewardXp ?? 0;
      user.xp = (user.xp ?? 0) + reward;

      // Level simples: 1000 XP por nível (nivel 1 = 0..999 XP)
      const computedLevel = Math.floor((user.xp ?? 0) / this.XP_PER_LEVEL) + 1;
      user.level = computedLevel;

      // Streak diário (usa user.lastStreakDate conforme seu model)
      if (g.periodicity === 'daily') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayIso = yesterday.toISOString().split('T')[0];

        // se lastStreakDate é ontem, incrementa; senão reinicia para 1
        if ((user.lastStreakDate ?? '') === yesterdayIso) {
          user.streak = (user.streak ?? 0) + 1;
        } else {
          user.streak = 1;
        }
        user.lastStreakDate = todayIsoDate;
      }

      // persiste usuário
      this.auth.updateUser(user);
    }

    // notifica UI
    try {
      window.dispatchEvent(new CustomEvent('goals-reset'));
    } catch (e) {}

    return g;
  }

  findById(goalId: string): Goal | undefined {
    return this.getAll().find((g) => g.id === goalId);
  }

  update(goal: Goal) {
    const arr = this.getAll();
    const idx = arr.findIndex((x) => x.id === goal.id);
    if (idx >= 0) {
      arr[idx] = goal;
      this.saveAll(arr);
      try {
        window.dispatchEvent(new CustomEvent('goals-reset'));
      } catch (e) {}
    }
  }

  delete(goalId: string) {
    let arr = this.getAll();
    arr = arr.filter((g) => g.id !== goalId);
    this.saveAll(arr);

    // remove referência no usuário atual (se existir)
    const user = this.auth.getCurrentUserSnapshot();
    if (user) {
      user.goalsIds = (user.goalsIds ?? []).filter((id) => id !== goalId);
      this.auth.updateUser(user);
    }

    try {
      window.dispatchEvent(new CustomEvent('goals-reset'));
    } catch (e) {}
  }
}
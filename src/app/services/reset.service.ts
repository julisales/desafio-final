// src/app/services/reset.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, interval, takeUntil } from 'rxjs';
import { GoalService } from './goal.service';
import { AuthService } from './auth.service';
import { podeCompletar } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class ResetService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private lastCheckDate: string;
  
  constructor(
    private goalService: GoalService,
    private authService: AuthService
  ) {
    this.lastCheckDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    this.startDailyCheck();
  }
  
  // Verifica a cada minuto se mudou o dia
  private startDailyCheck() {
    interval(60000) // A cada minuto
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkForDayReset();
      });
  }
  
  // Verifica se passou da meia-noite
  private checkForDayReset() {
    const today = new Date().toISOString().slice(0, 10);
    
    if (today !== this.lastCheckDate) {
      console.log('Novo dia detectado!', today);
      this.lastCheckDate = today;
      
      // Notificar componentes sobre o reset
      this.notifyReset('daily');
      
      // Atualizar streak do usuário se necessário
      this.updateUserStreak();
    }
  }
  
  // Atualiza o streak do usuário
  private updateUserStreak() {
    const user = this.authService.getCurrentUserSnapshot?.();
    if (!user) return;
    
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    
    // Verificar se o usuário completou alguma meta ontem
    const allGoals = this.goalService.getAll();
    const userGoals = allGoals.filter(g => 
      g.ownerType === 'user' && g.ownerId === user.id
    );
    
    const completedYesterday = userGoals.some(goal => {
      if (!goal.lastCompletedDate) return false;
      const lastDate = new Date(goal.lastCompletedDate).toISOString().slice(0, 10);
      return lastDate === yesterdayStr;
    });
    
    if (completedYesterday && user.lastStreakDate !== today) {
      // Incrementar streak
      user.streak = (user.streak || 0) + 1;
      user.lastStreakDate = today;
      this.authService.updateUser(user);
    } else if (!completedYesterday && user.lastStreakDate !== today) {
      // Resetar streak se não completou ontem
      user.streak = 0;
      user.lastStreakDate = today;
      this.authService.updateUser(user);
    }
  }
  
  // Notificar componentes sobre reset
  private notifyReset(period: 'daily' | 'weekly' | 'monthly') {
    // Em um app real, você usaria um Subject ou EventEmitter
    // Para simplificar, vamos disparar um evento personalizado
    const event = new CustomEvent('goals-reset', { 
      detail: { period, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
  }
  
  // Verificar se uma meta específica deve ser resetada
  checkGoalReset(goalId: string): boolean {
    const goal = this.goalService.getAll().find(g => g.id === goalId);
    if (!goal) return false;
    
    return podeCompletar(goal.periodicity || 'daily', goal.lastCompletedDate);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
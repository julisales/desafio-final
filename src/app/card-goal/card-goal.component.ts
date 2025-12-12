import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Goal } from '../models/goal.model';
import { isNewDay, isNewMonth, isNewWeek, podeCompletar } from '../utils/utils';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-goal-card',
  templateUrl: './card-goal.component.html',
  imports: [CommonModule],
  styleUrls: ['./card-goal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGoalComponent {
  @Input() goal: Goal | null = null;
  @Input() isGroupGoal = false;
  @Input() disabled = false;

  @Output() complete = new EventEmitter<string>();
  @Output() resetCheck = new EventEmitter<void>();

  completing = false;
  private lastCheckTime = Date.now();

  ngOnInit() {
    window.addEventListener('goals-reset', this.handleReset.bind(this));

    this.startPeriodicCheck();
  }

  private startPeriodicCheck() {
    setInterval(() => {
      this.checkForReset();
    }, 30000);
  }

  private checkForReset() {
    if (!this.goal) return;

    const now = Date.now();
    if (now - this.lastCheckTime > 60000) {
      this.lastCheckTime = now;

      const previouslyAvailable = this.canCompleteToday;

      this.resetCheck.emit();
    }
  }

  private handleReset(event: Event) {
    this.resetCheck.emit();
  }

  get isNewPeriod(): boolean {
    if (!this.goal || !this.goal.lastCompletedDate) return true;

    const periodicity = this.goal.periodicity || 'daily';
    const lastDate = this.goal.lastCompletedDate;

    switch (periodicity) {
      case 'daily':
        return isNewDay(lastDate);
      case 'weekly':
        return isNewWeek(lastDate);
      case 'monthly':
        return isNewMonth(lastDate);
      default:
        return false;
    }
  }

  get progressPercent(): number {
    if (!this.goal || !this.goal.daysTotal) return 0;
    return Math.round(
      ((this.goal.daysCompleted ?? 0) / (this.goal.daysTotal ?? 1)) * 100
    );
  }

  get daysRemaining(): number {
    if (!this.goal) return 0;
    return Math.max(
      0,
      (this.goal.daysTotal ?? 0) - (this.goal.daysCompleted ?? 0)
    );
  }

  get isFullyCompleted(): boolean {
    if (!this.goal) return false;
    return (this.goal.daysCompleted ?? 0) >= (this.goal.daysTotal ?? 0);
  }

  get canCompleteToday(): boolean {
    if (!this.goal) return false;

    if (this.isFullyCompleted) return false;

    const periodicity = this.goal.periodicity || 'once';

    try {
      return podeCompletar(periodicity, this.goal.lastCompletedDate);
    } catch (e) {
      console.error('Erro ao calcular canCompleteToday:', e);
      return false;
    }
  }

  get alreadyCompletedThisPeriod(): boolean {
    if (!this.goal) return true;

    if (!this.goal.lastCompletedDate) return false;

    return !this.canCompleteToday;
  }
  onCompleteClick() {
    if (!this.goal) return;

    if (
      this.disabled ||
      this.completing ||
      this.isFullyCompleted ||
      !this.canCompleteToday
    ) {
      return;
    }

    this.completing = true;

    this.complete.emit(this.goal.id);

    setTimeout(() => (this.completing = false), 800);
  }

  getButtonTitle(): string {
    if (this.isFullyCompleted) return 'Meta totalmente concluída';
    if (!this.canCompleteToday) {
      const period = this.goal?.periodicity || 'once';
      switch (period) {
        case 'daily':
          return 'Já concluída hoje';
        case 'weekly':
          return 'Já concluída esta semana';
        case 'monthly':
          return 'Já concluída este mês';
        default:
          return 'Meta já concluída';
      }
    }
    return 'Concluir hoje';
  }

  getCompletedMessage(): string {
    const period = this.goal?.periodicity || 'once';
    switch (period) {
      case 'daily':
        return 'Concluída hoje';
      case 'weekly':
        return 'Concluída esta semana';
      case 'monthly':
        return 'Concluída este mês';
      default:
        return 'Concluída';
    }
  }

  ngOnDestroy() {
    window.removeEventListener('goals-reset', this.handleReset.bind(this));
  }
}

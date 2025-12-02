// src/app/card-goal/card-goal.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Goal } from '../models/goal.model';

@Component({
  selector: 'app-goal-card',
  templateUrl: './card-goal.component.html', // <-- confirma este caminho
  styleUrls: ['./card-goal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardGoalComponent {
  @Input() goal!: Goal;
  @Input() isGroupGoal = false;
  @Input() disabled = false;

  @Output() complete = new EventEmitter<string>();

  completing = false;

  get progressPercent(): number {
    if (!this.goal || !this.goal.daysTotal) return 0;
    return Math.round((this.goal.daysCompleted / this.goal.daysTotal) * 100);
  }

  get daysRemaining(): number {
    return Math.max(0, (this.goal.daysTotal ?? 0) - (this.goal.daysCompleted ?? 0));
  }

  get isFullyCompleted(): boolean {
    return (this.goal.daysCompleted ?? 0) >= (this.goal.daysTotal ?? 0);
  }

  onCompleteClick() {
    if (this.disabled || this.completing || this.isFullyCompleted) return;
    this.completing = true;
    this.complete.emit(this.goal.id);
    setTimeout(() => (this.completing = false), 1200);
  }
}
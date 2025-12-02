// src/app/goal-create/goal-create.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GoalService } from '../services/goal.service';
import { AuthService } from '../services/auth.service';
import { Goal } from '../models/goal.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-goal-create',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './goal-create.component.html',
  styleUrls: ['./goal-create.component.css'] // ou .scss
})
export class GoalCreateComponent implements OnInit {
 @Output() created = new EventEmitter<Goal>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  submitting = false;

  // bindings para o template
  frequencies = ['Diária', 'Semanal', 'Mensal'];
  priorities = ['Baixa', 'Média', 'Alta'];
  categories = ['Saúde', 'Estudos', 'Bem-estar', 'Trabalho', 'Outros'];

  // <-- define minDate para usar nos inputs date
  minDate: string = '';

  constructor(
    private fb: FormBuilder,
    private goalService: GoalService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // estabelece a menor data como hoje (YYYY-MM-DD)
    this.minDate = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(60)]],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      frequency: ['', Validators.required],
      category: ['', Validators.required],
      priority: ['', Validators.required]
    }, { updateOn: 'blur' });
  }

  private daysBetween(startIso: string, endIso: string): number {
    const start = new Date(startIso);
    const end = new Date(endIso);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000*60*60*24));
    return Math.max(0, diff) + 1;
  }

  private xpForPriority(priority: string): number {
    switch ((priority || '').toLowerCase()) {
      case 'alta': return 300;
      case 'média': return 180;
      case 'baixa': return 100;
      default: return 100;
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.auth.getCurrentUserSnapshot();
    if (!user) {
      alert('Usuário não encontrado. Faça login novamente.');
      return;
    }

    this.submitting = true;

    const v = this.form.value;
    const daysTotal = this.daysBetween(v.startDate, v.endDate) || 30;

    const payload: Partial<Goal> = {
      title: v.title,
      category: v.category,
      daysTotal,
      daysCompleted: 0,
      rewardXp: this.xpForPriority(v.priority),
      dueDate: v.endDate,
      ownerType: 'user',
      ownerId: user.id
    };

    const created = this.goalService.createForUser(user.id, payload);
    this.created.emit(created);

    this.submitting = false;
    this.form.reset();
    this.close.emit();
  }

  onCancel() {
    this.close.emit();
  }
}
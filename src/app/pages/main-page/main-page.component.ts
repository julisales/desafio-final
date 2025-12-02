// main-page.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GoalService } from '../../services/goal.service';
import { RewardService } from '../../services/reward.service';
import { Goal } from '../../models/goal.model';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';
import { CardGoalComponent } from '../../card-goal/card-goal.component';
import { SignComponent } from '../sign-page/sign-page.component';
import { GoalCreateComponent } from '../../goal-create/goal-create.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-page',
  imports: [
    CardGoalComponent,
    SignComponent,
    GoalCreateComponent,
    CommonModule,
  ],
  standalone: true,
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css'],
})
export class MainPageComponent implements OnInit, OnDestroy {
  user: User | null = null;
  personalGoals: Goal[] = [];
  groupGoals: Goal[] = [];

  private destroy$ = new Subject<void>();

  // ViewChild opcional para scroll (caso queira usar em vez de document.querySelector)
  @ViewChild('containerGoals', { static: false })
  containerGoals!: ElementRef<HTMLElement>;

  constructor(
    private auth: AuthService,
    private goalService: GoalService,
    private router: Router,
    private rewardService: RewardService
  ) {}

  ngOnInit() {
    // Assina o BehaviorSubject do AuthService
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.user = u;
      this.loadGoals();
    });

    // Em caso de falha na emissão (ex: já logado antes da assinatura), tenta snapshot
    const snap = this.auth.getCurrentUserSnapshot?.();
    if (!this.user && snap) {
      this.user = snap;
      this.loadGoals();
    }
  }

  loadGoals() {
    if (!this.user) {
      this.personalGoals = [];
      this.groupGoals = [];
      return;
    }
    const allGoals = this.goalService.getAll();
    this.personalGoals = allGoals.filter(
      (g) => g.ownerType === 'user' && g.ownerId === this.user!.id
    );
    this.groupGoals = allGoals.filter(
      (g) =>
        g.ownerType === 'group' &&
        (this.user!.groupsIds ?? []).includes(g.ownerId)
    );
  }

  /**
   * Handler chamado pelo <app-goal-card (complete)="onCompleteToday($event)">
   * O card emite o goalId (string).
   */
  onCompleteToday(goalId: string) {
    if (!this.user) return;

    // marca a meta como completa (service persiste alterações)
    const updated = this.goalService.markComplete(goalId);
    if (!updated) {
      alert('Não foi possível atualizar a meta.');
      return;
    }

    // adiciona XP ao usuário
    this.user.xp = (this.user.xp ?? 0) + (updated.rewardXp ?? 0);

    // recalcula level (exemplo: 1000 XP por nível — ajuste se precisar)
    this.user.level = Math.floor((this.user.xp ?? 0) / 1000) + 1;

    // persiste usuário e atualiza BehaviorSubject
    this.auth.updateUser(this.user);

    // recarrega metas para refletir o novo estado dos cards
    this.loadGoals();

    // feedback (substitua por snackbar que preferir)
    alert(`Meta concluída! Você ganhou +${updated.rewardXp} XP`);
  }

  // Scroll helpers (mantive, você pode trocar para usar ViewChild)
  scrollLeft() {
    const container =
      this.containerGoals?.nativeElement ??
      (document.querySelector('.container-goals') as HTMLElement);
    container?.scrollBy({ left: -300, behavior: 'smooth' });
  }
  scrollRight() {
    const container =
      this.containerGoals?.nativeElement ??
      (document.querySelector('.container-goals') as HTMLElement);
    container?.scrollBy({ left: 300, behavior: 'smooth' });
  }

  // helpers para template
  get totalGoalsCount(): number {
    return (this.personalGoals?.length ?? 0) + (this.groupGoals?.length ?? 0);
  }

  get levelProgressPercent(): number {
    if (!this.user) return 0;
    const xp = this.user.xp ?? 0;
    const base = 1000; // XP por nível (ajuste se sua regra for diferente)
    const mod = xp % base;
    return Math.round((mod / base) * 100);
  }

  trackByGoalId(_: number, g: Goal) {
    return g.id;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showCreateModal = false;

  onGoalCreated(goal: Goal) {
    // simples: recarrega metas (ou insere na lista)
    this.loadGoals();
    this.showCreateModal = false;
    // opcional: mostrar toast/snackbar
    alert('Meta criada com sucesso!');
  }

  showUserMenu = false;

  toggleUserMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  logout(event: Event) {
    event.stopPropagation();
    this.auth.logout();
    this.router.navigate(['/sign']);
  }
}
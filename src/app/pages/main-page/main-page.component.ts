import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener,
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
import { getWeekNumber, podeCompletar } from '../../utils/utils';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-page',
  imports: [
    CardGoalComponent,
    SignComponent,
    GoalCreateComponent,
    CommonModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css'],
})
export class MainPageComponent implements OnInit, OnDestroy {
  user: User | null = null;
  personalGoals: Goal[] = [];
  groupGoals: Goal[] = [];

  selectedFilter: string = 'all';
  filteredGoals: Goal[] = [];
  allGoals: Goal[] = [];

  private destroy$ = new Subject<void>();

    @ViewChild('containerGoals', { static: false })
  containerGoals!: ElementRef<HTMLElement>;

  constructor(
    private auth: AuthService,
    private goalService: GoalService,
    private router: Router,
    private rewardService: RewardService,
    private cdr: ChangeDetectorRef
  ) {}

  onResetCheck() {
        this.cdr.detectChanges();
  }

  ngOnInit() {
        this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.user = u;
      this.loadGoals();
    });

        const snap = (this.auth as any).getCurrentUserSnapshot?.();
    if (!this.user && snap) {
      this.user = snap;
      this.loadGoals();
    }

    window.addEventListener('goals-reset', () => {
            this.loadGoals();
    });
  }

  loadGoals() {
    if (!this.user) {
      this.personalGoals = [];
      this.groupGoals = [];
      this.filteredGoals = [];
      this.allGoals = [];
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

        this.allGoals = [...this.personalGoals, ...this.groupGoals];
    this.filterGoals();   }

  filterGoals() {
    const allGoals = [...this.personalGoals, ...this.groupGoals];
    this.allGoals = allGoals;

    let filtered: Goal[] = [];

    switch (this.selectedFilter) {
      case 'all':
                filtered = allGoals.filter((goal) => {
                    return goal.daysCompleted < goal.daysTotal;
        });
        break;

      case 'completed':
                filtered = allGoals.filter((goal) => {
          return goal.daysCompleted >= goal.daysTotal;
        });
        break;

      case 'nearest':
                filtered = allGoals
          .filter((goal) => goal.daysCompleted < goal.daysTotal && goal.dueDate)
          .sort((a, b) => {
            const dateA = new Date(a.dueDate!).getTime();
            const dateB = new Date(b.dueDate!).getTime();
            return dateA - dateB;
          });
        break;

      case 'highest':
                filtered = allGoals
          .filter((goal) => goal.daysCompleted < goal.daysTotal)
          .sort((a, b) => b.rewardXp - a.rewardXp);
        break;

      case 'daily':
                filtered = allGoals.filter(
          (goal) =>
            goal.periodicity === 'daily' && goal.daysCompleted < goal.daysTotal
        );
        break;

      case 'weekly':
                filtered = allGoals.filter(
          (goal) =>
            goal.periodicity === 'weekly' && goal.daysCompleted < goal.daysTotal
        );
        break;

      case 'monthly':
                filtered = allGoals.filter(
          (goal) =>
            goal.periodicity === 'monthly' &&
            goal.daysCompleted < goal.daysTotal
        );
        break;

      case 'once':
                filtered = allGoals.filter(
          (goal) =>
            goal.periodicity === 'once' && goal.daysCompleted < goal.daysTotal
        );
        break;

      default:
        filtered = allGoals;
        break;
    }

    this.filteredGoals = filtered;

        console.log(`Filtro: ${this.selectedFilter}, Metas: ${filtered.length}`);
  }

  /**
   * Handler chamado pelo <app-goal-card (complete)="onCompleteToday($event)">
   * O card emite o goalId (string).
   */
  async onCompleteToday(goalId: string) {
    if (!this.user) return;

    const allGoals = this.goalService.getAll();
    const goal = allGoals.find((g) => g.id === goalId);

    if (!goal) return;

        if (goal.daysCompleted >= goal.daysTotal) {
      alert('Esta meta já está completamente concluída!');
      return;
    }

        if (goal.periodicity && goal.periodicity !== 'once') {
      if (!podeCompletar(goal.periodicity, goal.lastCompletedDate)) {
        const period = goal.periodicity;
        let message = 'Você já concluiu esta meta ';
        switch (period) {
          case 'daily':
            message += 'hoje';
            break;
          case 'weekly':
            message += 'esta semana';
            break;
          case 'monthly':
            message += 'este mês';
            break;
        }
        alert(message + '!');
        return;
      }
    }

        const updatedGoal = this.goalService.markComplete(goalId);

    if (!updatedGoal) {
      alert('Não foi possível concluir a meta!');
      return;
    }

        this.loadGoals();

        if (updatedGoal.daysCompleted >= updatedGoal.daysTotal) {
      try {
        await this.generateShareBanner(updatedGoal);
        this.showShareModal = true;
      } catch (err) {
        console.error('Erro ao gerar banner:', err);
        alert(
          `🎉 Parabéns! Você completou a meta "${updatedGoal.title}" totalmente!`
        );
      }
    } else {
                  alert(
        `Você concluiu o dia da meta "${updatedGoal.title}" — continue assim!`
      );
    }
  }

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

    get totalGoalsCount(): number {
    return this.filteredGoals.length;   }

  get levelProgressPercent(): number {
    if (!this.user) return 0;
    const xp = this.user.xp ?? 0;
    const base = 1000;     const mod = xp % base;
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
        this.loadGoals();
    this.showCreateModal = false;
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

  /* ===========================
     Banner / Compartilhamento
     =========================== */

  showShareModal = false;
  shareImageDataUrl: string | null = null;
  shareGenerating = false;
  lastSharedGoalTitle = '';

    private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line.trim(), x, currentY);
  }

    downloadShareImage(): void {
    if (!this.shareImageDataUrl) {
      console.warn('Nenhuma imagem para download.');
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = this.shareImageDataUrl;
      const safeTitle = (this.lastSharedGoalTitle || 'meta')
        .replace(/\s+/g, '_')
        .toLowerCase();
      a.download = `phocus_conquista_${safeTitle}.png`;
            document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Erro ao tentar baixar a imagem:', err);
      alert(
        'Não foi possível baixar a imagem automaticamente. Abra-a em outra aba e salve manualmente.'
      );
    }
  }

    async shareViaNavigator(): Promise<void> {
    if (!this.shareImageDataUrl) {
      console.warn('Nenhuma imagem para compartilhar.');
      alert('Gere a imagem primeiro antes de compartilhar.');
      return;
    }

        try {
            const res = await fetch(this.shareImageDataUrl);
      const blob = await res.blob();
      const fileName = `phocus_conquista_${(
        this.lastSharedGoalTitle || 'meta'
      ).replace(/\s+/g, '_')}.png`;
      const file = new File([blob], fileName, { type: blob.type });

            const nav: any = navigator;
      const shareData: any = {
        files: [file],
        title: 'Conquista desbloqueada!',
        text: `Completei a meta "${this.lastSharedGoalTitle}" no Phocus! 🎉`,
      };

      if (nav.canShare && nav.canShare(shareData)) {
        await nav.share(shareData);
                this.showShareModal = false;
        return;
      }
    } catch (err) {
            console.warn('Web Share API com arquivos falhou ou não suportada:', err);
    }

        try {
      const w = window.open(this.shareImageDataUrl!, '_blank');
      if (!w) {
                this.downloadShareImage();
      } else {
                this.showShareModal = false;
      }
    } catch (err) {
      console.error('Fallback de compartilhamento falhou:', err);
      alert(
        'Não foi possível compartilhar automaticamente — tente baixar a imagem e compartilhar manualmente.'
      );
    }
  }

    async generateShareBanner(goal: Goal): Promise<string> {
    this.shareGenerating = true;
    try {
      const width = 1080;
      const height = 1920;
      const padding = 80;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

            const primary = '#f8e71c';
      const bgDark = '#1f2937';
      const bgElement = '#2c3e50';
      const textLight = '#fdfdfd';
      const shadowYellow = 'rgba(248, 231, 28, 0.2)';

      /* ================================
       Fundo estilo Phocus
    ================================= */
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, bgDark);
      g.addColorStop(1, bgElement);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = shadowYellow;
      ctx.beginPath();
      ctx.arc(width * 0.75, height * 0.25, 500, 0, Math.PI * 2);
      ctx.fill();

      /* ================================
       Mascote Lumo
    ================================= */
      const lumo = new Image();
      lumo.src = '../img/lumo-welcome.png';
      await new Promise<void>((res) => {
        lumo.onload = () => res();
        lumo.onerror = () => res();
      });

      const lumoW = 450;
      const lumoH = (lumo.height / lumo.width) * lumoW;
      ctx.drawImage(
        lumo,
        width - lumoW - 60,
        height - lumoH - 140,
        lumoW,
        lumoH
      );

      /* ================================
       Caixa translúcida
    ================================= */
            const boxW = width - padding * 2;
      const boxH = 520;
      const boxX = padding;
      const boxY = padding + 80;

            ctx.fillStyle = '#2c3e50';       this.roundRect(ctx, boxX, boxY, boxW, boxH, 32);
      ctx.fill();

            ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;
      this.roundRect(ctx, boxX, boxY, boxW, boxH, 32);
      ctx.fill();
      ctx.restore();

      /* ================================
       Título
    ================================= */
      ctx.fillStyle = primary;
      ctx.font = `900 82px Inter, system-ui`;
      ctx.fillText('Meta concluída!', boxX + 40, boxY + 120);

      /* ================================
       Título da meta (wrap)
    ================================= */
      ctx.fillStyle = textLight;
      ctx.font = `600 48px Inter, system-ui`;
      this.wrapText(
        ctx,
        goal.title ?? 'Meta',
        boxX + 40,
        boxY + 200,
        boxW - 160,
        54
      );

      /* ================================
       Detalhes
    ================================= */
      ctx.font = `500 36px Inter, system-ui`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(
        `Recompensa: ${goal.rewardXp ?? 0} XP`,
        boxX + 40,
        boxY + 300
      );
      ctx.fillText(
        `Progresso: ${goal.daysCompleted}/${goal.daysTotal}`,
        boxX + 40,
        boxY + 350
      );
      ctx.fillText(
        `Concluído em: ${new Date().toLocaleDateString()}`,
        boxX + 40,
        boxY + 400
      );

      /* ================================
       Badge XP
    ================================= */
      const cx = boxX + boxW - 130;
      const cy = boxY + 150;

      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.shadowColor = shadowYellow;
      ctx.shadowBlur = 25;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1f2937';
      ctx.font = '700 42px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${goal.rewardXp ?? 0} XP`, cx, cy + 12);

      /* ================================
       Rodapé
    ================================= */
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '500 30px Inter';
      ctx.fillText(
        'Phocus — Transforme metas em conquistas',
        width / 2,
        height - 80
      );

      const dataUrl = canvas.toDataURL('image/png');
      this.shareImageDataUrl = dataUrl;
      this.lastSharedGoalTitle = goal.title ?? '';

      return dataUrl;
    } finally {
      this.shareGenerating = false;
    }
  }
}

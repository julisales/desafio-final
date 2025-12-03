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

  // ViewChild opcional para scroll (caso queira usar em vez de document.querySelector)
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
    // Forçar atualização da view
    this.cdr.detectChanges();
  }

  ngOnInit() {
    // Assina o BehaviorSubject do AuthService
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.user = u;
      this.loadGoals();
    });

    // Em caso de falha na emissão (ex: já logado antes da assinatura), tenta snapshot
    const snap = (this.auth as any).getCurrentUserSnapshot?.();
    if (!this.user && snap) {
      this.user = snap;
      this.loadGoals();
    }

    window.addEventListener('goals-reset', () => {
      // Forçar recarregar metas quando houver reset
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

    // Atualiza a lista completa e aplica o filtro atual
    this.allGoals = [...this.personalGoals, ...this.groupGoals];
    this.filterGoals(); // <-- CHAMA O FILTRO AQUI
  }

  filterGoals() {
    const allGoals = [...this.personalGoals, ...this.groupGoals];
    this.allGoals = allGoals;

    let filtered: Goal[] = [];

    switch (this.selectedFilter) {
      case 'all':
        // Mostra apenas metas que NÃO estão 100% completas
        filtered = allGoals.filter((goal) => {
          // Se daysCompleted >= daysTotal, meta está 100% completa
          return goal.daysCompleted < goal.daysTotal;
        });
        break;

      case 'completed':
        // Mostra apenas metas que estão 100% completas
        filtered = allGoals.filter((goal) => {
          return goal.daysCompleted >= goal.daysTotal;
        });
        break;

      case 'nearest':
        // Filtrar metas com dueDate mais próximo (apenas não completas)
        filtered = allGoals
          .filter((goal) => goal.daysCompleted < goal.daysTotal && goal.dueDate)
          .sort((a, b) => {
            const dateA = new Date(a.dueDate!).getTime();
            const dateB = new Date(b.dueDate!).getTime();
            return dateA - dateB;
          });
        break;

      case 'highest':
        // Filtrar metas com maior recompensa (apenas não completas)
        filtered = allGoals
          .filter((goal) => goal.daysCompleted < goal.daysTotal)
          .sort((a, b) => b.rewardXp - a.rewardXp);
        break;

      case 'daily':
        // Filtrar metas diárias (apenas não completas)
        filtered = allGoals.filter(
          (goal) =>
            goal.periodicity === 'daily' && goal.daysCompleted < goal.daysTotal
        );
        break;

      case 'weekly':
        // Filtrar metas semanais (apenas não completas)
        filtered = allGoals.filter(
          (goal) =>
            goal.periodicity === 'weekly' && goal.daysCompleted < goal.daysTotal
        );
        break;

      case 'monthly':
        // Filtrar metas mensais (apenas não completas)
        filtered = allGoals.filter(
          (goal) =>
            goal.periodicity === 'monthly' &&
            goal.daysCompleted < goal.daysTotal
        );
        break;

      case 'once':
        // Filtrar metas únicas (apenas não completas)
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

    // Opcional: log para debug
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

    // Verifica se a meta já está 100% completa
    if (goal.daysCompleted >= goal.daysTotal) {
      alert('Esta meta já está completamente concluída!');
      return;
    }

    // Verifica periodicidade (se aplicável)
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

    // Marca como completa no dia (chama service)
    const updatedGoal = this.goalService.markComplete(goalId);

    if (!updatedGoal) {
      alert('Não foi possível concluir a meta!');
      return;
    }

    // Recarrega metas para atualizar a lista
    this.loadGoals();

    // Se agora está 100% completa, gerar banner e abrir modal de compartilhamento
    if (updatedGoal.daysCompleted >= updatedGoal.daysTotal) {
      try {
        await this.generateShareBanner(updatedGoal);
        this.showShareModal = true;
      } catch (err) {
        console.error('Erro ao gerar banner:', err);
        alert(`🎉 Parabéns! Você completou a meta "${updatedGoal.title}" totalmente!`);
      }
    } else {
      // Caso não tenha completado totalmente, mostrar um pequeno toast/alert
      // (opcional; mantive comportamento simples)
      alert(`Você concluiu o dia da meta "${updatedGoal.title}" — continue assim!`);
    }
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
    return this.filteredGoals.length; // <-- MUDE PARA USAR filteredGoals
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
    // Recarrega metas
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

  // Gera banner (canvas) e seta shareImageDataUrl
  async generateShareBanner(goal: Goal): Promise<string> {
    this.shareGenerating = true;
    try {
      const width = 1080; // ideal para Stories
      const height = 1920;
      const padding = 80;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      // Fundo gradient
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, '#6A8CF7');
      g.addColorStop(1, '#8EE3B1');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // leve overlay
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, width, height);

      // Tentar carregar imagem Lumo (se existir localmente)
      const lumoImg = new Image();
      lumoImg.src = '../img/lumo-welcome.png';
      // se usar assets do angular, ajuste o caminho conforme build
      await new Promise<void>((res) => {
        lumoImg.onload = () => res();
        lumoImg.onerror = () => res();
      });

      // desenha imagem Lumo (opcional)
      try {
        const lumoW = Math.round(width * 0.45);
        const lumoH =
          lumoImg.width > 0 ? Math.round((lumoImg.height / lumoImg.width) * lumoW) : Math.round(lumoW * 1.1);
        ctx.drawImage(lumoImg, width - lumoW - padding, height - lumoH - padding, lumoW, lumoH);
      } catch (e) {
        // ignora se falhar
      }

      // caixa translúcida para texto
      const boxW = width - padding * 2;
      const boxH = 520;
      const boxX = padding;
      const boxY = padding + 80;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      this.roundRect(ctx, boxX, boxY, boxW, boxH, 28);
      ctx.fill();

      // Título
      ctx.fillStyle = '#fff';
      ctx.font = `bold 72px Inter, system-ui, -apple-system`;
      ctx.textAlign = 'left';
      ctx.fillText('Meta Concluída!', boxX + 40, boxY + 120);

      // Goal title (com quebra)
      ctx.font = `600 48px Inter, system-ui, -apple-system`;
      ctx.fillStyle = '#fff';
      const goalTitle = goal.title || 'Meta';
      this.wrapText(ctx, goalTitle, boxX + 40, boxY + 180, boxW - 160, 52);

      // detalhes: XP reward, dias, data
      ctx.font = `500 34px Inter, system-ui, -apple-system`;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const xpText = `Recompensa: ${goal.rewardXp ?? 0} XP`;
      const daysText = `Progresso: ${goal.daysCompleted ?? 0}/${goal.daysTotal ?? 0}`;
      const dateText = `Concluído em: ${new Date().toLocaleDateString()}`;
      ctx.fillText(xpText, boxX + 40, boxY + 260);
      ctx.fillText(daysText, boxX + 40, boxY + 310);
      ctx.fillText(dateText, boxX + 40, boxY + 360);

      // Badge circular
      const cx = boxX + boxW - 120;
      const cy = boxY + 120;
      const circleSize = 140;
      ctx.beginPath();
      ctx.arc(cx, cy, circleSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      ctx.fillStyle = '#222';
      ctx.font = '700 40px Inter, system-ui, -apple-system';
      ctx.textAlign = 'center';
      ctx.fillText('+', cx, cy - 8);
      ctx.font = '700 28px Inter, system-ui, -apple-system';
      ctx.fillText(`${goal.rewardXp ?? 0} XP`, cx, cy + 36);

      // rodapé
      ctx.textAlign = 'center';
      ctx.font = '600 28px Inter, system-ui, -apple-system';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('Phocus — Transforme metas em conquistas', width / 2, height - 80);

      const dataUrl = canvas.toDataURL('image/png');
      this.shareImageDataUrl = dataUrl;
      this.lastSharedGoalTitle = goal.title ?? '';
      return dataUrl;
    } finally {
      this.shareGenerating = false;
    }
  }

  // download simples
  downloadShareImage() {
    if (!this.shareImageDataUrl) return;
    const a = document.createElement('a');
    a.href = this.shareImageDataUrl;
    const filename = `phocus_conquista_${(this.lastSharedGoalTitle || 'meta').replace(/\s+/g, '_')}.png`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Web Share API com arquivos (quando disponível)
  async shareViaNavigator() {
    if (!this.shareImageDataUrl) return;
    try {
      if ((navigator as any).canShare) {
        const res = await fetch(this.shareImageDataUrl);
        const blob = await res.blob();
        const filesArray = [new File([blob], `phocus_conquista.png`, { type: blob.type })];
        const shareData: any = {
          files: filesArray,
          title: 'Conquista desbloqueada!',
          text: `Completei a meta "${this.lastSharedGoalTitle}" no Phocus! 🎉`,
        };
        if ((navigator as any).canShare(shareData)) {
          await (navigator as any).share(shareData);
          this.showShareModal = false;
          return;
        }
      }
      // fallback: abrir imagem em nova aba
      const w = window.open(this.shareImageDataUrl, '_blank');
      if (!w) alert('Não foi possível abrir a imagem para compartilhar — você pode baixar manualmente.');
    } catch (err) {
      console.error('share error', err);
      alert('Não foi possível compartilhar automaticamente. Faça o download e compartilhe manualmente.');
    }
  }

  // Helpers canvas (métodos dentro da classe para evitar problemas de lint)
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const min = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + min, y);
    ctx.arcTo(x + w, y, x + w, y + h, min);
    ctx.arcTo(x + w, y + h, x, y + h, min);
    ctx.arcTo(x, y + h, x, y, min);
    ctx.arcTo(x, y, x + w, y, min);
    ctx.closePath();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line.trim(), x, curY);
  }
}
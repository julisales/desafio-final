import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal } from '../../models/goal.model';
import { User } from '../../models/user.model';

declare var html2canvas: any; // Declaração para evitar erro de TypeScript

@Component({
  selector: 'app-share-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="share-modal-overlay" *ngIf="visible" (click)="close()">
      <div class="share-modal" (click)="$event.stopPropagation()">
        <div class="share-modal-header">
          <h3>🎉 Meta Concluída!</h3>
          <button class="close-btn" (click)="close()">×</button>
        </div>
        
        <div class="banner-preview">
          <!-- Banner que será capturado -->
          <div #shareBanner class="share-banner" [ngClass]="theme">
            <div class="banner-content">
              <div class="banner-header">
                <img src="../img/logo-phocus.png" alt="Phocus" class="banner-logo">
                <h2>CONQUISTA COMPLETA!</h2>
              </div>
              
              <div class="user-info">
                <div class="avatar">
                  <i class="ti ti-user-filled"></i>
                </div>
                <div class="user-details">
                  <h3>{{user?.name}}</h3>
                  <p>Nível {{user?.level}} • {{user?.streak}} dias de sequência</p>
                </div>
              </div>
              
              <div class="achievement-info">
                <div class="achievement-icon">
                  <i class="ti ti-trophy-filled"></i>
                </div>
                <h4>{{goal?.title}}</h4>
                <p class="achievement-description">{{getGoalDescription()}}</p>
                
                <div class="achievement-stats">
                  <div class="stat">
                    <span class="stat-value">{{goal?.daysCompleted}}/{{goal?.daysTotal}}</span>
                    <span class="stat-label">dias concluídos</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">+{{goal?.rewardXp}}</span>
                    <span class="stat-label">XP ganhos</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{completionDate | date:'dd/MM/yyyy'}}</span>
                    <span class="stat-label">concluída em</span>
                  </div>
                </div>
              </div>
              
              <div class="banner-footer">
                <p>#Phocus #Produtividade #MetaConcluída</p>
                <p class="download-hint">📱 Toque para salvar e compartilhar!</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="share-options">
          <div class="theme-selector">
            <p>Tema do banner:</p>
            <div class="theme-buttons">
              <button 
                *ngFor="let t of themes" 
                [class.active]="t === theme"
                (click)="theme = t"
                class="theme-btn"
                [ngClass]="t"
              >
                {{getThemeDisplayName(t)}}
              </button>
            </div>
          </div>
          
          <div class="share-buttons">
            <button class="btn-download" (click)="downloadBanner()">
              <i class="ti ti-download"></i> Baixar Imagem
            </button>
            <button class="btn-share" (click)="shareViaWebAPI()" *ngIf="canShare">
              <i class="ti ti-share"></i> Compartilhar
            </button>
            <button class="btn-copy" (click)="copyToClipboard()">
              <i class="ti ti-copy"></i> Copiar Link
            </button>
          </div>
          
          <div class="share-tips">
            <p><strong>Dica:</strong> Salve a imagem e compartilhe nos seus stories!</p>
            <p class="small">Tamanho ideal para Instagram: 1080x1920px</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .share-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    }
    
    .share-modal {
      background: white;
      border-radius: 20px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }
    
    .share-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }
    
    .share-modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .close-btn:hover {
      background: #f5f5f5;
    }
    
    .banner-preview {
      padding: 20px;
      display: flex;
      justify-content: center;
      background: #f9f9f9;
    }
    
    .share-banner {
      width: 400px;
      height: 700px;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .banner-content {
      padding: 30px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .banner-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .banner-logo {
      height: 40px;
      margin-bottom: 10px;
    }
    
    .banner-header h2 {
      margin: 0;
      font-size: 1.8rem;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 30px;
      padding: 15px;
      border-radius: 15px;
      background: rgba(255, 255, 255, 0.2);
    }
    
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      background: rgba(255, 255, 255, 0.3);
    }
    
    .user-details h3 {
      margin: 0;
      font-size: 1.4rem;
    }
    
    .user-details p {
      margin: 5px 0 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
    
    .achievement-info {
      text-align: center;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .achievement-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }
    
    .achievement-info h4 {
      margin: 0 0 15px;
      font-size: 1.8rem;
      line-height: 1.3;
    }
    
    .achievement-description {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 30px;
      line-height: 1.4;
      max-height: 100px;
      overflow-y: auto;
    }
    
    .achievement-stats {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 1.8rem;
      font-weight: bold;
    }
    
    .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .banner-footer {
      text-align: center;
      margin-top: auto;
      padding-top: 20px;
      border-top: 2px dashed rgba(255, 255, 255, 0.3);
    }
    
    .banner-footer p {
      margin: 5px 0;
      font-size: 0.9rem;
    }
    
    .download-hint {
      font-size: 0.9rem;
      opacity: 0.7;
    }
    
    .share-options {
      padding: 20px;
    }
    
    .theme-selector {
      margin-bottom: 20px;
    }
    
    .theme-selector p {
      margin: 0 0 10px;
      font-weight: bold;
    }
    
    .theme-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .theme-btn {
      padding: 8px 16px;
      border: 2px solid #ddd;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 0.9rem;
    }
    
    .theme-btn:hover {
      border-color: #666;
    }
    
    .theme-btn.active {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: white;
    }
    
    .share-buttons {
      display: flex;
      gap: 15px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    
    .share-buttons button {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: transform 0.3s, opacity 0.3s;
    }
    
    .share-buttons button:hover {
      transform: translateY(-2px);
      opacity: 0.9;
    }
    
    .btn-download {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-share {
      background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
      color: white;
    }
    
    .btn-copy {
      background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
      color: white;
    }
    
    .share-tips {
      text-align: center;
      padding: 15px;
      background: #f0f7ff;
      border-radius: 10px;
      margin-top: 20px;
    }
    
    .share-tips p {
      margin: 5px 0;
    }
    
    .small {
      font-size: 0.85rem;
      opacity: 0.7;
    }
    
    /* Temas do banner */
    .default {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .vibrant {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    
    .gradient {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }
    
    .gold {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      color: #333;
    }
    
    .nature {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: #333;
    }
    
    .ocean {
      background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%);
      color: white;
    }
    
    .sunset {
      background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
      color: white;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media (max-width: 768px) {
      .share-modal {
        width: 95%;
        max-height: 95vh;
      }
      
      .share-banner {
        width: 320px;
        height: 560px;
      }
      
      .share-buttons button {
        min-width: 100%;
      }
      
      .achievement-info h4 {
        font-size: 1.5rem;
      }
      
      .achievement-description {
        font-size: 1rem;
      }
    }
  `]
})
export class ShareBannerComponent {
  @Input() visible: boolean = false;
  @Input() goal: Goal | null = null;
  @Input() user: User | null = null;
  @Output() closeBanner = new EventEmitter<void>();
  
  @ViewChild('shareBanner') shareBanner!: ElementRef<HTMLElement>;
  
  theme: string = 'default';
  themes: string[] = ['default', 'vibrant', 'gradient', 'gold', 'nature', 'ocean', 'sunset'];
  completionDate: Date = new Date();
  canShare: boolean = false;
  
  constructor() {
    // Verifica se o Web Share API está disponível
    this.canShare = typeof navigator.share === 'function';
  }
  
  ngOnInit() {
    // Usa lastCompletedDate se completedAt não existir (backward compatibility)
    if (this.goal?.completedAt) {
      this.completionDate = new Date(this.goal.completedAt);
    } else if (this.goal?.lastCompletedDate) {
      this.completionDate = new Date(this.goal.lastCompletedDate);
    }
  }
  
  getGoalDescription(): string {
    if (!this.goal) return '';
    
    // Se não houver descrição, cria uma baseada na categoria e periodicidade
    if (!this.goal.category) {
      const periodMap: {[key: string]: string} = {
        'daily': 'diária',
        'weekly': 'semanal',
        'monthly': 'mensal',
        'once': 'única'
      };
      
      return `Meta ${periodMap[this.goal.periodicity] || ''} completada com sucesso!`;
    }
    
    return this.goal.category;
  }
  
  getThemeDisplayName(theme: string): string {
    const names: {[key: string]: string} = {
      'default': 'Padrão',
      'vibrant': 'Vibrante',
      'gradient': 'Gradiente',
      'gold': 'Dourado',
      'nature': 'Natureza',
      'ocean': 'Oceano',
      'sunset': 'Pôr do Sol'
    };
    
    return names[theme] || theme;
  }
  
  close() {
    this.closeBanner.emit();
  }
  
  async downloadBanner() {
    try {
      if (!this.shareBanner) return;
      
      // Verifica se html2canvas está disponível
      if (typeof html2canvas === 'undefined') {
        alert('Recurso de download não disponível no momento. Tente novamente mais tarde.');
        return;
      }
      
      const element = this.shareBanner.nativeElement;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      const fileName = `phocus-conquista-${this.goal?.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      alert('Banner baixado com sucesso! Agora você pode compartilhar nos seus stories! 📱');
      
      // Marca como compartilhado se houver serviço disponível
      this.markAsShared();
    } catch (error) {
      console.error('Erro ao baixar banner:', error);
      alert('Erro ao gerar o banner. Tente novamente.');
    }
  }
  
  async shareViaWebAPI() {
    if (!this.canShare || !this.goal) return;
    
    try {
      if (!this.shareBanner || typeof html2canvas === 'undefined') return;
      
      const element = this.shareBanner.nativeElement;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      canvas.toBlob(async (blob: Blob | null) => {
        if (blob) {
          const file = new File([blob], `conquista-${this.goal!.title}.png`, { type: 'image/png' });
          
          await navigator.share({
            title: `Conquistei a meta "${this.goal!.title}" no Phocus!`,
            text: `Acabei de completar 100% da meta "${this.goal!.title}" no Phocus App! 🎉`,
            files: [file]
          });
          
          // Marca como compartilhado
          this.markAsShared();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Fallback para download
      if (error instanceof Error && error.name !== 'AbortError') {
        this.downloadBanner();
      }
    }
  }
  
  async copyToClipboard() {
    const text = `Acabei de completar 100% da meta "${this.goal?.title}" no Phocus App! 🎉\n\nBaixe o app: https://phocus.app`;
    
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copiado para a área de transferência!');
    }
  }
  
  private markAsShared() {
    // Aqui você pode adicionar lógica para marcar a meta como compartilhada
    // Exemplo: this.goalService.markAsShared(this.goal!.id);
    console.log('Meta compartilhada:', this.goal?.title);
  }
}
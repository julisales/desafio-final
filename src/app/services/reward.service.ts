// src/app/services/reward.service.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Reward } from '../models/reward.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RewardService {
  private rewards: Reward[] = [
    {
      id: 'spotify-3m',
      title: '3 meses de Spotify Premium',
      description: 'Música ilimitada sem anúncios por 3 meses',
      xpCost: 10000,
      imageUrl: 'https://m.media-amazon.com/images/I/51rttY7a+9L._h1_.png',
      redeemed: false
    },
    {
      id: 'amazon-50',
      title: 'Vale-presente de R$50 na Amazon',
      description: 'Compre o que quiser na Amazon com este vale-presente',
      xpCost: 5000,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWuoGWU8ietYzF6yOEhYBi9mX0v-MFeVqi-Q&s',
      redeemed: false
    },
    {
      id: 'ifood-20',
      title: 'Cupom de R$20 no iFood',
      description: 'Peça sua comida favorita com este cupom do iFood',
      xpCost: 2000,
      imageUrl: 'https://static.ifood.com.br/webapp/images/logo-smile-512x512.png',
      redeemed: false
    },
    {
      id: 'netflix-1m',
      title: 'Assinatura de 1 mês na Netflix',
      description: 'Desfrute de filmes e séries com uma assinatura de 1 mês',
      xpCost: 1500,
      imageUrl: 'https://set.org.br/wp-content/uploads/2020/09/Netflix.png',
      redeemed: false
    },
    {
      id: 'bobs-milkshake',
      title: 'Milk-shake Grátis no Bob\'s',
      description: 'Aproveite um milk-shake saboroso na rede Bob\'s',
      xpCost: 1500,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWodjPVY-KFShBRNcyKGq5qtuGiTv0uNmn-w&s',
      redeemed: false
    },
    {
      id: 'leitura-40',
      title: 'Vale-livro de R$40 na Livraria Leitura',
      description: 'Escolha seu próximo livro favorito na Livraria Leitura',
      xpCost: 2000,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXP7H-ZfpzaT6f60TSJHFKZnOaRB6vKd0IEg&s',
      redeemed: false
    }
  ];

  constructor(private storage: StorageService) {
    this.loadRedeemedStatus();
  }

  private loadRedeemedStatus() {
    const redeemedIds = this.storage.get<string[]>('redeemedRewards') || [];
    this.rewards.forEach(reward => {
      reward.redeemed = redeemedIds.includes(reward.id);
    });
  }

  getAll(): Reward[] {
    return this.rewards;
  }

  redeemReward(user: User, rewardId: string): boolean {
    const reward = this.rewards.find(r => r.id === rewardId);
    
    if (!reward || reward.redeemed) return false;
    if (user.xp < reward.xpCost) return false;

    // Deduz XP
    user.xp -= reward.xpCost;
    
    // Marcar como resgatada
    reward.redeemed = true;
    
    // Salvar no storage
    const redeemedIds = this.storage.get<string[]>('redeemedRewards') || [];
    if (!redeemedIds.includes(rewardId)) {
      redeemedIds.push(rewardId);
      this.storage.set('redeemedRewards', redeemedIds);
    }
    
    return true;
  }
}
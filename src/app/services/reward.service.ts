// services/reward.service.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Reward } from '../models/reward.model';
import { v4 as uuid } from 'uuid';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RewardService {
  constructor(private storage: StorageService) {}

  all(): Reward[] {
    return this.storage.get<Reward[]>('rewards') ?? [
      { id: 'r1', title: 'Caneca Phocus', xpCost: 200 },
      { id: 'r2', title: 'Desconto 10%', xpCost: 500 },
    ];
  }

  redeem(user: User, rewardId: string) {
    const rewards = this.all();
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) throw new Error('Recompensa não encontrada');
    if (user.xp < reward.xpCost) throw new Error('XP insuficiente');

    // deduz XP
    user.xp -= reward.xpCost;
    // persistência: atualize via AuthService.updateUser
    // Para simular envio de e-mail, retornamos um objeto com "passos" que a UI mostrará
    return {
      ok: true,
      steps: [
        `Recompensa: ${reward.title}`,
        `Passo 1: Confirme seus dados no perfil`,
        `Passo 2: Aguarde instruções (simulado)`,
        `Passo 3: Recompensa enviada para o email ${user.email} (simulação)`
      ]
    };
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RewardService } from '../../services/reward.service';
import { User } from '../../models/user.model';
import { Reward } from '../../models/reward.model';

@Component({
  selector: 'app-rewards-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rewards-page.component.html',
  styleUrls: ['./rewards-page.component.css']
})
export class RewardsPageComponent implements OnInit {
  user: User | null = null;
  rewards: Reward[] = [];
  showConfetti = false;
  showSuccessMessage = false;
  successMessage = '';

  constructor(
    private authService: AuthService,
    private rewardService: RewardService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
    
    this.rewards = this.rewardService.getAll();
  }

  canRedeem(reward: Reward): boolean {
    if (!this.user) return false;
    return this.user.xp >= reward.xpCost && !reward.redeemed;
  }

  redeemReward(reward: Reward) {
    if (!this.user || !this.canRedeem(reward)) return;
    
    const success = this.rewardService.redeemReward(this.user, reward.id);
    
    if (success) {
            this.authService.updateUser(this.user);
      
            this.rewards = this.rewardService.getAll();
      
            this.showConfetti = true;
      setTimeout(() => {
        this.showConfetti = false;
      }, 2000);
      
            this.successMessage = `🎉 ${reward.title} resgatado!\n\nInstruções enviadas para:\n${this.user.email}`;
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    }
  }
}
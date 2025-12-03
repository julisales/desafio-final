import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as AOS from 'aos';
import { CommonModule } from '@angular/common';
import { CardFeatureComponent } from '../../components/card-feature/card-feature.component';
import { StepCardComponent } from '../../components/step-card/step-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardFeatureComponent, StepCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  currentStepIndex = 0;
  
  ngOnInit(): void {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      AOS.refresh();
    }, 500);
    
    // Opcional: auto-play do carrossel
    // this.startAutoPlay();
  }

  nextStep() {
    this.currentStepIndex = (this.currentStepIndex + 1) % this.steps.length;
  }

  prevStep() {
    this.currentStepIndex = (this.currentStepIndex - 1 + this.steps.length) % this.steps.length;
  }

  goToStep(index: number) {
    this.currentStepIndex = index;
  }

  // Opcional: auto-play
  // startAutoPlay() {
  //   setInterval(() => {
  //     this.nextStep();
  //   }, 5000);
  // }

  cards = [
    {
      icon: 'ti ti-target',
      title: 'Crie suas metas',
      description:
        'Defina objetivos personalizados com prazos e acompanhe seu progresso em tempo real.',
      delay: 0,
    },
    {
      icon: 'ti ti-trophy',
      title: 'Sistema de XP e Níveis',
      description:
        'Ganhe experiência a cada meta concluída e evolua seu nível continuamente.',
      delay: 100,
    },
    {
      icon: 'ti ti-gift',
      title: 'Recompensas Exclusivas',
      description:
        'Desbloqueie prêmios únicos ao atingir marcos importantes e mantenha-se motivado.',
      delay: 200,
    },
    {
      icon: 'ti ti-chart-bar',
      title: 'Monitore seu progresso',
      description:
        'Monitore seu nível atual, XP acumulado e sequência de dias para ver seu crescimento constante.',
      delay: 300,
    },
    {
      icon: 'ti ti-flare',
      title: 'Sequência de Dias',
      description:
        'Mantenha uma sequência diária de conquistas para aumentar sua motivação e consistência.',
      delay: 400,
    },
    {
      icon: 'ti ti-share',
      title: 'Compartilhe Conquistas',
      description:
        'Crie banners personalizados e compartilhe suas vitórias nos stories.',
      delay: 500,
    },
  ];

  
  steps = [
    {
      number: '01',
      title: 'Defina suas metas',
      description:
        'Escolha um objetivo que você quer alcançar e estabeleça um prazo realista.',
      delay: 0,
    },
    {
      number: '02',
      title: 'Seu progresso',
      description:
        'Marque suas tarefas diárias e veja sua barra de XP crescer a cada conquista.',
      delay: 150,
    },
    {
      number: '03',
      title: 'Ganhe Recompensas',
      description:
        'Desbloqueie conquistas exclusivas, suba de nível e personalize seu perfil.',
      delay: 300,
    },
    {
      number: '04',
      title: 'Compartilhe e Celebre',
      description:
        'Mostre suas vitórias para o mundo e inspire outras pessoas na comunidade.',
      delay: 450,
    },
  ];
}

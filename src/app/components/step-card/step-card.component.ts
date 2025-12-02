import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-card.component.html',
  styleUrls: ['./step-card.component.css'],
})
export class StepCardComponent {
  // número do passo (p.ex. '01' ou 1)
  @Input() number: string | number = '';
  @Input() title = '';
  @Input() description = '';
  // aceita número ou string (será usado em data-aos-delay)
  @Input() delay: number | string = 0;
  // ícone opcional (classe)
  @Input() iconClass = 'ti ti-circle-check';
}
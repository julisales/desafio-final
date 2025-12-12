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
    @Input() number: string | number = '';
  @Input() title = '';
  @Input() description = '';
    @Input() delay: number | string = 0;
    @Input() iconClass = 'ti ti-circle-check';
}
import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-card-feature',
  standalone: true,
  imports: [],
  templateUrl: './card-feature.component.html',
  styleUrls: ['./card-feature.component.css'],
})
export class CardFeatureComponent {
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
  @Input() delay: number | string = 0;

  @Input() parity: 'odd' | 'even' = 'odd';
  @HostBinding('class') get hostClass(): string {
    return this.parity;
  }
}

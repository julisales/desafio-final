import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CardFeatureComponent } from './components/card-feature/card-feature.component';
import { CommonModule } from '@angular/common'; 
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { SignComponent } from './pages/sign-page/sign-page.component';
import { CardGoalComponent } from './card-goal/card-goal.component';
import { GoalCreateComponent } from './goal-create/goal-create.component';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule, 
    HomeComponent, 
    CardFeatureComponent, 
    SignComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    MainPageComponent,
    CardGoalComponent,
    GoalCreateComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'phocus';
}
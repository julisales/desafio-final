import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SignComponent } from './pages/sign-page/sign-page.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { RewardsPageComponent } from './pages/rewards-page/rewards-page.component';
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'sign', component: SignComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ROTAS PROTEGIDAS
  {
    path: 'main-page',
    component: MainPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'rewards-page',
    component: RewardsPageComponent,
    canActivate: [AuthGuard],
  },

  { path: '**', redirectTo: 'home' },
];

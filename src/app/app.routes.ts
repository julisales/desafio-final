import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SignComponent } from './pages/sign-page/sign-page.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { MainPageComponent } from './pages/main-page/main-page.component';

export const routes: Routes = [
    {path: "", redirectTo: "home", pathMatch: "full"},
    {path: "home", component: HomeComponent},
    {path: "sign", component: SignComponent},
    {path: "forgot-password", component: ForgotPasswordComponent},
    {path: "main-page", component: MainPageComponent},
    {path: "reset-password", component: ResetPasswordComponent},
    {path: "**", redirectTo: "home"},
];
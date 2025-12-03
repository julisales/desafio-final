// sign.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; // implemente/ajuste conforme sua app
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-page',
  templateUrl: './sign-page.component.html', // seu HTML
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styleUrls: ['./sign-page.component.css'], // opcional
})
export class SignComponent implements OnInit, OnDestroy {
  activeTab: 'login' | 'register' = 'login';

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  loading = false;
  serverError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForms();
  }

  private buildForms() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    // Register form: adiciona 'consent' obrigatório
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        consent: [false, [Validators.requiredTrue]], // <- obrigatório
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  // custom validator para checar se password === confirmPassword
  private passwordsMatchValidator(
    group: AbstractControl
  ): ValidationErrors | null {
    const p = group.get('password')?.value;
    const cp = group.get('confirmPassword')?.value;
    if (p && cp && p !== cp) {
      return { passwordsMismatch: true };
    }
    return null;
  }

  switchTab(tab: 'login' | 'register') {
    this.serverError = null;
    this.activeTab = tab;
  }

  onLogin() {
    this.serverError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = this.loginForm.value;
    this.loading = true;

    this.authService
      .login(payload.email, payload.password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
        catchError((err) => {
          // exibe erro simples; ajuste conforme formato do seu backend
          this.serverError = err?.message ?? 'Erro ao realizar login.';
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (res) => {
          // supondo que o serviço retorne algo útil (token, user, etc)
          // redirecione para a home/dashboard
          this.router.navigate(['/main-page']);
        },
      });
  }

  onRegister() {
    this.serverError = null;

    if (this.registerForm.invalid) {
      // se o erro for mismatch, marcar campos para mostrar mensagem
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.value;
    this.loading = true;

    this.authService
      .register(name, email, password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
        catchError((err) => {
          this.serverError = err?.message ?? 'Erro ao criar conta.';
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (res) => {
          // após registro, você pode logar automaticamente ou forçar o login
          // Ex: redireciona para pagina de verificação ou dashboard
          this.router.navigate(['/welcome']);
        },
      });
  }

  // helper para template (opcional)
  fieldInvalid(form: FormGroup, field: string) {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openPrivacyPolicy(event: Event) {
  event.preventDefault();
  // abra o modal / popup / nav que você quiser
  console.log("Abrindo política de privacidade...");
}

}

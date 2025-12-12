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
import { AuthService } from '../../services/auth.service'; import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-page',
  templateUrl: './sign-page.component.html',   imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styleUrls: ['./sign-page.component.css'], })
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

        this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        consent: [false, [Validators.requiredTrue]],       },
      { validators: this.passwordsMatchValidator }
    );
  }

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

  const { email, password } = this.loginForm.value;
  this.loading = true;

  this.authService
    .login(email, password)
    .pipe(takeUntil(this.destroy$), finalize(() => (this.loading = false)))
    .subscribe({
      next: () => {
        this.router.navigate(['/main-page']);
      },
      error: (err) => {
                this.serverError = err?.message ?? 'Email ou senha inválidos.';
      },
    });
}

  onRegister() {
  this.serverError = null;
  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  const { name, email, password } = this.registerForm.value;
  this.loading = true;

  this.authService
    .register(name, email, password)
    .pipe(takeUntil(this.destroy$), finalize(() => (this.loading = false)))
    .subscribe({
      next: () => {
        this.router.navigate(['/main-page']);
      },
      error: (err) => {
        this.serverError = err?.message ?? 'Erro ao criar conta.';
      },
    });
}


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

  console.log("Abrindo política de privacidade...");
}

}

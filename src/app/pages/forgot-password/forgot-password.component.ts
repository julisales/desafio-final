import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface StoredUser {
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  private USERS_KEY = 'phocus_users';
  private RESET_KEY_PREFIX = 'phocus_reset_'; 

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private getStoredUsers(): StoredUser[] {
    try {
      const raw = localStorage.getItem(this.USERS_KEY);
      return raw ? JSON.parse(raw) as StoredUser[] : [];
    } catch {
      return [];
    }
  }

    private makeToken(): string {
    return Math.random().toString(36).slice(2, 10);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email.trim().toLowerCase();
    const users = this.getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email);

    if (!found) {
      alert('Não encontramos uma conta com esse email.');
      return;
    }

        const token = this.makeToken();
    try {
            localStorage.setItem(this.RESET_KEY_PREFIX + email, JSON.stringify({
        token,
        createdAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Não foi possível salvar token no localStorage', e);
    }

        const simulatedLink = `${location.origin}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
    alert(`Enviamos um link de redefinição para ${email}.`);

    this.router.navigate(['/reset-password']); 
  }

  backToHome() {
    this.router.navigate(['/']);
  }

  get emailControl() { return this.form.controls['email']; }
}
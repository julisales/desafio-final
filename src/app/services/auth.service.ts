// services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';
import { v4 as uuid } from 'uuid'; // opcional, ou gerar id manual

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private storage: StorageService) {
    const saved = this.storage.get<User>('currentUser');
    if (saved) this.userSubject.next(saved);
  }

  register(name: string, email: string, password: string): Observable<User> {
    const users = this.storage.get<User[]>('users') ?? [];
    if (users.some(u => u.email === email)) {
      return throwError(() => ({ message: 'Email já cadastrado' }));
    }
    const user: User = {
      id: uuid(),
      name,
      email,
      password,
      xp: 0,
      level: 1,
      streak: 0,
      goalsIds: [],
      groupsIds: []
    };
    users.push(user);
    this.storage.set('users', users);
    // Sessão automática
    this.storage.set('currentUser', user);
    this.userSubject.next(user);
    return of(user);
  }

  login(email: string, password: string): Observable<User> {
    const users = this.storage.get<User[]>('users') ?? [];
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return throwError(() => ({ message: 'Email ou senha inválidos' }));
    this.storage.set('currentUser', found);
    this.userSubject.next(found);
    return of(found);
  }

  logout() {
    this.storage.set('currentUser', null);
    this.userSubject.next(null);
  }

  // atualiza o usuário no storage e BehaviorSubject
  updateUser(user: User) {
    const users = this.storage.get<User[]>('users') ?? [];
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    this.storage.set('users', users);
    this.storage.set('currentUser', user);
    this.userSubject.next(user);
  }

  getCurrentUserSnapshot(): User | null {
    return this.userSubject.getValue();
  }
}
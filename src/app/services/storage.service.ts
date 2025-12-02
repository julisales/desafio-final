// services/storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private prefix = 'phocus_';

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(this.prefix + key);
    return raw ? JSON.parse(raw) as T : null;
  }

  set<T>(key: string, value: T) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  clear() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(this.prefix)) localStorage.removeItem(k);
    });
  }
}
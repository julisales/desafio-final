// services/group.service.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Group } from '../models/group.model';
import { v4 as uuid } from 'uuid';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  constructor(private storage: StorageService) {}

  all(): Group[] {
    return this.storage.get<Group[]>('groups') ?? [];
  }

  create(name: string, creator: User): Group {
    const g: Group = { id: uuid(), name, adminIds: [creator.id], memberIds: [creator.id], goalsIds: [] };
    const arr = this.all();
    arr.push(g);
    this.storage.set('groups', arr);

    // vincular grupo ao usuário
    const users = this.storage.get<User[]>('users') ?? [];
    const uidx = users.findIndex(u => u.id === creator.id);
    if (uidx >= 0) {
      users[uidx].groupsIds.push(g.id);
      this.storage.set('users', users);
    }
    return g;
  }

  addMemberByEmail(groupId: string, email: string) {
    const users = this.storage.get<User[]>('users') ?? [];
    const u = users.find(x => x.email === email);
    if (!u) throw new Error('Usuário não encontrado');
    const groups = this.all();
    const g = groups.find(x => x.id === groupId);
    if (!g) throw new Error('Grupo não encontrado');
    if (!g.memberIds.includes(u.id)) g.memberIds.push(u.id);
    // vincula grupo ao usuário se ainda não vinculado
    if (!u.groupsIds.includes(groupId)) u.groupsIds.push(groupId);
    this.storage.set('groups', groups);
    this.storage.set('users', users);
  }

  removeMember(groupId: string, userId: string) {
    const groups = this.all();
    const g = groups.find(x => x.id === groupId);
    if (!g) throw new Error('Grupo não encontrado');
    g.memberIds = g.memberIds.filter(id => id !== userId);
    g.adminIds = g.adminIds.filter(id => id !== userId);
    this.storage.set('groups', groups);
    // desvincula do usuário
    const users = this.storage.get<User[]>('users') ?? [];
    const u = users.find(x => x.id === userId);
    if (u) {
      u.groupsIds = u.groupsIds.filter(id => id !== groupId);
      this.storage.set('users', users);
    }
  }

  toggleAdmin(groupId: string, userId: string) {
    const groups = this.all();
    const g = groups.find(x => x.id === groupId);
    if (!g) throw new Error('Grupo não encontrado');
    if (g.adminIds.includes(userId)) g.adminIds = g.adminIds.filter(id => id !== userId);
    else g.adminIds.push(userId);
    this.storage.set('groups', groups);
  }
}
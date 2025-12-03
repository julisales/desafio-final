// src/app/services/group.service.ts
import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Group } from '../models/group.model';
import { Goal } from '../models/goal.model';
import { v4 as uuid } from 'uuid';
import { User } from '../models/user.model';
import { GoalService } from './goal.service';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private maxGoalsPerGroup = 4;
  private defaultGroups: Group[] = [
    {
      id: 'group-1',
      name: 'Fitness Squad',
      description: 'Grupo focado em metas fitness e saúde.',
      adminIds: ['user-1'],
      memberIds: ['user-1', 'user-2', 'user-3'],
      goalsIds: [],
      createdAt: new Date().toISOString(),
      totalXp: 15000,
      category: 'fitness'
    },
    {
      id: 'group-2',
      name: 'Desafios Semanais',
      description: 'Desafios semanais de aprendizado e desenvolvimento pessoal.',
      adminIds: ['user-1'],
      memberIds: ['user-1', 'user-4', 'user-5'],
      goalsIds: [],
      createdAt: new Date().toISOString(),
      totalXp: 12000,
      category: 'study'
    },
    {
      id: 'group-3',
      name: 'Produtividade Máxima',
      description: 'Foco em metas de produtividade e organização.',
      adminIds: ['user-2'],
      memberIds: ['user-2', 'user-6', 'user-7'],
      goalsIds: [],
      createdAt: new Date().toISOString(),
      totalXp: 10000,
      category: 'work'
    }
  ];

  constructor(private storage: StorageService) {}

  getAll(): Group[] {
    const storedGroups = this.storage.get<Group[]>('groups');
    if (!storedGroups || storedGroups.length === 0) {
      this.storage.set('groups', this.defaultGroups);
      return this.defaultGroups;
    }
    return storedGroups;
  }

  getById(id: string): Group | undefined {
    return this.getAll().find(group => group.id === id);
  }

  getUserGroups(userId: string): Group[] {
    return this.getAll().filter(group => 
      group.memberIds.includes(userId)
    );
  }

  getTopGroups(limit: number = 5): Group[] {
    return this.getAll()
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, limit);
  }

  create(name: string, description: string, creator: User, category?: string): Group {
    const newGroup: Group = {
      id: uuid(),
      name,
      description,
      adminIds: [creator.id],
      memberIds: [creator.id],
      goalsIds: [],
      createdAt: new Date().toISOString(),
      totalXp: 0,
      category: category as any || 'other'
    };

    const groups = this.getAll();
    groups.push(newGroup);
    this.storage.set('groups', groups);

    // Atualizar usuário
    if (!creator.groupsIds) creator.groupsIds = [];
    creator.groupsIds.push(newGroup.id);
    this.updateUser(creator);

    return newGroup;
  }

  update(group: Group): boolean {
    const groups = this.getAll();
    const index = groups.findIndex(g => g.id === group.id);
    if (index === -1) return false;

    groups[index] = group;
    this.storage.set('groups', groups);
    return true;
  }

  addGoalToGroup(groupId: string, goalData: Omit<Goal, 'id' | 'ownerId' | 'ownerType'>): { success: boolean; goal?: Goal; message: string } {
    const group = this.getById(groupId);
    if (!group) {
      return { success: false, message: 'Grupo não encontrado' };
    }

    // Verificar limite de metas
    if (group.goalsIds.length >= this.maxGoalsPerGroup) {
      return { 
        success: false, 
        message: `Limite de ${this.maxGoalsPerGroup} metas atingido para este grupo` 
      };
    }

    // Criar a meta para o grupo
    const goalService = new GoalService(this.storage);
    const goal: Goal = {
      id: uuid(),
      ownerId: groupId,
      ownerType: 'group',
      ...goalData
    };

    // Salvar a meta
    goalService.save(goal);

    // Adicionar ao grupo
    group.goalsIds.push(goal.id);
    const updateSuccess = this.update(group);

    if (updateSuccess) {
      // Recalcular XP do grupo
      group.totalXp = this.calculateGroupXp(groupId);
      this.update(group);
      
      return { 
        success: true, 
        goal, 
        message: 'Meta adicionada ao grupo com sucesso!' 
      };
    }

    return { success: false, message: 'Erro ao adicionar meta ao grupo' };
  }

  removeGoalFromGroup(groupId: string, goalId: string): boolean {
    const group = this.getById(groupId);
    if (!group) return false;

    // Remover do array de metas do grupo
    group.goalsIds = group.goalsIds.filter(id => id !== goalId);
    
    // Remover a meta do storage
    const goalService = new GoalService(this.storage);
    const allGoals = goalService.getAll();
    const filteredGoals = allGoals.filter(g => g.id !== goalId);
    this.storage.set('goals', filteredGoals);

    // Recalcular XP
    group.totalXp = this.calculateGroupXp(groupId);
    
    return this.update(group);
  }

  getGroupGoals(groupId: string): Goal[] {
    const group = this.getById(groupId);
    if (!group) return [];

    const goalService = new GoalService(this.storage);
    const allGoals = goalService.getAll();
    
    return allGoals.filter(goal => 
      goal.ownerType === 'group' && 
      goal.ownerId === groupId
    );
  }

  canAddMoreGoals(groupId: string): boolean {
    const group = this.getById(groupId);
    if (!group) return false;
    
    return group.goalsIds.length < this.maxGoalsPerGroup;
  }

  getRemainingGoalSlots(groupId: string): number {
    const group = this.getById(groupId);
    if (!group) return 0;
    
    return Math.max(0, this.maxGoalsPerGroup - group.goalsIds.length);
  }

  // Método para verificar se uma meta específica pertence ao grupo
  isGoalFromGroup(goalId: string, groupId: string): boolean {
    const group = this.getById(groupId);
    if (!group) return false;
    
    return group.goalsIds.includes(goalId);
  }

  addMemberByEmail(groupId: string, email: string): { success: boolean; message: string } {
    const users = this.storage.get<User[]>('users') || [];
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    }

    const group = this.getById(groupId);
    if (!group) {
      return {
        success: false,
        message: 'Grupo não encontrado'
      };
    }

    if (group.memberIds.includes(user.id)) {
      return {
        success: false,
        message: 'Usuário já é membro do grupo'
      };
    }

    group.memberIds.push(user.id);
    
    // Atualizar usuário
    if (!user.groupsIds) user.groupsIds = [];
    if (!user.groupsIds.includes(groupId)) {
      user.groupsIds.push(groupId);
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = user;
        this.storage.set('users', users);
      }
    }

    this.update(group);
    
    return {
      success: true,
      message: `${user.name} adicionado ao grupo com sucesso!`
    };
  }

  removeMember(groupId: string, userId: string): boolean {
    const group = this.getById(groupId);
    if (!group) return false;

    group.memberIds = group.memberIds.filter(id => id !== userId);
    group.adminIds = group.adminIds.filter(id => id !== userId);

    // Atualizar usuário
    const users = this.storage.get<User[]>('users') || [];
    const user = users.find(u => u.id === userId);
    if (user) {
      user.groupsIds = (user.groupsIds || []).filter(id => id !== groupId);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex] = user;
        this.storage.set('users', users);
      }
    }

    return this.update(group);
  }

  toggleAdmin(groupId: string, userId: string): boolean {
    const group = this.getById(groupId);
    if (!group) return false;

    if (group.adminIds.includes(userId)) {
      group.adminIds = group.adminIds.filter(id => id !== userId);
    } else {
      group.adminIds.push(userId);
    }

    return this.update(group);
  }

  deleteGroup(groupId: string): boolean {
    const groups = this.getAll();
    const initialLength = groups.length;
    const filteredGroups = groups.filter(g => g.id !== groupId);
    
    if (filteredGroups.length === initialLength) return false;
    
    // Remover grupo dos usuários
    const users = this.storage.get<User[]>('users') || [];
    const updatedUsers = users.map(user => ({
      ...user,
      groupsIds: (user.groupsIds || []).filter(id => id !== groupId)
    }));
    
    // Remover metas do grupo
    const goalService = new GoalService(this.storage);
    const allGoals = goalService.getAll();
    const filteredGoals = allGoals.filter(g => !(g.ownerType === 'group' && g.ownerId === groupId));
    this.storage.set('goals', filteredGoals);
    
    this.storage.set('users', updatedUsers);
    this.storage.set('groups', filteredGroups);
    
    return true;
  }

  calculateGroupXp(groupId: string): number {
    const group = this.getById(groupId);
    if (!group) return 0;

    const users = this.storage.get<User[]>('users') || [];
    const groupUsers = users.filter(u => group.memberIds.includes(u.id));
    
    return groupUsers.reduce((total, user) => total + (user.xp || 0), 0);
  }

  recalculateAllGroupsXp() {
    const groups = this.getAll();
    groups.forEach(group => {
      group.totalXp = this.calculateGroupXp(group.id);
    });
    this.storage.set('groups', groups);
  }

  private updateUser(user: User): void {
    const users = this.storage.get<User[]>('users') || [];
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      this.storage.set('users', users);
    }
  }
}
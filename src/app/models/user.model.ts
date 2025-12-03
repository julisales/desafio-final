export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // só armazenar em simulação; no real backend não
  xp: number;
  level: number;
  streak: number; // sequência diária
  lastStreakDate?: string; // nova propriedade: data da última atualização de streak (YYYY-MM-DD)
  goalsIds: string[]; // metas pessoais
  groupsIds: string[]; // grupos que participa
  redeemedRewards: string[];
}

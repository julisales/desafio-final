// src/app/utils/utils.ts
export function podeCompletar(
  periodicity: 'daily' | 'weekly' | 'monthly' | 'once',
  lastCompletedDate?: string,
  referenceDate?: Date // Data de referência (normalmente "agora")
): boolean {
  if (!lastCompletedDate) return true; // Nunca foi concluída
  
  const lastDate = new Date(lastCompletedDate);
  const now = referenceDate || new Date();
  
  // Para metas únicas que já foram concluídas
  if (periodicity === 'once') return false;
  
  switch (periodicity) {
    case 'daily':
      // Reset a cada dia às 00:00
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      
      const startOfLastDate = new Date(lastDate);
      startOfLastDate.setHours(0, 0, 0, 0);
      
      return startOfLastDate.getTime() < startOfToday.getTime();
    
    case 'weekly':
      // Reset a cada semana (domingo à meia-noite)
      const startOfThisWeek = getStartOfWeek(now);
      const startOfLastWeek = getStartOfWeek(lastDate);
      
      return startOfLastWeek.getTime() < startOfThisWeek.getTime();
    
    case 'monthly':
      // Reset no primeiro dia do mês
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
      
      return startOfLastMonth.getTime() < startOfThisMonth.getTime();
    
    default:
      return true;
  }
}

// Função auxiliar para encontrar o início da semana (domingo)
function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Domingo, 1 = Segunda, ...
  const diff = result.getDate() - day; // Ajusta para o domingo mais recente
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Função para verificar se já é um novo dia
export function isNewDay(lastDate?: string): boolean {
  if (!lastDate) return true;
  
  const last = new Date(lastDate);
  const now = new Date();
  
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  
  const startOfLastDay = new Date(last);
  startOfLastDay.setHours(0, 0, 0, 0);
  
  return startOfLastDay.getTime() < startOfToday.getTime();
}

// Função para verificar se já é uma nova semana
export function isNewWeek(lastDate?: string): boolean {
  if (!lastDate) return true;
  
  const last = new Date(lastDate);
  const now = new Date();
  
  return getStartOfWeek(last).getTime() < getStartOfWeek(now).getTime();
}

// Função para verificar se já é um novo mês
export function isNewMonth(lastDate?: string): boolean {
  if (!lastDate) return true;
  
  const last = new Date(lastDate);
  const now = new Date();
  
  const startOfLastMonth = new Date(last.getFullYear(), last.getMonth(), 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return startOfLastMonth.getTime() < startOfThisMonth.getTime();
}

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
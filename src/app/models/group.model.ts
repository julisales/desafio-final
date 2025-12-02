export interface Group {
  id: string;
  name: string;
  adminIds: string[]; // user ids
  memberIds: string[]; // includes admins
  goalsIds: string[];
}
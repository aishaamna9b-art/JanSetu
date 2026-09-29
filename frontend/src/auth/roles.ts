export type Role = 'citizen' | 'officer' | 'admin' | null;

export interface UserSession {
  uid: string;
  role: Role;
  language: string;
  region: string;
}

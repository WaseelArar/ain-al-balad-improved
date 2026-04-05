export interface User {
  usersId: number;
  username: string;
  phone?: string;
  password: string;
  role: "USER" | "ADMIN" | "MUNICIPAL";
  isAdmin?: boolean;
  regionsId?: number;
  isActive: boolean;
}

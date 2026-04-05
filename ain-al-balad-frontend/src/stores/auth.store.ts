// src/stores/user.ts
import { writable } from "svelte/store";

export interface User {
  usersId: number;
  username: string;
  phone: string;
  role: "USER" | "ADMIN" | "MUNICIPAL";
  regionsId?: number;
  regionsName?: string;
  token: string;
}

// Initialize from localStorage if present
const storedUser = localStorage.getItem("user");
export const user = writable<User | null>(
  storedUser ? JSON.parse(storedUser) : null,
);

export const setUser = (userData: User) => {
  user.set(userData);
  localStorage.setItem("user", JSON.stringify(userData));
};

export const clearUser = () => {
  user.set(null);
  localStorage.removeItem("user");
};

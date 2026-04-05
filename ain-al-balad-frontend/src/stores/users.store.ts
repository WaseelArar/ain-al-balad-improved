import apiInstance from "$lib/api/api";
import { writable } from "svelte/store";

export type userRole = "USER" | "ADMIN" | "MUNICIPAL";

export interface ManagedUser {
  usersId: number;
  username: string;
  phone: string;
  role: userRole;
  isActive?: boolean;
  createdAt?: string;
  regionsId?: number;
  regionsName?: string;
}

interface AdminUsersState {
  items: ManagedUser[];
  loading: boolean;
  meta: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

// Fixed: Apply the interface to the store's initial state
export const adminUsers = writable<AdminUsersState>({
  items: [],
  loading: false,
  meta: {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  },
});

export const fetchAdminUsers = async (page = 1, search = "") => {
  adminUsers.update((s) => ({ ...s, loading: true }));
  try {
    const res = await apiInstance.get(`/admin/users`, {
      params: { page, search },
    });

    adminUsers.set({
      items: res.data.items,
      meta: res.data.meta,
      loading: false,
    });
  } catch (err) {
    adminUsers.update((s) => ({ ...s, loading: false }));
    throw err; // Re-throw so the UI can handle errors if needed
  }
};

export const adminActions = {
  async setPassword(usersId: number, newPassword: string) {
    return apiInstance.patch("/admin/users/chpasswd", { usersId, newPassword });
  },

  // Fixed: Restricted the newRole type to match ManagedUser role
  async changeRole(usersId: number, newRole: ManagedUser["role"]) {
    return apiInstance.patch("/admin/users/chrole", { usersId, newRole });
  },

  // Fixed: Restricted the newRole type to match ManagedUser role
  async toggleAccess(usersId: number) {
    return apiInstance.patch("/admin/users/status", { usersId });
  },

  async deleteUser(usersId: number) {
    return apiInstance.delete(`/admin/users/${usersId}`);
  },
};

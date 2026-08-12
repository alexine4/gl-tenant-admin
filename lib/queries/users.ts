import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetchJson";
import type { ManagedRole, TenantUser } from "@/lib/tenant-users-client";

export const USERS_KEY = ["users"] as const;
export const userKey = (userId: string) => ["users", userId] as const;

export function useUsersQuery() {
  return useQuery({ queryKey: USERS_KEY, queryFn: () => fetchJson<TenantUser[]>("/tenant/users") });
}

export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: userKey(userId),
    queryFn: () => fetchJson<TenantUser>(`/tenant/users/${userId}`),
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; display_name: string; role: ManagedRole; password: string }) =>
      fetchJson<TenantUser>("/tenant/users", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUpdateUserMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; display_name: string; role: ManagedRole }) =>
      fetchJson<TenantUser>(`/tenant/users/${userId}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      queryClient.setQueryData(userKey(userId), data);
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useChangePasswordMutation(userId: string) {
  return useMutation({
    mutationFn: (newPassword: string) =>
      fetchJson<void>(`/tenant/users/${userId}/change-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword }),
      }),
  });
}

export function useToggleUserStatusMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "deactivate" | "reactivate") =>
      fetchJson<TenantUser>(`/tenant/users/${userId}/${action}`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.setQueryData(userKey(userId), data);
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

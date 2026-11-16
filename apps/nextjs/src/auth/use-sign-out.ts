"use client";

import { log } from "@example-app/shared";

import { authClient } from "~/auth/client";

/** Signs out and lands on /login — even if the request fails, to be safe. */
export function useSignOut() {
  return async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch (error) {
      log.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };
}

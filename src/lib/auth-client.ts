import { i18nClient } from "@better-auth/i18n/client";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient(), i18nClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

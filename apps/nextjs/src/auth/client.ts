import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { Auth } from "@example-app/auth";

export const authClient = createAuthClient({
  // `inferAdditionalFields` mirrors the server's `user.additionalFields`
  // (e.g. `isAdmin`) onto the client session type. The `Auth` import is
  // type-only, so no server code is bundled into the client.
  plugins: [inferAdditionalFields<Auth>(), magicLinkClient()],
});

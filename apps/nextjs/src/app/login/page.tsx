import { connection } from "next/server";

import { LoginForm } from "~/_components/auth/LoginForm";
import { enabledSocialProviders } from "~/auth/providers";

export default async function LoginPage() {
  // Provider availability comes from the *runtime* environment. Render per
  // request so an image built without secrets (SKIP_ENV_VALIDATION) still
  // shows the providers configured where it runs.
  await connection();

  return <LoginForm providers={enabledSocialProviders} />;
}

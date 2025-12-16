import baseConfig, { restrictEnvAccess } from "@example-app/eslint-config/base";
import nextjsConfig from "@example-app/eslint-config/nextjs";
import reactConfig from "@example-app/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];

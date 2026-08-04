/// <reference types="nativewind/types" />

// TypeScript 7 requires declarations for side-effect imports (TS2882).
// `src/app/_layout.tsx` imports the NativeWind entry stylesheet.
declare module "*.css" {}

// Tailwind 4 for NativeWind v5. Expo's Metro only picks up postcss.config.js
// or .mjs — not .cjs. Without this file Tailwind never runs and every
// `className` renders unstyled.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

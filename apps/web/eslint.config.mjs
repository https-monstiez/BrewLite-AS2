import { defineConfig, globalIgnores } from "eslint/config";
import next from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
export default defineConfig([
 globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/sw.js"]),
 ...tseslint.configs.recommended,
 { plugins: { "@next/next": next }, rules: { "@typescript-eslint/no-explicit-any": "off", "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }], "@next/next/no-html-link-for-pages": "error" } }
]);
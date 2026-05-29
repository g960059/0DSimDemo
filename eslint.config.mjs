import firebaseRulesPlugin from "@firebase/eslint-plugin-security-rules";

export default [
  {
    ignores: ["dist/**/*", "node_modules/**/*", "components/**/*", "services/**/*", "scripts/**/*", "engine/**/*"]
  },
  firebaseRulesPlugin.configs["flat/recommended"],
];

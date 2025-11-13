import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        // project 옵션 제거 - type-aware 규칙은 모두 off 되어 있으므로 불필요
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
        ...globals.jest,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // TypeScript ESLint recommended rules (기본만 적용)
      ...tsPlugin.configs.recommended.rules,

      // TypeScript specific overrides
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off", // any 완전 허용 (Express 호환성)
      "@typescript-eslint/no-unused-vars": "off", // 미사용 변수 완전 허용

      // Type safety rules (완화)
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",

      // Promise handling (완화) - type-aware 규칙이므로 project 없이는 동작 안함
      "@typescript-eslint/no-floating-promises": "off", // 완전 허용
      "@typescript-eslint/no-misused-promises": "off", // 완전 허용

      // 기타
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/unbound-method": "off",

      // General (완화)
      "no-console": "off", // console.log 허용 (개발 중)
      "prefer-const": "off", // let 허용
      "no-var": "error", // var는 금지 유지
      "no-unused-vars": "off", // 미사용 변수 허용
      "no-useless-escape": "off", // 불필요한 이스케이프 허용
      "no-useless-catch": "off", // 불필요한 try/catch 허용
      "no-undef": "off", // 정의되지 않은 변수 허용
      "no-self-assign": "off", // 자기 할당 허용
    },
  },

  // JavaScript files (test files in test/javascript/)
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-undef": "off",
      "no-console": "off",
      "no-unused-vars": "off",
      "no-self-assign": "off",
    },
  },

  // Ignore patterns
  {
    ignores: [
      "dist/",
      "coverage/",
      "node_modules/",
      "examples/",
      "benchmarks/",
      "*.config.js",
      "*.config.cjs",
      "*.config.mjs",
      "jest.config.js",
    ],
  },
];

import js from "@eslint/js";
import globals from "globals";
import { configs as tsConfigs } from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
// eslint-disable-next-line import-x/no-named-as-default
import reactRefresh from "eslint-plugin-react-refresh";
import { flatConfigs } from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier/flat";

export default [
  // 全局忽略
  { ignores: ["dist", "dist-electron", "eslint.config.js"] },
  // 官方预设
  js.configs.recommended,
  // 显式限定 TS 规则只作用于 TS 文件
  ...tsConfigs.recommended.map(c => ({ ...c, files: ["**/*.{ts,tsx}"] })),
  // import 插件推荐规则（分析 / 正确性）
  flatConfigs.recommended,
  // import 插件 TypeScript 适配
  flatConfigs.typescript,
  {
    // 作用于 ts/tsx 文件
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React 19 不使用 default export
      "import-x/default": "off",
      "import-x/no-named-as-default-member": "off",
      // import 排序
      "import-x/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      // import 块后空行
      "import-x/newline-after-import": "warn",
      // react-hooks recommended rules（手动展开，避免 eslintrc 兼容问题）
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "error",
      "react-hooks/incompatible-library": "off",
      "react-hooks/immutability": "error",
      "react-hooks/globals": "warn",
      "react-hooks/refs": "error",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-render": "error",
      "react-hooks/unsupported-syntax": "warn",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
      // react-refresh
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  // Vite 配置文件使用 Vite 自身的模块解析，关闭 import/no-unresolved
  {
    files: ["vite.config.ts"],
    rules: {
      "import-x/no-unresolved": "off",
    },
  },
  // 关闭与 Prettier 冲突的 ESLint 规则（必须放在最后）
  prettier,
];

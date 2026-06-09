module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'simple-import-sort'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'simple-import-sort/imports': ['error', {
      groups: [
        // ① React 相关的第三方库排最前
        ['^react'],
        // ② 其他第三方库
        ['^@?\\w'],
        // ③ 本地相对导入
        ['^\\.'],
        // ④ 副效应导入（如 CSS）排最后
        ['^\\u0000'],
      ],
    }],
    'simple-import-sort/exports': 'error',
  },
}

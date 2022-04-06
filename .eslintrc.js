module.exports = {
  extends: [
    "plugin:markdown/recommended",
    "standard-with-typescript",
    "prettier",
  ],
  plugins: ["markdown"],
  parserOptions: {
    project: "./tsconfig.json",
  },
}

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    "parser": "babel-eslint"
  },
  env: {
    browser: true,
    node: true
  },
  extends: [
    "plugin:vue/essential",
    "@vue/standard"
  ],
  globals: {
    __static: true
  },
  // plugins: [
  //   'html'
  // ],
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}

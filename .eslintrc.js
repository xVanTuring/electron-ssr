module.exports = {
  root: true,
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
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // https://github.com/babel/babel-eslint/issues/681
    "template-curly-spacing" : "off",
    indent : "off"
  }
}

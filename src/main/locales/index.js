let LANG = 'en-US'
let dict = null
export default function t (key, lang = 'en-US') {
  if (lang) {
    LANG = lang
  }
  if (!dict) {
    dict = require(`./${LANG}.json`)
  }
  return dict[key]
}

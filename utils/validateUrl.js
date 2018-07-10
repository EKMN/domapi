const REGEX = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!-/]))?/

module.exports = (url) => {
  return !!REGEX.test(url)
}

const cheerio = require('cheerio')

module.exports = ({ body, instructions }) => {
  const $ = cheerio.load(body)

  const descriptions = Object.keys(instructions)
  const objectives = Object.values(instructions)

  instructions = descriptions.map((description, i) => {
    return {
      description,
      objective: objectives[i]
    }
  })

  return instructions.map((instruction, i) => {
    let content = []

    $(instruction.objective).each((i, elem) => {
      content[i] = $(elem).text().trim()
    })

    return {
      description: instruction.description,
      content: content.length ? content : 'no content'
    }
  })
}

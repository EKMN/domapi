const cheerio = require('cheerio')

const trimPretty = (string) => {
  return string.replace(/(\r\n\t|\n|\r\t)/gm, '').trim()
}

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

  try {
    return instructions
      .map((instruction) => {
        let content = []

        const { objective, description } = instruction

        // objective is object
        if (typeof objective === 'object') {
          const { selector, attribute } = objective
          // objective contains several steps
          $(selector).each((i, element) => {
            if (attribute) {
              // objective contains attribute
              content[i] = $(element).attr(attribute)
            } else {
              // return text from selected element
              content[i] = $(element).text()
            }

            // remove whitespaces and newlines from start and end
            content[i] = trimPretty(content[i])
          })
        }

        // objective is string
        if (typeof objective === 'string') {
          $(objective).each((i, element) => {
            content[i] = $(element).text()
            // remove whitespaces and newlines from start and end
            content[i] = trimPretty(content[i])
          })
        }

        // save content as an array, single entry, or 'no content'
        content = content.length >= 2 ? content : content[0] || 'no content'

        return {
          [description]: content
        }
      })
      .reduce((acc, cur) => {
        const key = Object.keys(cur)[0]
        const value = Object.values(cur)[0]

        acc[key] = value

        return acc
      }, {})
  } catch (error) {
    return {
      error: error.message
    }
  }
}

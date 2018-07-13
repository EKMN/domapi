const IMDB = {
  movie_id: {
    selector: 'meta[property="pageId"]',
    attribute: 'content'
  },
  movie_poster: {
    selector: 'meta[property="og:image"]',
    attribute: 'content'
  },
  movie_title: {
    selector: 'meta[property="og:title"]',
    attribute: 'content'
  },
  movie_description: {
    selector: 'meta[name="description"]',
    attribute: 'content'
  },
  movie_year: 'span#titleYear',
  movie_rating: '.ratingValue',
  movie_metacritic: 'div.metacriticScore > span',
  movie_runtime: 'time[itemprop="duration"]',
  movie_categories: 'span[itemprop="genre"]',
  movie_director: 'span[itemprop="director"] .itemprop',
  movie_writers: 'span[itemprop="creator"] .itemprop',
  movie_starring: 'span[itemprop="actors"] .itemprop'
}

module.exports = {
  IMDB
}

// Feature suggestion
// * add support for tests, .e.g. test: { it: 'has length of 5 or more chars', expect: (value) => value.length >= 5 }
// * i.e. the it describes the what, and the expect takes a function that is expected to return true. Otherwise the test will fail.
// * in other words, "scraperDom.js" should check if test exists in an instruction, and if so run the expect-function.
// * If the provided output fails the expect, i.e. expect returns false, then scrapeDom will log an error with the "it" as message

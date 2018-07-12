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
  movie_runtime: 'time[itemprop="duration"]',
  movie_categories: 'span[itemprop="genre"]',
  movie_director: 'span[itemprop="director"] .itemprop',
  movie_writers: 'span[itemprop="creator"] .itemprop',
  movie_starring: 'span[itemprop="actors"] .itemprop'
}

module.exports = {
  IMDB
}

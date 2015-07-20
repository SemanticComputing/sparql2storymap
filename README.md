# sparql2storymap

Create a [StoryMap](https://storymap.knightlab.com/) with SPARQL.

## Usage

See [example.js](https://github.com/SemanticComputing/sparql2storymap/blob/master/example.js) and [map.html](https://github.com/SemanticComputing/sparql2storymap/blob/master/map.html)

The SPARQL query results should include the following variables: `?id ?start_time ?end_time ?description ?lat ?lon ?title`. If `?title` is not included, the value of `?description` is used until the first period.

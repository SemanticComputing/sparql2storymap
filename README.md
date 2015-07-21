# sparql2storymap

Create a [StoryMap](https://storymap.knightlab.com/) with SPARQL.

## Usage

See [example.js](https://github.com/SemanticComputing/sparql2storymap/blob/master/example.js) and [map.html](https://github.com/SemanticComputing/sparql2storymap/blob/master/map.html) for an example.

```
createStoryMap(url, qry, overview_title, overview_text, map_config)
```

`url` is the SPARQL endpoint URL.

`qry` is the SPARQL query. The query results should include the following variables: `?id ?start_time ?end_time ?description ?lat ?lon ?title`. If `?title` is not included, characters until the first period in `?description` will be used for the event title.

`overview_title` is the title for the first (overview) slide.

`overview_text` is the text for the first (overview) slide.

`map_config` is an object with the map configuration. This is optional, and the default is:

```
map_config = {
    width: 800,
    heigth: 600,
    storymap: {
        language: 'fi',
        map_type: "stamen:toner-lite",
        map_as_image: false,
    }
}
```

See [StoryMap technical details](https://storymap.knightlab.com/advanced/) for details on the structure of the configuration.

## Requirements

[StoryMap](https://storymap.knightlab.com/) and [lodash](https://lodash.com/). These are included in the example from CDNs.

## Run the example

You will need to serve the files with a web server (just opening `map.html` from the file system won't work). Then navigate to `map.html`.

A simple web server is included for testing purposes. It requires `node` and packages `connect` and `serve-static`.

Install the dependencies if needed:

```
npm install -g connect serve-static
```

Run the server with `node server.js`

Then navigate to `http://localhost:8080/map.html`

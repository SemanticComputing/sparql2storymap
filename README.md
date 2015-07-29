# sparql2storymap

Create a [StoryMap](https://storymap.knightlab.com/) with SPARQL.

## Usage

See [example.js](https://github.com/SemanticComputing/sparql2storymap/blob/master/example.js) and [map.html](https://github.com/SemanticComputing/sparql2storymap/blob/master/map.html) for an example.

Include the requirements:

```
<link rel="stylesheet" href="https://cdn.knightlab.com/libs/storymapjs/latest/css/storymap.css">
<script type="text/javascript" src="https://cdn.knightlab.com/libs/storymapjs/latest/js/storymap-min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.10.0/lodash.min.js"></script>
```

Also include `sparql2storymap.js`

Put a div with in your html file (do not include any content in the div as it would be removed):

```
<div id="mapdiv" style="width: 100%; height: 600px;"></div> 
```

Note that you need to specify width and height for the div (like above or with CSS).

Then call `insertStoryMap` to create the StoryMap:

```
insertStoryMap('mapdiv', url, qry, overview_title, overview_text, map_config)
```

The first parameter is the id of the container div.

`url` is the SPARQL endpoint URL.

`qry` is the SPARQL query. The query results should include the following variables: 
`?id ?start_time ?end_time ?description ?lat ?lon ?title`. 
`?id` will be used to group events together so that each event appears only once. 
If an event has, e.g., multiple values for `?place_label` only one of them will be shown on the map. 
If `?title` is not included, the title of each slide will be `[?place_label + ' ' + ]?time_start[-?time_end]` (multiple `?place_label`s will be concatenated).

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

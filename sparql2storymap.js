if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function SparqlService(endpointUrl) {

    var executeQuery = function(sparqlQry, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function()
        {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                callback(JSON.parse(xmlhttp.responseText).results.bindings);
            }
        };
        xmlhttp.open("GET", endpointUrl + '?query=' + encodeURIComponent(sparqlQry) + '&format=json', true);
        xmlhttp.send();
    };

    this.getObjects = function(sparqlQry, callback) {
        // Query for triples and call the callback function with the results
        return executeQuery(sparqlQry, callback);
    };
}

function ObjectMapper() { }

ObjectMapper.prototype.makeObject = function(obj) {
    // Flatten the obj. Discard everything except values.
    // Assume that each property of the obj has a value property with
    // the actual value.
    var o = {};

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });

    return o;
};

ObjectMapper.prototype.mergeObjects = function(first, second) {
    // Merge two objects (triples) into one object.
    return _.merge(first, second, function(a, b) {
        if (_.isEqual(a, b)) {
            return a;
        }
        if (_.isArray(a)) {
            return a.concat(b);
        }
        return [a, b];
    });
};

ObjectMapper.prototype.makeObjectList = function(objects, callback) {
    // Create a list of the SPARQL results where triples with the same
    // subject are merged into one object.
    self = this;
    var obj_list = _.transform(objects, function(result, obj) {
        obj = self.makeObject(obj);
        // Check if this object has been constructed earlier
        var old = _.find(result, function(e) {
            return e.id === obj.id;
        });
        if (old) { 
            // Merge this triple into the object constructed earlier
            self.mergeObjects(old, obj);
        }
        else {
            // This is the first triple related to the id
            result.push(obj);
        }                
    });
    return callback(obj_list);
};

function EventMapper() { }

EventMapper.prototype = Object.create(ObjectMapper.prototype);
EventMapper.prototype.makeObject = function(event) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var e = {};

    e.id = event.id.value;
    e.type = event.type.value;
    e.description = event.description.value;
    e.start_time = event.start_time.value;
    e.end_time = event.end_time.value;
    e.place_label = event.place_label.value;

    if (event.polygon) {
        // The event's location is represented as a polygon.
        // Transform the polygon string into a list consisting
        // of a single lat/lon pair object list.
        var l = event.polygon.value.split(" ");
        l = l.map(function(p) { 
            var latlon = p.split(',');
            return { lat: latlon[1], lon: latlon[0] };
        });
        e.polygons = [l];
    }
    if (event.lat && event.lon) {
        // The event's location is represented as a point.
        e.points = [{
            lat: event.lat.value,
                lon: event.lon.value
        }];
    }

    return e;
};

function EventService(url, qry) {
    var endpoint = new SparqlService(url);
    var mapper = new EventMapper();

    var eventFilterWithinTimeSpan =
        'FILTER(?start_time >= "{0}"^^xsd:date && ?end_time <= "{1}"^^xsd:date)';

    var eventsWithinTimeSpanQry = qry.format(eventFilterWithinTimeSpan);

    var allEventsQry = qry.format("");

    this.getEventsByTimeSpan = function(start, end) {
        // Get events that occured between the dates start and end (inclusive).
        // Returns a promise.
        return endpoint.getObjects(eventsWithinTimeSpanQry.format(start, end), 
                mapper.makeObjectList);
    };

    this.getAllEvents = function(callback) {
        // Get all events.
        // Returns a promise.
        return endpoint.getObjects(allEventsQry, function(data) { 
            return mapper.makeObjectList(data, callback);
        });
    };
}


function createStoryMap(url, qry, overview_title, overview_text, map_config) {
    var storyMapCallback = function(data) {
        var res = [
        {
            type: "overview",
                text: 
                {
                    headline: overview_title,
                    text: overview_text
                }
        }
        ];
        data.forEach(function(e) {
            var ev = {};
            if (e.points) {
                ev.location = e.points[0];
            } else {
                ev.type = "overview";
            }

            ev.text = {
                headline: e.description.split('.')[0],
            text: e.description
            };
            res.push(ev);
        });
        var map_data;
        if (map_config) {
            map_data = map_config;
        } else {
            map_data = {
                width: 800,
                heigth: 600,
                storymap: {
                    language: 'fi',
                    map_type: "stamen:toner-lite",
                    map_as_image: false,
                    slides: res
                }
            };
        }
        /* global VCO */
        if (map_data.storymap.language === 'fi') {
            VCO.Language = {
                name:                   "Suomi",
                lang:                   "fi",
                messages: {
                    loading:            "Lataa",
                    wikipedia:          "From Wikipedia, the free encyclopedia",
                    start:              "Aloita"
                },
                buttons: {
                    map_overview:       "Kartan yleisnäkymä",
                    overview:           "Yleisnäkymä",
                    backtostart:        "Alkuun",
                    collapse_toggle:    "Piilota kartta",
                    uncollapse_toggle:  "Näytä kartta"
                }
            };
        }
        var storymap = new VCO.StoryMap('mapdiv', map_data);
        window.onresize = function() {
            storymap.updateDisplay();
        };
    };
    var es = new EventService(url, qry);
    es.getAllEvents(storyMapCallback);
}

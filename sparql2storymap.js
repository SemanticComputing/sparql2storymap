function SparqlService(endpointUrl) {

    var executeQuery = function(sparqlQry, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function()
        {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                return callback(JSON.parse(xmlhttp.responseText).results.bindings);
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
            if (_.isArray(b)) {
                var res = [];
                [a, b].forEach(function(l) {
                    l.forEach(function(val) {
                        var value = _.find(res, val);
                        if (!value) {
                            res.push(val);
                        }
                    });
                });
                return res;
            }
            if (_.find(a, function(val) { return _.isEqual(val, b); })) {
                return a;
            }
            return a.concat(b);
        }
        if (a && !b) {
            return a;
        }
        if (b && !a) {
            return b;
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
    e.type = event.type ? event.type.value : '';
    e.description = event.description.value;
    e.start_time = event.start_time.value;
    e.end_time = event.end_time.value;
    e.place_label = event.place_label ? event.place_label.value : '';
    if (event.title) {
        e.title = event.title.value;
    }

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

    this.getEvents = function(callback) {
        return endpoint.getObjects(qry, function(data) { 
            return mapper.makeObjectList(data, callback);
        });
    };
}

function getExtremeDate(dates, min) {
    if (_.isArray(dates)) {
        var fun;
        if (min) {
            fun = _.min;
        } else {
            fun = _.max;
        }
        return new Date(fun(dates, function(date) {
            return new Date(date);
        }));
    }
    if (!dates) {
        return undefined;
    }
    return new Date(dates);
}

function isFullYear(start, end) {
    return start.getDate() === 1 && start.getMonth() === 0 && end.getDate() === 31 &&
            end.getMonth() === 11;
}

function formatDateRange(start, end) {
    if (isFullYear(start, end)) {
        start_year = start.getFullYear();
        end_year = end.getFullYear();
        return start_year === end_year ? start_year : start_year + '-' + end_year;
    }
    if (end - start) {
        return start.toLocaleDateString() + '-' + end.toLocaleDateString();
    }
    return start.toLocaleDateString();
}


function createTitle(event) {
    var start = getExtremeDate(event.start_time, true);
    var end = getExtremeDate(event.end_time, false);
    var time = formatDateRange(start, end);

    var place;
    if (_.isArray(event.place_label)) {
        place = event.place_label.join(", ");
    } else {
        place = event.place_label;
    }

    return place ? place + ' ' + time : time;
}

function clearElement(id) {
    e = document.getElementById(id);
    while (e.firstChild) { e.removeChild(e.firstChild); }
}

function createStoryMap(container_id, url, qry, overview_title, overview_text, map_config) {
    var storymap;

    var storyMapCallback = function(data) {
        var res = [{
            type: "overview",
            text: {
                headline: overview_title,
                text: overview_text
            }
        }];
        data.forEach(function(e) {
            var ev = {};
            if (e.points) {
                ev.location = e.points[0];
            } else {
                ev.type = "overview";
            }

            ev.text = {
                headline: e.title || createTitle(e),
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
                }
            };
        }
        map_data.storymap.slides = res;
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
            map_data.storymap.language = 'en';
        }
        var storymap = new VCO.StoryMap(container_id, map_data);

        window.onresize = function() {
            storymap.updateDisplay();
        };

        return storymap;
    };
    var es = new EventService(url, qry);
    return es.getEvents(storyMapCallback);
}

function insertStoryMap(container_id, url, qry, overview_title, overview_text, map_config) {
    clearElement(container_id);
    createStoryMap(container_id, url, qry, overview_title, overview_text, map_config);
}

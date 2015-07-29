function init() {
    var url = 'http://ldf.fi/warsa/sparql';

    var eventQry =
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
        ' PREFIX sch: <http://schema.org/>' +

        ' SELECT ?id ?start_time ?end_time ?description ?place_label ?lat ?lon ?polygon ?type' +
        ' WHERE {' +
        '   ?type_id skos:prefLabel ?type .    ' +
        '   FILTER(langMatches(lang(?type), "FI"))' +
        '   ?id a ?type_id ;' +
        '         skos:prefLabel ?description ;' +
        '         crm:P4_has_time-span ?time_id ;' +
        '         crm:P7_took_place_at ?place_id .' +
        '   ?time_id crm:P82a_begin_of_the_begin ?start_time ;' +
        '         crm:P82b_end_of_the_end ?end_time .' +
        '   FILTER(?start_time >= "1939-08-01"^^xsd:date && ?end_time <= "1940-04-30"^^xsd:date)' +
        '   OPTIONAL { ' +
        '         ?place_id geo:lat ?lat ;' +
        '         geo:long ?lon .' +
        '   }' +
        '   OPTIONAL { ?place_id sch:polygon ?polygon . }' +
        '   OPTIONAL { ?place_id skos:prefLabel ?place_label . }' +
        ' }' +
        ' ORDER BY ?start_time ?end_time' +
        ' LIMIT 10';

    insertStoryMap('mapdiv', url, eventQry, "Talvisota", "Suomi taisteli");
}

// map preparation

var mtl_gtfsrt_map = L.map('leaflet-map').setView([45.5576, -73.7242], 11.5);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZmVsaXhpbngiLCJhIjoiY2lqYzJoMW9vMDA1dnZsa3F3cmZzcWVsciJ9.ZWBQm52vI7RFRwGuoAzwMg'
}).addTo(mtl_gtfsrt_map);

var posLayer = L.layerGroup().addTo(mtl_gtfsrt_map);
var transitLayer = L.layerGroup().addTo(mtl_gtfsrt_map);

// when page is loaded

$(function () {
    console.log('Loading MTL-TRANSIT-TRACKER version 1.2.5...');

    loadTransit("stm1" , "#00a54f");
    loadTransit("stm2" , "#f58220");
    loadTransit("stm4" , "#ffdc01");
    loadTransit("stm5" , "#0072bc");
    loadTransit("exo1" , "#f76179");
    loadTransit("exo2" , "#a4cb92");
    loadTransit("exo3" , "#989ec3");
    loadTransit("exo4" , "#4fb7b4");
    loadTransit("exo5" , "#cf5a94");
    loadTransit("exo6" , "#f2a69a");

    loadTrips();

    loadData(dataUrl);

    loadRandomImage(images);

    mtl_gtfsrt_map.on('locationfound', onLocationFound);
    mtl_gtfsrt_map.locate({setView: true, maxZoom: 14});

    // when the page has finish loading, show the map
    $('.loading').css('display', 'none');
    $('#leaflet-map').css('opacity', '1');

    function showOnMap(lat, lon) {
        mtl_gtfsrt_map.setView([lat, lon], 18);
        $('#mainTab li:first-child a').tab('show');
    }

    function showTimestamp(agency_name, timestamp) {
        var date = new Date(null);
        date.setSeconds(timestamp);
        // fix for summer tim
        date.setHours(date.getHours()+1);
        var timeString = date.toLocaleTimeString();
        $('.ul-timestamp').append('<li>' + agency_name + ' - ' + timeString + '</li>');
    }

    function loadData(data_source){
        var loadDataRequest = $.get(data_source);

        // proceed if the request is success
        loadDataRequest.done(function (data) {
            // display vehicles on the map
            data.results.forEach(function (element) {
                var trip_info = $.grep(exoTrips, function(obj){return obj.trip_id === element.trip_id}, false)[0];
                L.marker(L.latLng(element.lat, element.lon), {
                    icon: icons[element.icon]
                }).addTo(posLayer)
                    .bindPopup(popupContent(element, trip_info));
            });
            // load vehicles in the table
            loadTable(data);

            showTimestamp("STM Bus", data.time_stm);
            showTimestamp("exo Trains", data.time_exo);
        });

        // stop if the request failed
        loadDataRequest.fail(function (jqXHR, textStatus) {
            $('#offlineModal').modal();
        });
    }

    function loadTransit(file, line_color) {
        $.get("geojson/" + file + ".geojson", function (data) {
            L.geoJSON(data, {
                style: function () {
                    return {
                        color: line_color
                    }
                }
            }).addTo(transitLayer);
        });
    }

    function loadRandomImage(imagesArray) {
        var randomIndex = Math.floor(Math.random() * imagesArray.length);
        var cssURL = 'url(';
        cssURL += imagesArray[randomIndex].url;
        cssURL += ') center center no-repeat';
        $('.main-bg').css('background', cssURL);
        $('.main-bg').css('background-size', 'cover');
        $(imagesArray[randomIndex].credit).appendTo(".credits");
    }

    function loadTable(requestedData) {
        var mapIcon = function() {
            return '<i class="fas fa-map-marked-alt"></i>'
        }
        var tableData = requestedData.results;
        var dataTabulator = new Tabulator('#new-data-table', {
            height: 5030,
            data: tableData,
            layout: 'fitColumns',
            columns: [
                {title: 'Agency', field: 'agency', width: 60},
                {title: 'Vehicle number', field: 'vehicle_id', headerFilter: 'input', width: 100},
                {title: 'Route', field: 'route_id', headerFilter: 'input', width: 60},
                {title: 'Trip', field: 'trip_id', headerFilter: 'input', width: 110},
                {title: 'Start time', field: 'start_time', width: 85},
                {title: 'Start date', field: 'start_date', width: 95},
                {title: 'Current stop sequence', field: 'current_stop_sequence', width: 45, widthGrow: 2},
                {title: 'Current status', field: 'current_status', width: 140, widthGrow: 2},
                {title: 'Latitude', field: 'lat', width: 90},
                {title: 'Longitude', field: 'lon', width: 100},
                {formatter: mapIcon, width: 50, widthGrow: 1, align: 'center', cellClick: function (e, cell) {
                    showOnMap(cell.getRow().getData().lat, cell.getRow().getData().lon)
                }}
            ],
            pagination: 'local',
            paginationSize: 100,
            groupBy: 'agency'
        });

        // download buttons
        $('#download-csv').click(function () {
            dataTabulator.download('csv', 'data.csv');
            ga('send', 'event', 'DownloadButtons', 'DownloadCSV');
        });
    }

    function loadTrips() {
        exoTrips = {};
        $.getJSON(exoTripsUrl, function (data) {
            exoTrips = data;
        });
    }

    function popupContent(vehicle_info, trip_info) {
        var content = "<h3>";
        content += vehicle_info.agency + " ";
        content += vehicle_info.vehicle_id + "</h3>";
        content += "<b>Trip: </b>" + vehicle_info.trip_id + "<br>";
        content += "<b>Route: </b>" + vehicle_info.route_id + "<br>";
        if (trip_info != null) {
            content += "<b>Headsign: </b>" + trip_info.trip_headsign + "<br>";
            content += "<b>Train number: </b>" + trip_info.trip_short_name + "<br>";
        }
        if (vehicle_info.start_date != null) {
            content += "<b>Start: </b>" + vehicle_info.start_date + " " + vehicle_info.start_time + "<br>";
            content += "<b>Current stop sequence: </b>" + vehicle_info.current_stop_sequence + "<br>";
            content += "<b>Status: </b>" + vehicle_info.current_status;
        }

        return content;
    }

    function onLocationFound(e) {
        L.marker(e.latlng).addTo(mtl_gtfsrt_map)
            .bindPopup('You are near here!').openPopup();
    }
});

// service worker

if ('serviceWorker' in navigator) {
    // delete all cache first
}

// global variables

var icons = {
    "busSTMIcon": L.icon({
        iconUrl: 'assets/map-bus-stm.svg',
        iconSize: [20, 20]
    }),
    "trainExoIcon": L.icon({
        iconUrl: ' assets/map-train-exo.svg',
        iconSize: [20, 20]
    })
};
var timestampString = + new Date();
var dataUrl = 'https://mtl-gtfs-rt-backend.azurewebsites.net/data/latest.json?time=' + timestampString;

var images = [
    {
        url: "assets/images/wikimedia-30871-min.jpg",
        credit: "<p>Image from Wikimedia Commons by Alexcaban</p>",
    },
    {
        url: "assets/images/wikimedia-amt1356-min.jpg",
        credit: "<p>Image from Wikimedia Commons by Mtlfiredude</p>",
    }
];

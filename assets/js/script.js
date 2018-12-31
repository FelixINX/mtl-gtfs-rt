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
    console.log('Loading MTL-TRANSIT-TRACKER version 1.2.1...');

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
            height: 1074,
            data: tableData,
            layout: 'fitColumns',
            columns: [
                {title: 'Agency', field: 'agency'},
                {title: 'Vehicle number', field: 'vehicle_id', headerFilter: 'input'},
                {title: 'Route', field: 'route_id', headerFilter: 'input'},
                {title: 'Trip', field: 'trip_id', headerFilter: 'input'},
                {title: 'Start time', field: 'start_time'},
                {title: 'Start date', field: 'start_date'},
                {title: 'Current stop sequence', field: 'current_stop_sequence'},
                {title: 'Current status', field: 'current_status'},
                {title: 'Latitude', field: 'lat'},
                {title: 'Longitude', field: 'lon'},
                {formatter: mapIcon, width: 50, align: 'center', cellClick: function (e, cell) {
                    showOnMap(cell.getRow().getData().lat, cell.getRow().getData().lon)
                }}
            ],
            pagination: 'local',
            paginationSize: 20,
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
        var exoTripsUrl = 'http://mtl-gtfs-rt/data/trips/exo-trains.json';
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
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').then(function (registration) {
            console.log('[SW] Registration successful with scope: ', registration.scope);
        }, function (err) {
            console.log('[SW] Registration failed: ', err);
        });
    });
}

// global variables

var icons = {
    "busSTMIcon": L.icon({
        iconUrl: 'assets/map-bus-stm.svg',
        // iconUrl: 'https://felixinx.github.io/mtl-gtfs-rt/assets/map-bus-stm.svg',
        iconSize: [20, 20]
    }),
    "trainExoIcon": L.icon({
        iconUrl: ' assets/map-train-exo.svg',
        // iconUrl: 'https://felixinx.github.io/mtl-gtfs-rt/assets/map-train-exo.svg',
        iconSize: [20, 20]
    })
};

var dataUrl = 'https://mtl-gtfs-rt-backend.azurewebsites.net/data/latest.json';

var images = [
    {
        url: "assets/images/joy-real-535919-unsplash-min.jpg",
        // url: "https://felixinx.github.io/mtl-gtfs-rt/assets/images/joy-real-535919-unsplash-min.jpg",
        credit: "<a style=\"background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px\" href=\"https://unsplash.com/@joyreal328?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Download free do whatever you want high-resolution photos from Joy Real\"><span style=\"display:inline-block;padding:2px 3px\"><svg xmlns=\"http://www.w3.org/2000/svg\" style=\"height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white\" viewBox=\"0 0 32 32\"><title>unsplash-logo</title><path d=\"M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z\"></path></svg></span><span style=\"display:inline-block;padding:2px 3px\">Joy Real</span></a>",
    },
    {
        url: "assets/images/joy-real-587637-unsplash-min.jpg",
        // url: "https://felixinx.github.io/mtl-gtfs-rt/assets/images/joy-real-587637-unsplash-min.jpg",
        credit: "<a style=\"background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px\" href=\"https://unsplash.com/@joyreal328?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Download free do whatever you want high-resolution photos from Joy Real\"><span style=\"display:inline-block;padding:2px 3px\"><svg xmlns=\"http://www.w3.org/2000/svg\" style=\"height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white\" viewBox=\"0 0 32 32\"><title>unsplash-logo</title><path d=\"M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z\"></path></svg></span><span style=\"display:inline-block;padding:2px 3px\">Joy Real</span></a>",
    },
    {
        url: "assets/images/nicolae-rosu-555257-unsplash-min.jpg",
        // url: "https://felixinx.github.io/mtl-gtfs-rt/assets/images/nicolae-rosu-555257-unsplash-min.jpg",
        credit: "<a style=\"background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px\" href=\"https://unsplash.com/@nicolaerosu?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Download free do whatever you want high-resolution photos from Nicolae Rosu\"><span style=\"display:inline-block;padding:2px 3px\"><svg xmlns=\"http://www.w3.org/2000/svg\" style=\"height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white\" viewBox=\"0 0 32 32\"><title>unsplash-logo</title><path d=\"M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z\"></path></svg></span><span style=\"display:inline-block;padding:2px 3px\">Nicolae Rosu</span></a>",
    }
];

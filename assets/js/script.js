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

    loadData(dataUrl);

    loadRandomImage(images);

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
        $.get(data_source, function (data, pos_status) {
            // display vehicles on the map
            data.results.forEach(function (element) {
                L.marker(L.latLng(element.lat, element.lon), {
                    icon: icons[element.icon]
                }).addTo(posLayer)
                    .bindPopup("<h3>" + element.agency + " " + element.vehicle_id + "</h3><b>Trip: </b> " + element.trip_id + "<br><b>Route: </b>" + element.route_id + "<br><b>Start: </b>" + element.start_date + " " + element.start_time + "<br><b>Current stop sequence: </b>" + element.current_stop_sequence + "<br><b>Status: </b>" + element.current_status);
            });
            // load vehicles in the table
            loadTable(data);
            var dataTable = $('#data-table').DataTable({
                data: data.results,
                columns: [
                    { data: 'agency' },
                    { data: 'vehicle_id' },
                    { data: 'route_id' },
                    { data: 'trip_id' },
                    { data: 'start_date', defaultContent: 'N/A' },
                    { data: 'start_time', defaultContent: 'N/A' },
                    { data: 'current_stop_sequence', defaultContent: 'N/A' },
                    { data: 'current_status', searchable: false, defaultContent: 'N/A' },
                    { data: 'lat' },
                    { data: 'lon' },
                    { data: null, defaultContent: '<button class="btn btn-primary btn-sm">Show on map</button>', orderable: false, searchable: false }
                ],
                dom: 'BSlftipr',
                buttons: [
                    'csv', 'excel'
                ],
                "columnDefs": [ {
                    "targets": -1,
                    "data": null,
                    "defaultContent": "<button>Click!</button>"
                } ]
            });

            showTimestamp("STM Bus", data.time_stm);
            showTimestamp("exo Trains", data.time_exo)

            $('#data-table tbody').on('click', 'button', function () {
                var data = dataTable.row($(this).parents('tr')).data();
                showOnMap(data["lat"],data["lon"]);
            });
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
        var tableData = requestedData.results;
        var dataTable = new Tabulator('#new-data-table', {
            data: tableData,
            layout: 'fitColumns',
            columns: [
                {title: 'Vehicle number', field: 'vehicle_id'},
                {title: 'Route', field: 'route_id'},
                {title: 'Trip', field: 'trip_id'},
                {title: 'Start time', field: 'start_time'},
                {title: 'Start date', field: 'start_date'},
                {title: 'Current stop sequence', field: 'current_stop_sequence'},
                {title: 'Current status', field: 'current_status'},
                {title: 'Latitude', field: 'lat'},
                {title: 'Longitude', field: 'lon'}
            ],
            pagination: 'local',
            paginationSize: 20,
            groupBy: 'agency'
        });
    }
});

// global variables

var icons = {
    "busSTMIcon": L.icon({
        iconUrl: 'https://felixinx.github.io/mtl-gtfs-rt/assets/map-bus-stm.svg',
        iconSize: [20, 20]
    }),
    "trainExoIcon": L.icon({
        iconUrl: 'https://felixinx.github.io/mtl-gtfs-rt/assets/map-train-exo.svg',
        iconSize: [20, 20]
    })
};

var dataUrl = 'https://mtl-gtfs-rt-backend.azurewebsites.net/data/latest.json';

var images = [
    {
        url: "https://felixinx.github.io/mtl-gtfs-rt/assets/images/joy-real-535919-unsplash-min.jpg",
        credit: "<a style=\"background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px\" href=\"https://unsplash.com/@joyreal328?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Download free do whatever you want high-resolution photos from Joy Real\"><span style=\"display:inline-block;padding:2px 3px\"><svg xmlns=\"http://www.w3.org/2000/svg\" style=\"height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white\" viewBox=\"0 0 32 32\"><title>unsplash-logo</title><path d=\"M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z\"></path></svg></span><span style=\"display:inline-block;padding:2px 3px\">Joy Real</span></a>",
    },
    {
        url: "https://felixinx.github.io/mtl-gtfs-rt/assets/images/joy-real-587637-unsplash-min.jpg",
        credit: "<a style=\"background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px\" href=\"https://unsplash.com/@joyreal328?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Download free do whatever you want high-resolution photos from Joy Real\"><span style=\"display:inline-block;padding:2px 3px\"><svg xmlns=\"http://www.w3.org/2000/svg\" style=\"height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white\" viewBox=\"0 0 32 32\"><title>unsplash-logo</title><path d=\"M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z\"></path></svg></span><span style=\"display:inline-block;padding:2px 3px\">Joy Real</span></a>",
    },
    {
        url: "https://felixinx.github.io/mtl-gtfs-rt/assets/images/nicolae-rosu-555257-unsplash-min.jpg",
        credit: "<a style=\"background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px\" href=\"https://unsplash.com/@nicolaerosu?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Download free do whatever you want high-resolution photos from Nicolae Rosu\"><span style=\"display:inline-block;padding:2px 3px\"><svg xmlns=\"http://www.w3.org/2000/svg\" style=\"height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white\" viewBox=\"0 0 32 32\"><title>unsplash-logo</title><path d=\"M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z\"></path></svg></span><span style=\"display:inline-block;padding:2px 3px\">Nicolae Rosu</span></a>",
    }
];

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
            // load vehicles in the list
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
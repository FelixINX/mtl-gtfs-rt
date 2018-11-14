// préparation de la page

var dataUrl = 'https://mtl-gtfs-rt-backend.azurewebsites.net/data/latest.json';

// préparation de la carte

var mtl_gtfsrt_map = L.map('map').setView([45.5576, -73.7242], 11.5);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox.streets',
  accessToken: 'pk.eyJ1IjoiZmVsaXhpbngiLCJhIjoiY2lqYzJoMW9vMDA1dnZsa3F3cmZzcWVsciJ9.ZWBQm52vI7RFRwGuoAzwMg'
}).addTo(mtl_gtfsrt_map);

var posLayer = L.layerGroup().addTo(mtl_gtfsrt_map);
var lineLayer = L.layerGroup().addTo(mtl_gtfsrt_map);
var transitLayer = L.layerGroup().addTo(mtl_gtfsrt_map);

// lorsque la page est prête

$(document).ready(function() {
  // ajoute les lignes de métro et train
  $.get("geojson/stm1.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#00a54f'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/stm2.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#f58220'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/stm4.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#ffdc01'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/stm5.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#0072bc'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/exo1.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#f76179'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/exo2.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#a4cb92'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/exo3.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#989ec3'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/exo4.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#4fb7b4'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/exo5.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#cf5a94'
        };
      }
    }).addTo(transitLayer);
  });
  $.get("geojson/exo6.geojson", function(data) {
    L.geoJSON(data, {
      style: function(feature) {
        return {
          color: '#f2a69a'
        };
      }
    }).addTo(transitLayer);
  });
  // Chercher et affihcer la position des transports
  $.get(dataUrl, function(data, pos_status) {
    console.log("pos call result: " + pos_status);
    // affiche les données sur la carte
    data.results.forEach(function(element) {
      L.marker(L.latLng(element.lat, element.lon), {
          icon: icons[element.icon]
        }).addTo(posLayer)
        .bindPopup("<h3>" + element.agency + " " + element.vehicle_id + "</h3><b>Trip: </b> " + element.trip_id + "<br><b>Route: </b>" + element.route_id + "<br><b>Start: </b>" + element.start_date + element.start_time + "<br><b>Current stop sequence: </b>" + element.current_stop_sequence + "<br><b>Status: </b>" + element.current_status);
    });
    // affiche les données dans la liste
    $('#data-table').DataTable({
      data: data.results,
      columns: [{
          data: 'agency'
        },
        {
          data: 'vehicle_id'
        },
        {
          data: 'route_id'
        },
        {
          data: 'trip_id'
        },
        {
          data: 'start_date'
        },
        {
          data: 'start_time'
        },
        {
          data: 'current_stop_sequence'
        },
        {
          data: 'current_status'
        },
        {
          data: 'lat'
        },
        {
          data: 'lon'
        }
      ],
      dom: 'BSlftipr',
      buttons: [
        'csv', 'excel'
      ]
    });
    // convert STM timestamp to readable data
    var stm_timestamp = data.time_stm;
    var stm_date = new Date(stm_timestamp * 1000);
    var stm_hours = stm_date.getHours();
    var stm_minutes = "0" + stm_date.getMinutes();
    var stm_seconds = "0" + stm_date.getSeconds();
    var stm_formattedTime = stm_hours + ':' + stm_minutes.substr(-2) + ':' + stm_seconds.substr(-2);
    $("#data-timestamp").append("STM:" + stm_formattedTime);

    // convert STM timestamp to readable data
    var exo_timestamp = data.time_exo;
    var exo_date = new Date(exo_timestamp * 1000);
    var exo_hours = exo_date.getHours();
    var exo_minutes = "0" + exo_date.getMinutes();
    var exo_seconds = "0" + exo_date.getSeconds();
    var exo_formattedTime = exo_hours + ':' + exo_minutes.substr(-2) + ':' + exo_seconds.substr(-2);
    $("#data-timestamp").append(" and exo:" + exo_formattedTime);
  });
  $(".btn-tab-map").css("background-color", "white");
  $(".btn-tab-list").click(function() {
    $(".btn-tab-map").css("background-color", "#E2E2E2");
    $(".btn-tab-help").css("background-color", "#E2E2E2");
    $(".btn-tab-info").css("background-color", "#E2E2E2");
    $(".btn-tab-list").css("background-color", "white");
    $(".tab-map").css("display", "none");
    $(".tab-help").css("display", "none");
    $(".tab-info").css("display", "none");
    $("#data-timestamp").css("display", "unset");
    $(".tab-list").css("display", "unset");
  });
  $(".btn-tab-map").click(function() {
    $(".btn-tab-list").css("background-color", "#E2E2E2");
    $(".btn-tab-help").css("background-color", "#E2E2E2");
    $(".btn-tab-info").css("background-color", "#E2E2E2");
    $(".btn-tab-map").css("background-color", "white");
    $(".tab-list").css("display", "none");
    $(".tab-help").css("display", "none");
    $(".tab-info").css("display", "none");
    $("#data-timestamp").css("display", "unset");
    $(".tab-map").css("display", "unset");
  });
  $(".btn-tab-help").click(function() {
    $(".btn-tab-map").css("background-color", "#E2E2E2");
    $(".btn-tab-list").css("background-color", "#E2E2E2");
    $(".btn-tab-info").css("background-color", "#E2E2E2");
    $(".btn-tab-help").css("background-color", "white");
    $(".tab-map").css("display", "none");
    $(".tab-list").css("display", "none");
    $(".tab-info").css("display", "none");
    $("#data-timestamp").css("display", "none");
    $(".tab-help").css("display", "unset");
  });
  $(".btn-tab-info").click(function() {
    $(".btn-tab-map").css("background-color", "#E2E2E2");
    $(".btn-tab-help").css("background-color", "#E2E2E2");
    $(".btn-tab-list").css("background-color", "#E2E2E2");
    $(".btn-tab-info").css("background-color", "white");
    $(".tab-map").css("display", "none");
    $(".tab-help").css("display", "none");
    $(".tab-list").css("display", "none");
    $("#data-timestamp").css("display", "none");
    $(".tab-info").css("display", "unset");
  });
});

//icones

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

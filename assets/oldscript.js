// GET request
$("#lineChooser").submit(function(event) {
  var lineId = $("#inputLine").val();
  var lineDir = $("#inputDir").val();
  console.log(lineId + " " + lineDir);
  var stops_url = baseUrl + "lines/" + lineId + "/stops?direction=" + lineDir + "&withconnection=0";
  var geo_url = baseUrl + "lines/" + lineId + "/routes/default?direction=" + lineDir;
  var pos_url = baseUrl + "lines/" + lineId + "/positions/?direction=" + lineDir + "&weelchair=0";
  lineLayer.clearLayers();
  posLayer.clearLayers();
  // ARRÊTS DE LA LIGNE
  $.get(stops_url, function(data, stop_status) {
    console.log("stops call result: " + stop_status);
    console.log("api stops status: " + data.status.level);
    // vérifie si le status n'est pas ok
    if (data.status.level != "OK") {
      var snack_options = {
        content: "There was an error with your request. Please check your line number and direction.",
        timeout: 1000
      }
      $.snackbar(snack_options);
      console.log(data.status);
    }
    //let stops = JSON.parse(data);
    data.result.forEach(function(element) {
      L.marker(L.latLng(element.lat, element.lon), {
        icon: stopIcon
      }).addTo(lineLayer).bindPopup("<b>" + element.identifier + "</b> " + element.description);
    });
  });
  // GÉOGRAPHIE DES LIGNES
  $.get(geo_url, function(data, geo_status) {
    console.log("geo call result: " + geo_status);
    //let geo = JSON.parse(data);
    let line_latlngs = data.Geometry;
    let line_polyline = L.polyline(line_latlngs, {
      color: '#009fdb'
    }).addTo(lineLayer);
    ibus_map.fitBounds(line_polyline.getBounds());
  });
  // POSITIONS DES BUS
  $.get(pos_url, function(data, pos_status) {
    console.log("pos call result: " + pos_status);
    console.log("api pos status: " + data.status.level);
    //let pos = JSON.parse(data);
    let line_id = data.line.public_identifier;
    let line_desc = data.line.description;
    let line_dir = data.line.direction_name;
    let line = line_id + " " + line_desc + " " + line_dir;

    data.result.forEach(function(element) {
      L.marker(L.latLng(element.vehicle_lat, element.vehicle_lon), {
          icon: busIcon
        }).addTo(posLayer)
        .bindPopup("<h3>" + line + " - " + element.journeyRef + "</h3><b>Next stop: </b> " + element.next_stop + " " + element.stop_name + "<br><b>Vehicle number: </b>" + element.vehicle_ref);
    });
  });
});

$("#refresh_btn").click(function() {
  var lineId = $("#inputLine").val();
  var lineDir = $("#inputDir").val();
  posLayer.clearLayers();
  var pos_url = baseUrl + "lines/" + lineId + "/positions/?direction=" + lineDir + "&weelchair=0";
  $.get(pos_url, function(data, pos_status) {
    console.log("pos sult: " + pos_status);
    //let pos = JSON.parse(data);
    let line_id = data.line.public_identifier;
    let line_desc = data.line.description;
    let line_dir = data.line.direction_name;
    let line = line_id + " " + line_desc + " " + line_dir;

    data.result.forEach(function(element) {
      L.marker(L.latLng(element.vehicle_lat, element.vehicle_lon), {
          icon: busIcon
        }).addTo(posLayer)
        .bindPopup("<h3>" + line + " - " + element.journeyRef + "</h3><b>Next stop: </b> " + element.next_stop + " " + element.stop_name + "<br><b>Vehicle number: </b>" + element.vehicle_ref);
    });
  });
});

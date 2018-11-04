<?php

require_once 'vendor/autoload.php';

use transit_realtime\FeedMessage;

// set headers for STM GTFS realtime request
$exo_feed_url = "http://opendata.rtm.quebec:2539/ServiceGTFSR/VehiclePosition.pb?token=" . getenv('EXO_APIKEY');
$stm_feed_url = "https://api.stm.info/pub/od/gtfs-rt/ic/v1/vehiclePositions";
$stm_apikey_header = "apikey: " . getenv('STM_APIKEY');
$stm_opts = [
  "http" => [
    "method" => "POST",
    "header" => $stm_apikey_header
  ]
];
$stm_context = stream_context_create($stm_opts);

$exo_data = file_get_contents($exo_feed_url);
$stm_data = file_get_contents($stm_feed_url, false, $stm_context);
$exo_feed = new FeedMessage();
$stm_feed = new FeedMessage();
$exo_feed->parse($exo_data);
$stm_feed->parse($stm_data);

$data = array(
  "time_exo" => $exo_feed->header->getTimestamp(),
  "time_stm" => $stm_feed->header->getTimestamp(),
  "results" => array()
);

// add exo data to array
/*foreach ($exo_feed->getEntityList() as $entity) {
    $vehicle = $entity->getId();
    $trip = $entity->vehicle->trip->getTripId();
    $route = $entity->vehicle->trip->getRouteId();
    $lat = round($entity->vehicle->position->getLatitude(), 5);
    $lon = round($entity->vehicle->position->getLongitude(), 5);
    $data['results'][] = array(
    'agency' => 'exo',
    'icon' => 'trainExoIcon',
    'vehicle_id' => $vehicle,
    'route_id' => $route,
    'trip_id' => $trip,
    'start_time' => null,
    'start_date' => null,
    'current_stop_sequence' => null,
    'current_status' => null,
    'lat' => $lat,
    'lon' => $lon
  );
}*/

// add STM data to array
foreach ($stm_feed->getEntityList() as $entity) {
    $vehicle = $entity->getId();
    $route = $entity->vehicle->trip->getRouteId();
    $trip = $entity->vehicle->trip->getTripId();
    $start_time = $entity->vehicle->trip->getStartTime();
    $start_date = $entity->vehicle->trip->getStartDate();
    $current_stop_sequence = $entity->vehicle->getCurrentStopSequence();
    $current_status = $entity->vehicle->getCurrentStatus();
    $lat = round($entity->vehicle->position->getLatitude(), 5);
    $lon = round($entity->vehicle->position->getLongitude(), 5);
    $data['results'][] = array(
    'agency' => 'STM',
    'icon' => 'busSTMIcon',
    'vehicle_id' => $vehicle,
    'route_id' => $route,
    'trip_id' => $trip,
    'start_time' => $start_time,
    'start_date' => $start_date,
    'current_stop_sequence' => $current_stop_sequence,
    'current_status' => $current_status,
    'lat' => $lat,
    'lon' => $lon
  );
}

$json = json_encode($data);
echo $json;
echo file_put_contents("data/latest.json", $json);

echo "gtfs realtime success!";

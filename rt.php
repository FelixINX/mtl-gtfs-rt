<?php

require_once 'vendor/autoload.php';

use transit_realtime\FeedMessage;

// check request key header
$app_apikey_header = $_SERVER['HTTP_X_API_KEY'];
$app_apikey = getenv('APP_APIKEY');

if ($app_apikey_header == $app_apikey) {
  echo "Valid api key\n";
} else {
  exit("Invalid request key");
}

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

$timestamp_exo = (string)$exo_feed->header->getTimestamp();
$timestamp_stm = (string)$stm_feed->header->getTimestamp();

$data = array(
  "time_exo" => $timestamp_exo,
  "time_stm" => $timestamp_stm,
  "results" => array()
);

// download raw data
file_put_contents("data/raw/vehiclePosition.pb", $stm_data);

// add exo data to array
foreach ($exo_feed->getEntityList() as $entity) {
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
}

// add STM data to array
foreach ($stm_feed->getEntityList() as $entity) {
    $vehicle = $entity->getId();
    $route = $entity->vehicle->trip->getRouteId();
    $trip = $entity->vehicle->trip->getTripId();
    $start_time = $entity->vehicle->trip->getStartTime();
    $start_date = $entity->vehicle->trip->getStartDate();
    $current_stop_sequence = $entity->vehicle->getCurrentStopSequence();
    $current_status_number = $entity->vehicle->getCurrentStatus();
    if ($current_status_number == 1) {
      $current_status = "STOPPED_AT";
    } elseif ($current_status_number == 2) {
      $current_status = "IN_TRANSIT_TO";
    }
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

$csv_handle = fopen("data/count.csv", "a");
$exo_count = (string)count($exo_feed->getEntityList());
$stm_count = (string)count($stm_feed->getEntityList());
$csv_array = array($timestamp_exo, $timestamp_stm, $exo_count, $stm_count);
fputcsv($csv_handle, $csv_array);
fclose($csv_handle);

$json = json_encode($data);
file_put_contents("data/latest.json", $json);

echo "\nsuccess!";

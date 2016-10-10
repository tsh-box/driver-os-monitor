var Promise = require('promise');
var request = require('request');
var monitor = require("os-monitor");
var databox_directory = require("./utils/databox_directory.js");


//
//Capture std out for later use in the /debug endpoint 
//
var express = require('express');
var json2html = require('node-json2html');
var interceptOutput = require("intercept-stdout");
var log = [{"msg":"hello"},{"msg":"world"}];
var unhook_intercept = interceptOutput(function(txt) {
    log.push({msg:txt});
    if(log.length > 100) {
        log.shift();
    }
    return txt;
});
var app = express();
app.get("/debug", function(req, res, next) {
    res.send(JSON.stringify(log));
});
app.get("/stids", function(req, res, next) {
    res.send(JSON.stringify(SENSOR_TYPE_IDs));
});
app.get("/sids", function(req, res, next) {
    res.send(JSON.stringify(SENSOR_IDs));
});
app.listen(8080, function () {
  console.log('Example app listening on port 8080');
});


var DATASTORE_TIMESERIES_ENDPOINT = process.env.DATASTORE_TIMESERIES_ENDPOINT;


var sensors = ['loadavg1','loadavg5','loadavg15','freemem'];
var SENSOR_TYPE_IDs = [];
var SENSOR_IDs = {};

var VENDOR_ID = null;
var DRIVER_ID = null;
var DATASTORE_ID = null;


databox_directory.register('databox','databox-os-monitor-driver','Cool OS monitoring driver')
  .then((ids) => {
    console.log(ids);
    VENDOR_ID = ids['vendor_id'];
    DRIVER_ID = ids['driver_id'];
    return databox_directory.get_datastore_id('datastore-timeseries');
  })
  .then ((datastore_id) => {
    DATASTORE_ID = datastore_id;
    console.log("DATASTORE_ID", DATASTORE_ID);
    proms = [
      databox_directory.register_sensor_type('loadavg1'),
      databox_directory.register_sensor_type('loadavg5'),
      databox_directory.register_sensor_type('loadavg15'),
      databox_directory.register_sensor_type('freemem')
    ]
    return Promise.all(proms);
  })
  .then ((sensorTypeIds) => {
    console.log('sensorTypeIds::', sensorTypeIds);
    SENSOR_TYPE_IDs = sensorTypeIds;
    proms = [
      databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[0].id, DATASTORE_ID, VENDOR_ID, 'loadavg1', 'percent', '', 'System load over 1 minuet', 'In the databox'),
      databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[1].id, DATASTORE_ID, VENDOR_ID, 'loadavg5', 'percent', '', 'System load over 5 minuet', 'In the databox'),
      databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[2].id, DATASTORE_ID, VENDOR_ID, 'loadavg15', 'percent', '', 'System load over 15 minuet', 'In the databox'),
      databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[3].id, DATASTORE_ID, VENDOR_ID, 'freemem', 'bytes', 'b', 'Free memory', 'In the databox'),
    ]
    return Promise.all(proms);
  })
  .then((sensorIds) => {
    console.log("sensorIds::", sensorIds); 
    for(var i = 0; i < SENSOR_TYPE_IDs.length; i++) {
      SENSOR_IDs[sensors[i]] = sensorIds[i].id;
    }

    console.log("SENSOR_IDs", SENSOR_IDs);

    function saveReading(name,reading) {
      var options = {
          uri: DATASTORE_TIMESERIES_ENDPOINT + '/reading',
          method: 'POST',
          json: 
          {
            sensor_id: SENSOR_IDs[name], 
            vendor_id: VENDOR_ID, 
            value: reading   
          }
      };
      request.post(options, (error, response, body) => {console.log(error, body)});
    }


    monitor.start({ delay: 5000 });

    // define handler that will always fire every cycle
    monitor.on('monitor', function(event) {
      
      var loadavg1 = event['loadavg'][0];
      var loadavg5 = event['loadavg'][1];
      var loadavg15 = event['loadavg'][2];
      var freemem = event[freemem];
      console.log(loadavg1);

      saveReading('loadavg1', event['loadavg'][0]);
      saveReading('loadavg5', event['loadavg'][1]);
      saveReading('loadavg15', event['loadavg'][2]);
      saveReading('freemem', event['freemem']);

    });
  })
  .catch((err) => {
    console.log(err);
  })








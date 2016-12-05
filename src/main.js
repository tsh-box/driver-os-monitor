var Promise = require('promise');
var databoxRequest = require('./lib/databox-request.js');
var databoxDatasourceHelper = require('./lib/databox-datasource-helper.js');

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


var DATASTORE_TIMESERIES_ENDPOINT = process.env.DATABOX_OS_MONITOR_DRIVER_DATASTORE_TIMESERIES_ENDPOINT;


var vendor = "databox";

databoxDatasourceHelper.waitForDatastore(DATASTORE_TIMESERIES_ENDPOINT)
  .then(() =>{
    proms = [
      databoxDatasourceHelper.registerDatasource(DATASTORE_TIMESERIES_ENDPOINT, vendor, 'loadavg1', 'loadavg1', 'percent', '', 'System load over 1 minuet', 'In the databox'),
      databoxDatasourceHelper.registerDatasource(DATASTORE_TIMESERIES_ENDPOINT, vendor, 'loadavg5', 'loadavg5', 'percent', '', 'System load over 5 minuet', 'In the databox'),
      databoxDatasourceHelper.registerDatasource(DATASTORE_TIMESERIES_ENDPOINT, vendor, 'loadavg15', 'loadavg15', 'percent', '', 'System load over 15 minuet', 'In the databox'),
      databoxDatasourceHelper.registerDatasource(DATASTORE_TIMESERIES_ENDPOINT, vendor, 'freemem', 'freemem', 'bytes', 'b', 'Free memory', 'In the databox'),
    ]
    return Promise.all(proms);
  })
  .then(() => {

      function saveReading(name,reading) {
        var options = {
            uri: DATASTORE_TIMESERIES_ENDPOINT + '/reading',
            method: 'POST',
            json: 
            {
              sensor_id: name, 
              vendor_id: vendor, 
              value: reading   
            }
        };
        databoxRequest(options, (error, response, body) => {console.log(error, body)});
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
  });

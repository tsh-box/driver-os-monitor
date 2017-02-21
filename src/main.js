/*jshint esversion: 6 */
var https = require('https');
var express = require("express");
var bodyParser = require("body-parser");

var monitor = require("os-monitor");

var databoxRequest = require('./lib/databox-request-promise.js');
var databoxDatasourceHelper = require('./lib/databox-datasource-helper.js');

//
// Get the needed Environment variables 
//
var DATASTORE_BLOB_ENDPOINT = process.env.DATABOX_OS_MONITOR_DRIVER_DATABOX_STORE_BLOB_ENDPOINT;
var HTTPS_CLIENT_CERT = process.env.HTTPS_CLIENT_CERT || '';
var HTTPS_CLIENT_PRIVATE_KEY = process.env.HTTPS_CLIENT_PRIVATE_KEY || '';
var credentials = {
	key:  HTTPS_CLIENT_PRIVATE_KEY,
	cert: HTTPS_CLIENT_CERT,
};


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/status", function(req, res) {
    res.send("active");
});

var vendor = "databoxtosh";

databoxDatasourceHelper.waitForDatastore(DATASTORE_BLOB_ENDPOINT)
  .then(() =>{
    proms = [
      databoxDatasourceHelper.registerDatasource(DATASTORE_BLOB_ENDPOINT, 'databox-store-blob', vendor, 'loadavg1','loadavg1', '%', 'Databox load average 1 minuet', 'The databox'),
      databoxDatasourceHelper.registerDatasource(DATASTORE_BLOB_ENDPOINT, 'databox-store-blob', vendor, 'loadavg5','loadavg5', '%', 'Databox load average 5 minuets', 'The databox'),
      databoxDatasourceHelper.registerDatasource(DATASTORE_BLOB_ENDPOINT, 'databox-store-blob', vendor, 'loadavg15','loadavg15', '%', 'Databox load average 15 minuets', 'The databox'),
      databoxDatasourceHelper.registerDatasource(DATASTORE_BLOB_ENDPOINT, 'databox-store-blob', vendor, 'freemem','freemem', 'bytes', 'Free memory in bytes', 'The databox'),
    ];
    return Promise.all(proms);
  })
  .then(()=>{
    https.createServer(credentials, app).listen(8080);

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
      saveReading('loadavg15',event['loadavg'][2]);
      saveReading('freemem', event['freemem']);

    });
  });

function saveReading(datasourceid,data) {
      console.log("Saving data::", datasourceid, data);
      var options = {
          uri: DATASTORE_BLOB_ENDPOINT + "/" + datasourceid + '/ts/',
          method: 'POST',
          json: 
          {
            'data': data   
          },
      };
      databoxRequest(options, (error, response, body) => { if(error) console.log(error, body);});
    }

module.exports = app;
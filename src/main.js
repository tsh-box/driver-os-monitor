/*jshint esversion: 6 */
const https = require('https');
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');

const monitor = require("os-monitor");

const databox = require('node-databox');

//
// Get the needed Environment variables
//
const DATABOX_STORE_BLOB_ENDPOINT = process.env.DATABOX_STORE_ENDPOINT;
const DATABOX_ZMQ_ENDPOINT = process.env.DATABOX_ZMQ_ENDPOINT

//HTTPS certs created by the container mangers for this components HTTPS server.
credentials = databox.getHttpsCredentials();


var PORT = process.env.port || '8080';

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/status", function(req, res) {
    res.send("active");
});

var vendor = "databox inc";

//Blob data sources
let tsbc = databox.NewTimeSeriesBlobClient(DATABOX_ZMQ_ENDPOINT, false);
let loadavg1 = databox.NewDataSourceMetadata();
loadavg1.Description = 'Databox load average 1 minute';
loadavg1.ContentType = 'application/json';
loadavg1.Vendor = 'Databox Inc.';
loadavg1.Unit = '%';
loadavg1.DataSourceType = 'loadavg1';
loadavg1.DataSourceID = 'loadavg1';
loadavg1.StoreType = 'ts';

let loadavg5 = databox.NewDataSourceMetadata();
loadavg5.Description = 'Databox load average over 5 minutes';
loadavg5.ContentType = 'application/json';
loadavg5.Vendor = 'Databox Inc.';
loadavg5.Unit = '%';
loadavg5.DataSourceType = 'loadavg5';
loadavg5.DataSourceID = 'loadavg5';
loadavg5.StoreType = 'ts';

let loadavg15 = databox.NewDataSourceMetadata();
loadavg15.Description = 'Databox load average over 15 minutes';
loadavg15.ContentType = 'application/json';
loadavg15.Vendor = 'Databox Inc.';
loadavg15.Unit = '%';
loadavg15.DataSourceType = 'loadavg15';
loadavg15.DataSourceID = 'loadavg15';
loadavg15.StoreType = 'ts';

let freemem = databox.NewDataSourceMetadata();
freemem.Description = 'Databox free memory in bytes';
freemem.ContentType = 'application/json';
freemem.Vendor = 'Databox Inc.';
freemem.Unit = 'bytes';
freemem.DataSourceType = 'freemem';
freemem.DataSourceID = 'freemem';
freemem.StoreType = 'ts';

//Structured data sources
let tsc = databox.NewTimeSeriesClient(DATABOX_ZMQ_ENDPOINT, false);
let loadavg1Structured = databox.NewDataSourceMetadata();
loadavg1Structured.Description = 'Databox load average 1 minute structured';
loadavg1Structured.ContentType = 'application/json';
loadavg1Structured.Vendor = 'Databox Inc.';
loadavg1Structured.Unit = '%';
loadavg1Structured.DataSourceType = 'loadavg1Structured';
loadavg1Structured.DataSourceID = 'loadavg1Structured';
loadavg1Structured.StoreType = 'ts';

let freememStructured = databox.NewDataSourceMetadata();
freememStructured.Description = 'Databox free memory in bytes structured';
freememStructured.ContentType = 'application/json';
freememStructured.Vendor = 'Databox Inc.';
freememStructured.Unit = 'bytes';
freememStructured.DataSourceType = 'freememStructured';
freememStructured.DataSourceID = 'freememStructured';
freememStructured.StoreType = 'ts';

tsbc.RegisterDatasource(loadavg1)
.then(()=>{
  return tsbc.RegisterDatasource(loadavg5);
})
.then(()=>{
  return tsbc.RegisterDatasource(loadavg15);
})
.then(()=>{
  return tsbc.RegisterDatasource(freemem);
})
.then(()=>{
  return tsc.RegisterDatasource(loadavg1Structured);
})
.then(()=>{
  return tsc.RegisterDatasource(freememStructured);
})
.catch((err)=>{
  console.log("Error registering data source:" + err);
});


https.createServer(credentials, app).listen(PORT);

monitor.start({ delay: 1000 });

// define handler that will always fire every cycle
monitor.on('monitor', function(event) {

  var loadavg1 = event['loadavg'][0];
  var loadavg5 = event['loadavg'][1];
  var loadavg15 = event['loadavg'][2];
  var freemem = event[freemem];
  console.log(loadavg1);

  saveBlob('loadavg1', event['loadavg'][0]);
  saveBlob('loadavg5', event['loadavg'][1]);
  saveBlob('loadavg15',event['loadavg'][2]);
  saveBlob('freemem', event['freemem']);

  saveStructured('loadavg1Structured', event['loadavg'][0]);
  saveStructured('freememStructured', event['freemem']);


  function saveBlob(datasourceid,data) {
    let json = {"data":data};
    console.log("Saving data::", datasourceid, json);
    tsbc.Write(datasourceid,json)
    .catch((error)=>{
      console.log("Error writing to store:", error);
    });
  }

  function saveStructured(datasourceid,data) {
    let json = {"value":data};
    console.log("Saving data::", datasourceid, json);
    tsc.Write(datasourceid,json)
    .catch((error)=>{
      console.log("Error writing to store:", error);
    });
  }

});

module.exports = app;
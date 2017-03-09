/*jshint esversion: 6 */
var https = require('https');
var express = require("express");
var bodyParser = require("body-parser");

var monitor = require("os-monitor");
const databox = require('node-databox');

//
// Get the needed Environment variables 
//
var DATABOX_STORE_BLOB_ENDPOINT = process.env.DATABOX_OS_MONITOR_DRIVER_DATABOX_STORE_BLOB_ENDPOINT;
var HTTPS_SERVER_CERT = process.env.HTTPS_SERVER_CERT || '';
var HTTPS_SERVER_PRIVATE_KEY = process.env.HTTPS_SERVER_PRIVATE_KEY || '';
var credentials = {
	key:  HTTPS_SERVER_PRIVATE_KEY,
	cert: HTTPS_SERVER_CERT,
};

var PORT = process.env.port || '8080';

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/status", function(req, res) {
    res.send("active");
});

var vendor = "databox inc";

//databox.waitForStoreStatus(DATABOX_STORE_BLOB_ENDPOINT,'active',10)
  new Promise((resolve,reject)=>{
    setTimeout(resolve,1000);
  })
  .then(() => {
    
    proms = [
      databox.catalog.registerDatasource(DATABOX_STORE_BLOB_ENDPOINT, {
        description: 'Databox load average 1 minuet',
        contentType: 'text/json',
        vendor: 'Databox Inc.',
        unit:'%',
        type: 'loadavg1',
        datasourceid: 'loadavg1',
        storeType: 'databox-store-blob'
      }),

      databox.catalog.registerDatasource(DATABOX_STORE_BLOB_ENDPOINT, {
        description: 'Databox load average 5 minuets',
        contentType: 'text/json',
        vendor: 'Databox Inc.',
        unit:'%',
        type: 'loadavg5',
        datasourceid: 'loadavg5',
        storeType: 'databox-store-blob'
      }),

      databox.catalog.registerDatasource(DATABOX_STORE_BLOB_ENDPOINT, {
        description: 'Databox load average 15 minuets',
        contentType: 'text/json',
        vendor: 'Databox Inc.',
        unit:'%',
        type: 'loadavg15',
        datasourceid: 'loadavg15',
        storeType: 'databox-store-blob'
      }),

       databox.catalog.registerDatasource(DATABOX_STORE_BLOB_ENDPOINT, {
        description: 'Free memory in bytes',
        contentType: 'text/json',
        vendor: 'Databox Inc.',
        unit:'bytes',
        type: 'freemem',
        datasourceid: 'freemem',
        storeType: 'databox-store-blob'
      })
      
    ];
    
    return Promise.all(proms);
  })
  .then(()=>{
    https.createServer(credentials, app).listen(PORT);

    monitor.start({ delay: 5000 });

    // define handler that will always fire every cycle
    monitor.on('monitor', function(event) {
      
      var loadavg1 = event['loadavg'][0];
      var loadavg5 = event['loadavg'][1];
      var loadavg15 = event['loadavg'][2];
      var freemem = event[freemem];
      console.log(loadavg1);

      save('loadavg1', event['loadavg'][0]);
      save('loadavg5', event['loadavg'][1]);
      save('loadavg15',event['loadavg'][2]);
      save('freemem', event['freemem']);

      function save(datasourceid,data) {
        console.log("Saving data::", datasourceid, data);
        
        databox.timeseries.write(DATABOX_STORE_BLOB_ENDPOINT, datasourceid, data)
        .catch((error)=>{
          console.log("[Error writing to store]", error);
        });
      }

    });
  })
  .catch((err)=>{
    console.log("[ERROR]",err);
  });


  
module.exports = app;
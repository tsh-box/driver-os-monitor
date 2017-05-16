/*jshint esversion: 6 */
const https = require('https');
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');

const monitor = require("os-monitor");


//
// Get the needed Environment variables 
//
const DATABOX_STORE_BLOB_ENDPOINT = process.env.DATABOX_STORE_ENDPOINT;

//HTTPS certs created by the container mangers for this components HTTPS server.
const HTTPS_SECRETS = JSON.parse( fs.readFileSync("/run/secrets/DATABOX_PEM") );
var credentials = {
	key:  HTTPS_SECRETS.clientprivate || '',
	cert: HTTPS_SECRETS.clientcert || '',
};

//TODO fix this in node-databox lib
process.env.ARBITER_TOKEN = fs.readFileSync("/run/secrets/ARBITER_TOKEN",{encoding:'base64'});
process.env.DATABOX_ARBITER_ENDPOINT = "https://databox-arbiter:8080";
process.env.CM_HTTPS_CA_ROOT_CERT = fs.readFileSync("/run/secrets/DATABOX_ROOT_CA");

const databox = require('node-databox');

var PORT = process.env.port || '8080';

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/status", function(req, res) {
    res.send("active");
});

var vendor = "databox inc";

databox.waitForStoreStatus(DATABOX_STORE_BLOB_ENDPOINT,'active',10)
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
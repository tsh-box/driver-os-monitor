var Promise = require('promise');
var request = require('request');
var monitor = require("os-monitor");
var databox_directory = require("./utils/databox_directory.js");


var sensors = ['loadavg1','loadavg5','loadavg15','freemem'];
var sensorIds = [];

var VENDOR_ID = null;

// register datastore with directory
var registerCallback = function (err, data) {
  if(err) {
    console.log(err);
    console.log("Can not register vendor with directory! waiting 5s before retrying");
    setTimeout(register,5000)
    return;
  }
  VENDOR_ID = data['id'];
  databox_directory.register_driver("datastore-os-monitor-driver", "Cool OS monitoring driver", VENDOR_ID, function (err, data) {
    if(err) {
      console.log(err);
      console.log("Can not register datastore with directory! waiting 5s before retrying");
      setTimeout(register,5000)
      return;
    }
    resolve();
  });

  
}

var register = function() {
  console.log("Registering ....");
  return new Promise((resolve, reject) => {
    databox_directory.register_vendor('systemMonitor',registerCallback);
  });
}


register()
.then (() => {
  proms = [
    databox_directory.register_sensor_type('loadavg1','System load over 1 minuet'),
    databox_directory.register_sensor_type('loadavg5','System load over 5 minuets'),
    databox_directory.register_sensor_type('loadavg15','System load over 15 minuets'),
    databox_directory.register_sensor_type('loadavg15','System load over 15 minuets')
  ]
  return Promise.all(proms);
})
.then((sorIds) => {
  
  sensorIds = sorIds;

  monitor.start({ delay: 5000 });

  // define handler that will always fire every cycle
  monitor.on('monitor', function(event) {
    
    var loadavg1 = event['loadavg'][0];
    var loadavg5 = event['loadavg'][1];
    var loadavg15 = event['loadavg'][2];
    var freemem = event[freemem];

    console.log(loadavg1);

  });
})
.catch((err) => {
  console.log(err);
})








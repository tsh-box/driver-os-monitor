var Promise = require('promise');
var request = require('request');
var monitor = require("os-monitor");
var databox_directory = require("./utils/databox_directory.js");


var DATASTORE_TIMESERIES_ENDPOINT = process.env.DATASTORE_TIMESERIES_ENDPOINT;


var sensors = ['loadavg1','loadavg5','loadavg15','freemem'];
var SENSOR_TYPE_IDs = [];
var SENSOR_IDs = {};

var VENDOR_ID = null;
var DRIVER_ID = null;
var DATASTORE_ID = null;

// register datastore with directory
var register = function() {
  return new Promise((resolve, reject) => {
    
    console.log("Registering ....");

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
        DRIVER_ID = data['id'];
        resolve();
      });
    }
    databox_directory.register_vendor('Databox',registerCallback);

  });

}


register()
.then(() => {
  return databox_directory.get_datastore_id('datastore-timeseries');
})
.then ((datastore_id) => {
  DATASTORE_ID = datastore_id;
  proms = [
    databox_directory.register_sensor_type('loadavg1','System load over 1 minuet'),
    databox_directory.register_sensor_type('loadavg5','System load over 5 minuets'),
    databox_directory.register_sensor_type('loadavg15','System load over 15 minuets'),
    databox_directory.register_sensor_type('freemem','Free memory')
  ]
  return Promise.all(proms);
})
.then ((sensorTypeIds) => {
  SENSOR_TYPE_IDs = sensorTypeIds;
  proms = [
    databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[0], DATASTORE_ID, VENDOR_ID, 'loadavg1', 'percent', '%', 'System load over 1 minuet', 'In the databox'),
    databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[1], DATASTORE_ID, VENDOR_ID, 'loadavg5', 'percent', '%', 'System load over 5 minuet', 'In the databox'),
    databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[2], DATASTORE_ID, VENDOR_ID, 'loadavg15', 'percent', '%', 'System load over 15 minuet', 'In the databox'),
    databox_directory.register_sensor(DRIVER_ID, SENSOR_TYPE_IDs[3], DATASTORE_ID, VENDOR_ID, 'freemem', 'bytes', 'b', 'Free memory', 'In the databox'),
  ]
  return Promise.all(proms);
})
.then((sensorIds) => {
  
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
          sensor_value: reading   
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








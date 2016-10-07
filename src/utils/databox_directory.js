var request = require('request');
var Promise = require('promise');


var databox_directory_url = process.env.DATABOX_DIRECTORY_ENDPOINT;


exports.register_driver = function(hostname, description, vendor_id, done) { // requires a description which is most liekely the vendor name and must be unique, will return databox global vendor id
	var options = {
  		uri: databox_directory_url+'/driver/register',
  		method: 'POST',
  		json: 
  		{
    		"description": description,
    		"hostname": hostname,
    		"vendor_id": vendor_id
  		}
	};

	request(options, function (error, response, body) {
  		return done(error,body);
	});
}

exports.register_vendor = function(description, done) { // requires a description which is most liekely the vendor name and must be unique, will return databox global vendor id
	var options = {
  		uri: databox_directory_url+'/vendor/register',
  		method: 'POST',
  		json: 
  		{
    		"description": description	
  		}
	};

	request(options, function (error, response, body) {
  		return done(error,body);
	});
}

exports.register_sensor_type = function(description, done) { // requires a description which describes the catagory of sensors, if already exits then returns id 
	return new Promise((resolve, reject) => {

		var options = {
				uri: databox_directory_url+'/sensor_type/register',
				method: 'POST',
				json: 
				{
					"description": description	
				}
		};

		request(options, function (error, response, body) {
				if (error) {
					reject(error);
				}
				resolve(body['id']);
		});
  });
}

exports.register_sensor = function(driver_id, sensor_type_id, datastore_id, vendor_id, vendor_sensor_id, unit, short_unit, description, location) { 
  return new Promise((resolve, reject) => {

    var options = {
        uri: databox_directory_url+'/sensor/register',
        method: 'POST',
        json: 
        {
          "description" : description, 
              "driver_id": driver_id, 
              "sensor_type_id" : sensor_type_id, 
              "datastore_id" : datastore_id, 
              "vendor_id" : vendor_id, 
              "vendor_sensor_id" : vendor_sensor_id, 
              "unit" : unit, 
              "short_unit" : short_unit, 
              "location" : location
        }
    };

    request(options, function (error, response, body) {
        if (error) {
          reject(error);
        }
        resolve(body);
    });
  });
}


exports.register_actuator_type = function(description, done) {
	var options = {
  		uri: databox_directory_url+'/actuator_type/register',
  		method: 'POST',
  		json: 
  		{
    		"description": description	
  		}
	};

	request(options, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
    	 return done(body);
  		}
  		return done(error);
	});
}

exports.register_actuator_method = function(actuator_id, description, done) {
	var options = {
  		uri: databox_directory_url+'/actuator_method/register',
  		method: 'POST',
  		json: 
  		{
    		"actuator_id" : actuator_id,
    		"description": description	
  		}
	};

	request(options, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
    	 return done(body);
  		}
  		return done(error);
	});
}

exports.register_actuator = function(driver_id, actuator_type_id, controller_id, vendor_id, vendor_actuator_id, description, location, done) {
	var options = {
  		uri: databox_directory_url+'/actuator/register',
  		method: 'POST',
  		json: 
  		{
    		"description" : description, 
            "driver_id": driver_id, 
            "actuator_type_id" : actuator_type_id, 
            "controller_id" : controller_id, 
            "vendor_id" : vendor_id, 
            "vendor_actuator_id" : vendor_actuator_id, 
            "location" : location	
  		}
	};

	request(options, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
    	 return done(body);
  		}
  		return done(error);
	});
}

exports.get_my_registered_sensors = function(vendor_id, done) {
	var options = {
  		uri: databox_directory_url+'/vendor/'+vendor_id+'/sensor',
  		method: 'GET',
	};

	request(options, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
    	 return done(body);
  		}
  		return done(error);
	});
}

exports.get_datastore_id = function(hostname, done) {
	return new Promise((resolve, reject) => {
    var options = {
    		uri: databox_directory_url+'/datastore/get_id',
    		method: 'POST',
    		json:
    		{
    			"hostname": hostname
    		}
  	};

  	request(options, function (error, response, body) {
        if(error) {
          reject(error);
          return;
        }
        resolve(body['id']);
  	});
  });
}

exports.get_registered_sensor_types = function(done) { // takes in 

}

exports.get_registered_actuator_types = function(done) { // takes in 

}

exports.get_my_registered_actuators = function(vendor_id, done) {

}
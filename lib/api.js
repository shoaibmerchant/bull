/*
	api.js to allow adding jobs to the queue using a REST API & WebSockets
	Created by Shoaib Merchant

	Copyright MIT License
*/

/* Using the restify module for implementing http requests and websockets */

"use strict";
var restify = require('restify');

var QueueApi = function QueueApi(queue, port, debug){

	var self = this;

	if(!self){
    	return new QueueApi(queue, port, debug);
  	}

  	//Set Member variables
	self.queue = queue;
	self.port = port;
	self.debug = debug;

	//Basic Server Details
	self.server = restify.createServer({
	  name: self.queue.name,
	  version: '1.0.0'
	});

	self.server.use(restify.acceptParser(self.server.acceptable));
	self.server.use(restify.queryParser());
	self.server.use(restify.bodyParser());

	self.bindRestApi();

	//Start the Server
	self.server.listen(this.port, function () {
		if(self.debug)
		{
			console.log('%s listening at %s', self.server.name, self.server.url);
		}
	});
}


QueueApi.prototype.bindRestApi = function(){

	var self = this;

	//Test call to make sure stuff is working fine
	var url = '/' + self.queue.name + '/:name';
	self.server.get(url, function (req, res, next) {
	  res.send({message:"Hello " + req.params.name + "!"});
	  return next();
	});

	//Different binders are mentioned below
	self.bindAddJob();
}

QueueApi.prototype.bindAddJob = function(){
	var self = this;

	//Test call to make sure stuff is working fine
	var url = '/' + self.queue.name;
	self.server.put(url, function (req, res, next) {

	  if(req.headers['content-type'] != "application/json"){
			res.send({error:"content-type json only"});
	  }

	  if(self.debug)
		{
			console.log(self.queue.name + " received a new job request via PUT");
		}
	  	
	  	var opts = req.body.data.options || {};
		
		//Send new job to queue
		self.queue.add(req.body.data, opts);

	  	return next();
	});
}



module.exports = QueueApi;





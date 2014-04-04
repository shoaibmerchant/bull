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
	/*var url = '/' + self.queue.name + '/:name';
	self.server.get(url, function (req, res, next) {
	  res.send({message:"Hello " + req.params.name + "!"});
	  return next();
	}); */

	//Different binders are mentioned below
	self.bindAddJob();

	self.bindGetJobs();
}

QueueApi.prototype.bindAddJob = function(){
	var self = this;

	//Test call to make sure stuff is working fine
	var url = '/' + self.queue.name;
	self.server.put(url, function (req, res, next) {

		if(req.headers['content-type'] != "application/json"){
		  		res.writeHead(405,{'Content-Type': 'application/json; charset=utf-8'});
				res.end(JSON.stringify({error:"content-type json only"}));
				return next();
		}

	  	var opts = req.body.data.options || {};
		
		//Send new job to queue
		var job = self.queue.add(req.body.data, opts).then(function(job){
			res.writeHead(201, {'Content-Type': 'application/json; charset=utf-8'});
			res.end(JSON.stringify({id:job.jobId,message:"job added successfully."}));

			if(self.debug){
				console.log(self.queue.name + " received a new job request via PUT");
				console.log("new job with id " + job.jobId + " created");
			}
		  	return next();
		}, function(err){
			if(self.debug){
				console.log(self.queue.name + " received a new job request via PUT");
				console.log("An error occurred with adding new job. Error: " + err);
			}

			res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
			res.end(JSON.stringify({message:"An error occured. Check console for error message."}));					

			return next();
		});
	});
}

QueueApi.prototype.bindGetJobs = function(){
	var self = this;

	//Test call to make sure stuff is working fine

	//Type can be 'active', 'wait', 'completed', 'failed'

	var url = '/' + self.queue.name +  "/:type";
	
	self.server.get(url, function (req, res, next) {

		var type = req.params.type;
	
		if(self.debug){
			console.log("GET request recieved with params " + JSON.stringify(req.params));
		}

		var jobs = self.queue.getJobs(type).then(function(jobs){
			if(jobs == undefined)
			{
				jobs = [];	
			}

			//Make the jobs array serialize
			var jobsArray = [];
			for(var i=0;i<jobs.length;i++){
				jobsArray.push({jobId: jobs[i].jobId, paused: jobs[i].queue.paused, data: jobs[i].data, opts: jobs[i].opts, progress: jobs[i]._progress});
			}

			if(self.debug){
				console.log(jobsArray);
			}
			

			res.send(jobsArray);
			return next();
		
			
		}, function(err){
			if(self.debug){
				console.log(self.queue.name + " received a new job request via PUT");
				console.log("An error occurred with adding new job. Error: " + err);
			}

			res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
			res.end(JSON.stringify({message:"An error occured. Check console for error message."}));				

			return next();
		});

		
  		
  		/*function(jobIds){
			console.log(jobIds);
			res.send(jobIds);
		}*/
	});
}



module.exports = QueueApi;





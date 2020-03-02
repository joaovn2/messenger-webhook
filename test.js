'use strict'
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server
  global.result;
// Construct the message body
   request.post({
    url: "http://192.168.10.254/rest/v1/login-sessions",
    "userName":"admin",
    "password":"W@ster123"
   }, function(error,response,body){
    var jey = JSON.parse(body);
    var id = jey.cookie;    
    request.get({
    url:"http://192.168.10.254/rest/v1/vlans",
    "sessionId":id,   
   },function (error,response,body){
      result = body;
      
   });
   });
   console.log(result);
   

   

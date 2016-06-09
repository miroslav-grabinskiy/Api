var express = require('express');
var route = require('./routes');
var config = require('./config');
var http = require('http');
var path = require('path');

var app = express();
app.set('port', config.get('port'));

route(app);

http.createServer(app).listen(app.get('port'), function () {
  console.log('app listening on port: ' + config.get('port'));
});

console.log('end of app.js');

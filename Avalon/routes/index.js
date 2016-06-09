var config = require('../config');
var bodyParser = require('body-parser');
var mongoose = require('../lib/mongoose');

var includeRoutes = [];
includeRoutes.push( require('./company') );
includeRoutes.push( require('./product') );

var routes = function(app) {
	app.use(bodyParser.json());
	
	var includeRoutesLength = includeRoutes.length;
	for (var i = 0; i < includeRoutesLength; i++) {
		includeRoutes[i](app);
	}

	app.use(function(err, req, res, next) {
		var result = {
			success: null,
		};
		
		console.log(err);
		
		if (Array.isArray(err)) {
			var status = err[0];
			result.error = err[1];
			result = JSON.stringify(result);
			res.status(err[0]).send(result);
		} else {
			// console.log(app.get('env'));
			//result.error = 'Internal Server Error';
			result = err;
			result = JSON.stringify(result);
			res.status(500).send(result);
		}
	});
};

module.exports = routes;
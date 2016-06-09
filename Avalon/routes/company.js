var companyHandler = require('../handlers/company');

var companyRoutes = function(app) {
	app.post('/companies', function(req, res, next) {
		companyHandler.addCompany(req, res, next);
	});
	
	app.get('/companies', function(req, res, next) {
		companyHandler.companiesList(req, res, next);
	});

	app.get('/companies/:companyName', function(req, res, next) {
		companyHandler.getCompany(req, res, next);
	});

	app.delete('/companies/:companyName', function(req, res, next) {
		companyHandler.deleteCompany(req, res, next);
	});

	app.put('/companies/:companyName', function(req, res, next) {
		companyHandler.updateCompany(req, res, next);
	});
};

module.exports =  companyRoutes;
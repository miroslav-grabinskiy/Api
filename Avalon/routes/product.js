var productHandler = require('../handlers/product');

var productRoutes = function(app) {
	app.post('/products', function(req, res, next) {
		productHandler.addProduct(req, res, next);
	});
	
	app.get('/products', function(req, res, next) {
		productHandler.productsList(req, res, next);
	});

	app.get('/products/:itemName', function(req, res, next) {
		productHandler.getProduct(req, res, next);
	});

	app.delete('/products/:itemName', function(req, res, next) {
		productHandler.deleteProduct(req, res, next);
	});

	app.put('/products/:itemName', function(req, res, next) {
		productHandler.updateProduct(req, res, next);
	});
};

module.exports = productRoutes;
var async = require('async');
var Company = require('../models/company').Company;
var Product = require('../models/product').Product;

var addProduct = function(req, res, next) {
	var itemName = req.body.itemName || '';
	var providerCompany = req.body.providerCompany || [];
	
	async.waterfall([
		function(callback){
			Product.findOne({itemName: itemName}, function(err, product) {
				if (err) {
					return next(err);
				}
				
				if (product) {
					return next([409, 'already exists']);
				}
				
				callback(null);
			});
		},
		function(callback) {
			var product = new Product({
				itemName: itemName,
				providerCompany: providerCompany
			});
			
			product.save(function(err, product, affected) {
				if (err) {
					return next(err);
				}
				
				callback(null, product);
			});
		},
		function(product, callback) {
			try{
				async.each(
					product.providerCompany, 
					function(companyName, callback) {
					Company.findOne({companyName: companyName}, function(err, company) {
						if (err) {
							throw next(err);
						}
						
						if (!company) {
							Company.findOne({companyName: companyName}, function(err, company) {
								if (err) {
									throw next(err);
								}
							});

							company = new Company({
								companyName: companyName,
								companyGoods: [product.itemName]
							});
							
							company.save(function(err, company, affected) {
								if (err) {
									throw next(err);
								}
							});
						} else {
							Company.findOneAndUpdate({companyName: companyName}, {$push: {companyGoods: product.itemName} }, {upsert: true}, function(err, company) {
								if (err) {
									throw next(err);
								}
							});
						}
					});
					} 
				);
				callback(null, product); //sync add companies and res
			} catch(e) {
				return next(e);
			}

			//callback(null, product); for async add companies and res
		}
	],	function (err, product) {
		if (err) {
			return next(err);
		}
		
		var result = {
			error: null
		};

		result.success = {
			itemId: product.itemId,
			itemName: product.itemName,
			providerCompany: product.providerCompany
		};

		res.location('/item/' + product.itemName);
		res.status(201).send(result);
	});
};

var productsList = function(req, res, next) {
	Product.find({}, 'itemId itemName providerCompany -_id', function(err, products) {
		if (err) {
			return next(err);
		}
		
		var result = {
			error: null
		};

		result.success = products;

		res.status(200).send(result);
	});
};


var getProduct = function(req, res, next) {
	var itemName = req.params.itemName || '';

	Product.findOne({itemName: itemName}, 'itemId itemName providerCompany -_id', function(err, product) {
		if (err) {
			return next(err);
		}

		if (!product) {
			return next([404, 'not found']);
		}

		var result = {
			error: null
		};

		result.success = product;
		res.status(200).send(result);
	});
};

var deleteProduct = function(req, res, next) {
	var itemName = req.params.itemName || '';

	Product.findOneAndRemove({itemName: itemName}, function(err, product) {
		if (err) {
			return next(err);
		}

		if (!product) {
			return next([404, 'not found']);
		}
		
		var result = {
			error: null
		};

		result.success = {
			itemId: product.itemId,
			itemName: product.itemName,
			companyGoods: product.providerCompany
		};

		res.status(200).send(result);

		Company.update(
			{ companyGoods: { "$in" : [itemName] } }, 
			{ $pullAll: {companyGoods : [itemName] } }, 
			{multi: true},
			function(err, numberAffected, rawResponse) {
			if (err) {
				return next(err);
			}
		});
	});
};

var updateProduct = function(req, res, next) {
	var oldItemName = req.params.itemName;
	var newItemName = req.body.itemName;
	var newProviderCompany = req.body.providerCompany;

	Product.findOneAndUpdate({itemName: oldItemName}, {itemName: newItemName, providerCompany: newProviderCompany}, {upsert: false}, function(err, product) {
		if (err) {
			return next(err);
		}

		if (!product) {
			next([404, 'Not Found']);
		} else {
			var result = {
				error: null
			};

			result.success = {
				itemName: newItemName,
				providerCompany: newProviderCompany,
				itemId: product.itemId
			};

			res.status(200).send(result);

			try {
				async.series([
					function(callback) {
						Company.update(
							{ companyGoods: { "$in" : [oldItemName] } }, 
							{ $pullAll: {companyGoods : [oldItemName] } }, 
							{multi: true},
							function(err, numberAffected, rawResponse) {

							if (err) {
								return next(err);
							}

							callback();
						});
					},
					function(callback) {
						var counter = 0;
						var productProviderLength = newProviderCompany.length;
						try {
							async.each(
								newProviderCompany, 
								function(companyName) {
								Company.findOne({companyName: companyName}, function(err, company) {
									if (err) {
										throw next(err);
									}
									
									if (!company) {
										Company.findOne({companyName: companyName}, function(err, company) {
											if (err) {
												throw next(err);
											}
										});

										Company = new Company({
											companyName: companyName,
											companyGoods: [newItemName]
										});
										
										company.save(function(err, company, affected) {
											if (err) {
												throw next(err);
											}
										});
									} else {
										Company.findOneAndUpdate({companyName: companyName}, {$push: {companyGoods: newItemName} }, {upsert: false}, function(err, company) {
											if (err) {
												throw next(err);
											}
											if (counter >= productProviderLength) {
												callback();
											}
										});
									}

									counter++;

								});
								}
							);
						} catch(e) {
							return next(e);
						}
					},
					function(callback) {
						Product.remove({ "companyGoods": { $size: 0} },function(err, rawResponse, numberAffected) {
							if (err) {
								return next(err);
							}
						})
					}
				]);
			} catch (e) {
				return next(e);
			}
		}
	});
};

module.exports.addProduct = addProduct;
module.exports.getProduct = getProduct;
module.exports.deleteProduct = deleteProduct;
module.exports.updateProduct = updateProduct;
module.exports.productsList = productsList;
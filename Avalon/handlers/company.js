var async = require('async');
var Company = require('../models/company').Company;
var Product = require('../models/product').Product;

var addCompany = function(req, res, next) {
	var companyName = req.body.companyName || '';
	var companyGoods = req.body.companyGoods || [];
	
	async.waterfall([
		function(callback){
			Company.findOne({companyName: companyName}, function(err, company) {
				if (err) {
					return next(err);
				}
				
				if (company) {
					return next([409, 'already exists']);
				}
				
				callback(null);
			});
		},
		function(callback) {
			var company = new Company({
				companyName: companyName,
				companyGoods: companyGoods
			});
			
			company.save(function(err, company, affected) {
				if (err) {
					return next(err);
				}
				
				callback(null, company);
			});
		},
		function(company, callback) {
			try {
				async.each(
					company.companyGoods, 
					function(item, callback) {
					Product.findOne({itemName: item}, function(err, product) {
						if (err) {
							throw next(err);
						}
						
						if (!product) {
							Product.findOne({itemName: item}, function(err, product) {
								if (err) {
									throw next(err);
								}
							});

							product = new Product({
								itemName: item,
								providerCompany: [company.companyName]
							});
							
							product.save(function(err, product, affected) {
								if (err) {
									throw next(err);
								}
							});
						} else {
							Product.findOneAndUpdate({itemName: item}, {$push: {providerCompany: company.companyName} }, {upsert: true}, function(err, product) {
								if (err) {
									throw next(err);
								}
							});
						}
					});
					} 
				);
				callback(null, company); //sync add items and res
			} catch(e) {
				return next(e);
			}

			//callback(null, company); for async add items and res
		}
	],	function (err, company) {
		if (err) {
			return next(err);
		}
		
		var result = {
			error: null
		};

		result.success = {
			companyId: company.companyId,
			companyName: company.companyName,
			companyGoods: company.companyGoods
		};

		res.location('/company/' + company.companyName);
		res.status(201).send(result);
	});
};

var companiesList = function(req, res, next) {
	Company.find({}, 'companyId companyName companyGoods -_id', function(err, companies) {
		if (err) {
			return next(err);
		}
		
		var result = {
			error: null
		};

		result.success = companies;

		res.status(200).send(result);
	});
};

var getCompany = function(req, res, next) {
	var companyName = req.params.companyName || '';

	Company.findOne({companyName: companyName}, 'companyId companyName companyGoods -_id', function(err, company) {
		if (err) {
			return next(err);
		}

		if (!company) {
			return next([404, 'not found']);
		}

		var result = {
			error: null
		};

		result.success = company;
		res.status(200).send(result);
	});
};

var deleteCompany = function(req, res, next) {
	var companyName = req.params.companyName || '';

	Company.findOneAndRemove({companyName: companyName}, function(err, company) {
		if (err) {
			return next(err);
		}

		if (!company) {
			return next([404, 'not found']);
		}
		
		var result = {
			error: null
		};

		result.success = {
			companyId: company.companyId,
			companyName: company.companyName,
			companyGoods: company.companyGoods
		};

		res.status(200).send(result);

		Product.update(
			{ providerCompany: { "$in" : [companyName] } }, 
			{ $pullAll: {providerCompany : [companyName] } }, 
			{multi: true},
			function(err, numberAffected, rawResponse) {
			if (err) {
				return next(err);
			}
		});
	});
};

var updateCompany = function(req, res, next) {
	var oldCompanyName = req.params.companyName;
	var newCompanyName = req.body.companyName;
	var newCompanyGoods = req.body.companyGoods;

	Company.findOneAndUpdate({companyName: oldCompanyName}, {companyName: newCompanyName, companyGoods: newCompanyGoods}, {upsert: false}, function(err, company) {
		if (err) {
			return next(err);
		}

		if (!company) {
			next([404, 'Not Found']);
		} else {
			var result = {
				error: null
			};

			result.success = {
				companyName: newCompanyName,
				companyGoods: newCompanyGoods,
				companyId: company.companyId
			};

			res.status(200).send(result);

			try {
				async.series([
					function(callback) {
						Product.update(
							{ providerCompany: { "$in" : [oldCompanyName] } }, 
							{ $pullAll: {providerCompany : [oldCompanyName] } }, 
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
						var companyGoodsLength = newCompanyGoods.length;
						try {
							async.each(
								newCompanyGoods, 
								function(itemName) {
								Product.findOne({itemName: itemName}, function(err, product) {
									if (err) {
										throw next(err);
									}
									
									if (!product) {
										Product.findOne({itemName: itemName}, function(err, product) {
											if (err) {
												throw next(err);
											}
										});

										product = new Product({
											itemName: itemName,
											providerCompany: [newCompanyName]
										});
										
										product.save(function(err, product, affected) {
											if (err) {
												throw next(err);
											}
										});
									} else {
										Product.findOneAndUpdate({itemName: itemName}, {$push: {providerCompany: newCompanyName} }, {upsert: false}, function(err, product) {
											if (err) {
												throw next(err);
											}

											if (counter >= companyGoodsLength) {
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
						Product.remove({ "providerCompany": { $size: 0} },function(err, rawResponse, numberAffected) {
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

module.exports.addCompany = addCompany;
module.exports.getCompany = getCompany;
module.exports.deleteCompany = deleteCompany;
module.exports.updateCompany = updateCompany;
module.exports.companiesList = companiesList;
var mongoose = require('../lib/mongoose');
	Schema = mongoose.Schema;
    autoIncrement = require('mongoose-auto-increment');
    productSchema = require('./product').Product;

autoIncrement.initialize(mongoose);

var schema = new Schema({
	companyId: {
		type: Number,
	},
	companyName: {
		type: String,
		required: true,
		unique: true
	},
	companyGoods: [{
		type: String,
		ref: 'Product'
	}]
	
});

var companySchema = mongoose.model('Company', schema);

schema.plugin(autoIncrement.plugin, {model: 'Company', field: 'companyId'});
module.exports.Company = companySchema;
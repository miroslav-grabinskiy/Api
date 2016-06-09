var mongoose = require('../lib/mongoose');
	Schema = mongoose.Schema;
    autoIncrement = require('mongoose-auto-increment');
    companySchema = require('./company').Company;

autoIncrement.initialize(mongoose);

var schema = new Schema({
	itemId: {
		type: Number,
	},
	itemName: {
		type: String,
		required: true,
		unique: true
	},
	providerCompany: [{
		type: String,
	}]
	
});

var productSchema = mongoose.model('Product', schema);

schema.plugin(autoIncrement.plugin, {model: 'Product', field: 'itemId'});
module.exports.Product = productSchema;

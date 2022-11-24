var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HolidaySchema = new Schema({

    month: {type: String, required: true},
    year: {type: String, required: true},
    day: {type: String, required: true},
    event: {type: String, required: true},
});


module.exports = mongoose.model('Holiday', HolidaySchema);
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const cdnSchema = new Schema({
    userId: {
        type: Number
    },
    fileName: {
        type: String
    },
    fileUrl: {
        type: String
    }
})

module.exports = mongoose.model( 'cdnFile', cdnSchema )
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
  id: Number,
  name: String,
  email: String,
  password: String,
  admin: Boolean,
  allowshorturl: Boolean,
  cdnToken: {
    type: String,
    default: ""
  }
})

module.exports = mongoose.model('user', userSchema)
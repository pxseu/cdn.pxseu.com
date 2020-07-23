const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
  id: Number,
  name: String,
  email: String,
  password: String,
  admin: Boolean,
  shorturl: {
    token: {
      type: String,
    	default: "bruh"
    },
    allow: {
      type: Boolean,
      default: false
    },
    allowPrivate: {
      type: Boolean,
      default: false,
    }
  },
  cdn: {
    allow: {
	    type: Boolean,
    	default: false
    },
    token: {
	    type: String,
    	default: ""
    }
  }
})

module.exports = mongoose.model('user', userSchema)
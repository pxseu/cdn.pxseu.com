const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
  id: Number,
  name: String,
  email: String,
  password: String,
  admin: Boolean,
  shorturl: {
    allow: {
      type: Boolean,
      default: false,
    },
    allowPrivate: {
      type: Boolean,
      default: false,
    },
    created: Array
  },
  cdn: {
    allow: {
	    type: Boolean,
    	default: false
    },
    token: {
	    type: String,
    	default: ""
    },
    files: [{fileName: String, fileLink: String}]
  }
})

module.exports = mongoose.model('user', userSchema)
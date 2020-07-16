require('dotenv').config()

const port = 6002
const errorPages = [ "404_1.html", "404_2.html" ]

const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const favicon = require('serve-favicon')
const mongoose = require('mongoose')
const express = require('express')
const path = require("path")

const cdnV1 = require("./routes/v1")
const cdnV2 = require("./routes/v2")

const app = express()

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})
//start mongodb

mongoose.connection.on('error', (error) => console.error(error))
mongoose.connection.once('open', () => console.log('Connected to database'))

app.use(bodyParser.json())
app.use(fileUpload());
app.use(express.urlencoded({
  extended: false
}))

app.use('/v1', cdnV1)
app.use('/v2', cdnV2)
app.use(favicon(__dirname + '/www/images/favicon.ico'));

app.get('/', async (req, res)=> {
  if (req.accepts('html')) {
    res.sendFile(__dirname + '/www/index.html')
  }

  if (req.accepts('json')) {
    res.send({ hi: 'Welcome to my cdn. :))))' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Welcome to my cdn.');
})

/* app.use('/', (req, res) => {
  res.sendFile(__dirname + '/cdn' + req.url, (err) => {
    if (err){
      res.status(404).sendFile( __dirname + "/www/errors/" + errorPages[Math.floor(Math.random() * errorPages.length)] )
    }
  })  
}) */

app.use(express.static(path.join(__dirname, 'cdn')))

app.use(function(req, res){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.sendFile( __dirname + "/www/errors/" +
    errorPages[Math.floor(Math.random() * errorPages.length)] )
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

app.listen(port, 'localhost', ()=> {
  console.log('Listening on port: ' + port)
});
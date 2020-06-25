require('dotenv').config()

const port = 6002

const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const favicon = require('serve-favicon')
const User = require('./models/users')
const mongoose = require('mongoose')
const express = require('express')
const shortId = require('shortid')

const app = express()

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useUnifiedTopology: true
})
//start mongodb

mongoose.connection.on('error', (error) => console.error(error))
mongoose.connection.once('open', () => console.log('Connected to database'))

app.use(bodyParser.json())
app.use(fileUpload());
app.use(express.urlencoded({
  extended: false
}))
app.use(favicon(__dirname + '/www/images/favicon.ico'));

app.post('/upload', async (req, res) => {
  var origin = req.get('origin');

  var token = req.body.token;
  const currentUser = await User.findOne({
    'cdn.token': token
  })
  if (currentUser ==undefined || currentUser.cdn.allow == false) return res.status(401).send("You're not allowed to upload.")
  if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send('No files were uploaded.');

  let sampleFile = req.files.sampleFile;
  var re = /(?:\.([^.]+))?$/;
  var ext = re.exec(sampleFile.name)[1];  
  const fileId = shortId.generate(); 
  var file;
  if (ext == undefined){
    sampleFile.mv('./cdn/' + fileId, function(err) {
      if (err) return res.status(500).send(err);
      file = fileId;
      var link = 'http://' + req.get('host') + '/' + file;
      var response = currentUser.name + ' uploaded a file! Link: ' + link;
      res.redirect(origin + "/cdn/succes?link=" + encodeURIComponent(link))
      console.log(response);
    });
  } else {
    sampleFile.mv('./cdn/' + fileId + '.' + ext, function(err) {
      if (err) return res.status(500).send(err);
      file = fileId + '.' + ext;
      var link = 'http://' + req.get('host') + '/' + file;
      var response = currentUser.name + ' uploaded a file! Link: ' + link;
      res.redirect(origin + "/cdn/succes?link=" + encodeURIComponent(link))
      console.log(response);
    });
  }
  var fileData = {
    "fileName": sampleFile.name,
    "fileLink": file
  }
  User.updateOne({
    'cdn.token': token
  }, {
    $push: { 'cdn.files': fileData }
  }).exec()
});

app.use((req, res) => {
  res.sendFile(__dirname + '/cdn' + req.url, (err) => {
    if (err){
      res.sendStatus(404)
    }
  })  
})


app.listen(port, 'localhost', ()=> {
  console.log('Listening on port: ' + port)
})
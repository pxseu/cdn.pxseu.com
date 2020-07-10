require('dotenv').config()

const port = 6002

const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const favicon = require('serve-favicon')
const User = require('./models/users')
const mongoose = require('mongoose')
const express = require('express')
const shortId = require('shortid')
const fs = require('fs');

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

app.get('/', async (req, res)=> {
  res.sendFile(__dirname + '/www/index.html')
})

app.post('/upload', async (req, res) => {
  let origin = req.get('origin');
  
  let token = req.body.token;
  const currentUser = await User.findOne({
    'cdn.token': token
  })

  if (!origin.endsWith("localhost:5000")) return res.status(403).send("Use my websit mf")

  if (currentUser ==undefined || currentUser.cdn.allow == false) return res.status(401).send("You're not allowed to upload.")
  if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send('No files were uploaded.');

  

  let sampleFile = req.files.sampleFile;
  let re = /(?:\.([^.]+))?$/;
  let ext = re.exec(sampleFile.name)[1];  
  const fileId = shortId.generate(); 
  let link, file;
  if (ext == undefined){
    file = fileId;
    link = 'http://' + req.get('host') + '/' + file;
  } else {
    file = fileId + '.' + ext;
    link = 'http://' + req.get('host') + '/' + file;
  }
  sampleFile.mv('./cdn/' + file , function(err) {
    if (err) return res.status(500).send(err); 
    let response = currentUser.name + ' uploaded a file! Link: ' + link;
    res.redirect(origin + "/cdn/succes?link=" + encodeURIComponent(link))
    console.log(response);
  });

  User.updateOne({
    'cdn.token': token
  }, {
    $push: { 'cdn.files': {fileName: sampleFile.name, fileLink: link} }
  }).exec()
});

app.post('/delete', async (req, res) => {
  let origin = req.get('origin');
  let file = req.body.fileUrl;
  file = decodeURIComponent(file);
  let parts = file.split('/');
  let lastSegment = parts.pop() || parts.pop();
  let token = req.body.token;

  let dbUser = await User.findOne({
    'cdn.token': token
  });
  
  if (search(file, dbUser.cdn.files) == false) return res.sendStatus(401);
  fs.unlink('./cdn/' + lastSegment, (err) => {
      if (err) {
        console.error(err)
        return
      }
      console.log('Removed: ' + lastSegment);
    
      User.updateOne({
        'cdn.token': token
      }, {$pull: {
        'cdn.files': {
         fileLink: file
        }
      }
      }).exec()
      res.redirect(origin + '/cdn/myfiles')
    })
})

app.use('/', (req, res) => {
  res.sendFile(__dirname + '/cdn' + req.url, (err) => {
    if (err){
      res.sendStatus(404)
    }
  })  
})


app.listen(port, 'localhost', ()=> {
  console.log('Listening on port: ' + port)
})


function search(nameKey, myArray){
  for (let i=0; i < myArray.length; i++) {
      if (myArray[i].fileLink === nameKey) {
          return true;
      }
  }
  return false
}
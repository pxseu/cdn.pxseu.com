const express = require("express");
const router = express.Router()

const shortId = require('shortid')
const fs = require('fs');
const User = require('../models/users')

router.get('/', (req, res) => {
    res.redirect('/')
});


router.post('/upload', async (req, res) => {
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
  
router.post('/delete', async (req, res) => {
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

function search(nameKey, myArray){
    for (let i=0; i < myArray.length; i++) {
        if (myArray[i].fileLink === nameKey) {
            return true;
        }
    }
    return false
  }

module.exports = router
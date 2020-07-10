const express = require("express");
const router = express.Router()

const shortId = require('shortid')
const User = require('../models/users')

router.get('/', (req, res) => {
    res.redirect('/')
});


router.post('/upload', async (req, res) => {
    let token = req.header("ApiToken");
    const currentUser = await User.findOne({
        'cdn.token': token
    })

    if (currentUser ==undefined || currentUser.cdn.allow == false) return res.status(401).json({ error: "You're not allowed to upload."})
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).json({ error: "No files were uploaded." } );

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
        res.json({ url : link })
        console.log(response);
    });

    User.updateOne({
        'cdn.token': token
    }, {
        $push: { 'cdn.files': {fileName: sampleFile.name, fileLink: link} }
    }).exec()
});
  
module.exports = router
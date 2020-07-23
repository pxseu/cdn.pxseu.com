const express = require("express");
const router = express.Router()

const shortId = require('shortid')
const fs = require('fs');
const User = require('../models/users')
const Cdn = require('../models/cdn');

router.get('/files', async (req, res) => {
    let token = req.body.token || req.header("Authorization");

    if (token == undefined) return res.status(401).json({ error: "No token was provided." });

    const currentUser = await User.findOne({
        'cdn.token': token
    });

    if (currentUser == undefined || currentUser.cdn.allow == false) return res.status(401).json({ error: "You're not allowed to use cdn." })

    await Cdn.find({
        userId: currentUser.id
    }).then((data) => {
        res.json(data)
    })
});


router.post('/files', async (req, res) => {
    let token = req.body.token || req.header("Authorization");

    if (token == undefined) return res.status(401).json({ error: "No token was provided." })

    const currentUser = await User.findOne({
        'cdn.token': token
    })

    if (currentUser == undefined || currentUser.cdn.allow == false) return res.status(401).json({ error: "You're not allowed to use cdn." })
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).json({ error: 'No files were uploaded.' });

    let uploadFile = req.files.uploadFile;
    let re = /(?:\.([^.]+))?$/;
    let ext = re.exec(uploadFile.name)[1];  
    const fileId = shortId.generate(); 
    let url, file;
    if (ext == undefined){
        file = fileId;
        url = 'http://' + req.get('host') + '/' + file;
    } else {
        file = fileId + '.' + ext;
        url = 'http://' + req.get('host') + '/' + file;
    }
    uploadFile.mv('./cdn/' + file , async (err) => {
        if (err) return res.status(500).json({ error: err }); 
        new Cdn({
            userId: currentUser.id,
            fileName: uploadFile.name,
            fileUrl: file
        }).save().then(() => {
            let response = currentUser.name + ' uploaded a file! Link: ' + url;

            if (req.accepts('json')) {
                res.json({ success: true, url})
                return;
            }
                
            res.type('txt').send(`{ "success" : true, "url" : "${url}" }`);
            
            console.log(response);
        })
    });
});
  
router.delete('/files', async (req, res) => {
    let token = req.body.token || req.header("Authorization");

    if (token == undefined) return res.status(401).json({ error: "No token was provided."})

    let dbUser = await User.findOne({
        'cdn.token': token
    });

    if (dbUser == undefined || dbUser.cdn.allow == false) return res.status(401).json({ error:"You're not allowed to use cdn."})

    let file = await req.body.fileUrl;
    
    let fileInDb = await Cdn.findOne({
        userId: dbUser.id,
        fileUrl: file
    })

    if (!fileInDb) return res.status(404).json({error: "File not found."});
    fs.unlink('./cdn/' + file, async (err) => {
        if (err) {
            console.error(err)
            return
        }
        Cdn.deleteOne({
            fileUrl: file
        }).exec().then(() => {
            res.json({ success: true, deletedUrl: file })
        })
    })
})

module.exports = router
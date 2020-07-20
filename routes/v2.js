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

    if (currentUser == undefined || currentUser.cdn.allow == false) return res.status(401).json({ error: "You're not allowed to upload."})
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).json({ error: "No files were uploaded." } );

    let sampleFile = req.files.sampleFile;
    let re = /(?:\.([^.]+))?$/;
    let ext = re.exec(sampleFile.name)[1];  
    const fileId = shortId.generate(); 
    let url, file;
    if (ext == undefined){
        file = fileId;
        url = 'http://' + req.get('host') + '/' + file;
    } else {
        file = fileId + '.' + ext;
        url = 'http://' + req.get('host') + '/' + file;
    }
    sampleFile.mv('./cdn/' + file , function(err) {
        if (err) return res.status(500).send(err); 
        let response = currentUser.name + ' uploaded a file! Link: ' + url;
    	await User.updateOne({
        	'cdn.token': token
    	}, {
        	$push: { 'cdn.files' : {fileName: sampleFile.name, fileLink: url} }
    	}).exec()
        res.json({ succes: true, url })
        console.log(response);
    });


});
  
router.post('/delete', async (req, res) => {
    let token = req.header("ApiToken");

    if (token == undefined) return res.status(401).json({error: "No token was provided."})

    let dbUser = await User.findOne({
        'cdn.token': token
    });

    let file = req.query.fileUrl;

    if (file == undefined) return res.send(404).json({ error: "No files url was listed." })

    file = decodeURIComponent(file);
    let parts = file.split('/');
    let lastSegment = parts.pop() || parts.pop();

    if (search(file, dbUser.cdn.files) == false) return res.status(404).json({ error: });
    fs.unlink('./cdn/' + lastSegment, (err) => {
        if (err) {
            console.error(err)
            return
        }
        
        
        await User.updateOne({
                'cdn.token': token
            }, {
                $pull: { 'cdn.files': { fileLink: file } }
        }).exec();
	console.log('Removed: ' + lastSegment);
	res.json({ succes: true });
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
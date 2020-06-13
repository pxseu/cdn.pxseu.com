const port = 8000

const favicon = require('serve-favicon')
const express = require('express')
const path = require('path')

const app = express()

app.use(favicon(__dirname + '/www/images/favicon.ico'));

app.use((req, res) =>{
    res.sendFile(__dirname + '/cdn' + req.url, (err) => {
        if (err){
          res.sendStatus(404)
        }
      })  
})


app.listen(port, ()=> {
    console.log('Listening on port: ' + port)
})

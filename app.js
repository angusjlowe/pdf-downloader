var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var routes = require('./routes');
var path = require('path');

app.set('view engine', 'ejs');

app.get('/', routes.home);

app.post('/pdf_download', routes.pdf_download);
app.get('/zip_download', routes.zip_download);
app.listen(3000);
console.log("Listening at port 3000");

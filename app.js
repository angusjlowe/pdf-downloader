var express = require('express');
var app = express();

var routes = require('./routes');
var path = require('path');

app.set('view engine', 'ejs');

app.get('/', routes.home);

app.get('/pdf_download/', routes.pdf_download);
app.listen(3000);
console.log("Listening at port 3000");
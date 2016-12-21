//functionality to add: 
//1) customizable url address file format
//2) add files to zip folder
//3) allow get request from client to download zip folder
//4) overwrite zip folder each time app is used
var request = require("request");
var fs = require("fs");
var cheerio = require('cheerio');
var neDB = require('nedb');

var db = new neDB({
    filename: 'my.db',
    autoload: true
});

var url;


var download_pdfs = function(counter, items) {
    if(counter < 0) {
        db.remove({}, { multi: true }, function (err,numRemoved) {
            db.loadDatabase(function (err) {
                // done
            });
        });
        console.log("All finished");
    } else {
        console.log("\nrequesting download\n");
        var link = items[counter].href;
        if(!link.includes("http") && !link.includes("www")) {
            link = url + link;
        }
        var name = items[counter].name;
        name = name.replace(/(\r\n|\n|\r)/gm,"");

        var options = {
            uri: link,
            method: "GET"
        };

        var callback = function(error, response, body) {
            console.log("Getting pdf from " + link);
        };

        request(options, callback).pipe(fs.createWriteStream("./downloads/" + name + (items.length - counter) + ".pdf"))
        .on('finish', function() {
            download_pdfs(counter-1, items);
         });
    }
}

var main = function() {
    var items = [];
    var counter = 0;
    db.find({}, function(err,docs) {
        counter = docs.length - 1;
        download_pdfs(counter, docs)
    });
}

exports.pdf_download = function(req,res) {
    res.render("home", {});
    url = "http://www.inf.ed.ac.uk/teaching/courses/inf2c-se/";
    request(url, function(error,response,html) {
    var $ = cheerio.load(html); // html is the raw response string : "<html><head>.."
    var data = [];
    $("a") // find every <a> in this html
        .filter(function() {
            var attr = $(this).attr("href");
            var str = String(attr);
            return str.includes("pdf");
        }).each(function() {
            var name = $(this).text(); // grab the name of the link
            var href = $(this).attr("href"); //grab the link anchor href
            data.push({ "name": name, "href": href});
        });
        
    console.log(data);
    db.insert(data)
    console.log("Links saved to database");
    main();
    });



};

exports.home = function(req,res) {
    res.render("home", {});
};
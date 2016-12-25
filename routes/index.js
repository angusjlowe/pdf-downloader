//functionality to add:
//1) customizable url address _/
//2) add files to zip folder
//3) allow get request from client to download zip folder
//4) overwrite zip folder each time app is used
//5) customizable file format
//6) allow for img downloading capability
var request = require("request");
var fs = require("fs");
var cheerio = require('cheerio');
var neDB = require('nedb');
var zip = new require('node-zip')();

var db = new neDB({
    filename: 'my.db',
    autoload: true
});

var url;

//pretty ad hoc formatting based on what was encountered in testing
var formatURL = function(url) {
    var finalFewChars = url.substr(url.length-4);
    if(finalFewChars == "html") {
        url = url.split("/");
        url.pop();
        url = url.join("/");
    }
    var finalChar = url.substr(url.length-1);
    if(finalChar != "/") {
        url += "/";
    }
    return url;
}

var formatLink = function(link) {
    if(link.includes("./")) {
        link = link.substr(2);
    }
    if(link.substr(0,1) == "/") {
        link = link.substr(1);
    }
    if(!link.includes("http") && !link.includes("www")) {
        link = url + link;
    }
    return link;
}


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
        //if last url character isn't /, add it, and check for http://www
        link = formatLink(link);

        var options = {
            uri: link,
            method: "GET"
        };
        var callback = function(error, response, body) {
            console.log("Getting pdf from " + link);
        };

        //make the download request and pipe to filestream
        var newReq;
        try {
           newReq = request(options, callback).pipe(fs.createWriteStream("./downloads/" + (items.length - counter) + ".pdf"));
        }
        finally {
            newReq.on('finish', function() {
                download_pdfs(counter-1, items);
            });
        }
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
    var link = req.body.link;
    res.render("waiting_screen", {
        link: link
    });
    url = link;
    request(url, function(error,response,html) {
        url = formatURL(url);
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
    //check if in use
    var isEmpty = false;
    db.find({}, function(err, docs) {
        if(docs.length == 0) {
            isEmpty = true;
        }
        console.log("Length of database: " + docs.length);
        if(isEmpty) {
            res.render("home", {});
            //reload database upon each refresh to ensure valid state
            db.remove({}, { multi: true }, function (err,numRemoved) {
                db.loadDatabase(function (err) {
                    // done
                });
            });
        } else {
            res.send("Sorry we're busy, please try again later");
        }
    });
};

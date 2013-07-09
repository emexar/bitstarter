#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var sys = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    //console.log(''+fs.readFileSync(htmlfile)); // use '' to convert buffer automatically
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    //console.log('outFile = '+out);
    return out;
};

var checkUrl = function(url, checksfile) {
    var htmlurl = rest.get(url).on('complete', function(result) {
      if (result instanceof Error) {
        sys.puts('Error: ' + result.message + '. Request Aborted');
        //this.retry(5000); // try again after 5 sec
      } else {
          $ = cheerio.load(result);
          var checks = loadChecks(checksfile).sort();
          var out = {};
          for(var ii in checks) {
              var present = $(checks[ii]).length > 0;
              out[checks[ii]] = present;
          }
          //console.log('outUrl = '+out);
          return console.log(JSON.stringify(out, null, 4));
      }
    });
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        // option('f, --file ', 'comment', functionX, DefaultValue_if_functionX_is_none)
        .option('-f, --file <html_file>', 'Local Path to index.html', clone(assertFileExists))
        .option('-u, --url <url>', 'Valid website url')
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
    //console.log('program.url : '+program.url+'\nprogram.file : '+program.file+'\n\nHTMLFILE_DEFAULT :'+HTMLFILE_DEFAULT);
    if (program.file && program.url) {
        console.log('Either use option -f or -u, not both');
    } else {
        // console.log('\n\nUsing <check_file> : '+program.checks);
        if (program.url)  
            var checkJson = checkUrl(program.url, program.checks);
        else { 
            var checkJson = checkHtmlFile(program.file, program.checks); 
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        }
    }    
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

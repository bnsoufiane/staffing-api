var page = require('webpage').create(),
  system = require('system'), address;

page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:42.0) Gecko/20100101 Firefox/42.0';
page.settings.loadImages = false;

if (system.args.length === 1) {
  console.log('Usage: angel-phantomjs.js <some URL>');
  phantom.exit();
}
address = system.args[1];

page.open(address, function(status) {
  if(status === "success") {
    page.onLoadFinished = function(){
      console.log(page.content); // actual page
      phantom.exit();
      return page;
    };
    setTimeout(function() {
      console.log(page.content); // actual page
      phantom.exit();
      return page;
    }, 5000);
  } else {
    phantom.exit();
    return status;
  }

});

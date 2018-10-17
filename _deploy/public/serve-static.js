var express = require('express')
var path = require('path')
var serveStatic = require('serve-static')

var app = express()

var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
 
// Don't redirect if the hostname is `localhost:port` or the route is `/insecure`
app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));

app.use(serveStatic(__dirname, {
    maxAge: '30d',
    setHeaders: setCustomCacheControl
}))

var port = process.env.PORT || 5000;

app.listen(port, function() {
    console.log('Application Running at http://localhost:' + port);
});

function setCustomCacheControl(res, path) {
    //   console.log('Res Mime: ', serveStatic.mime.lookup(path))
    if (serveStatic.mime.lookup(path) === 'text/html') {
        res.setHeader('Cache-Control', 'public, max-age=0')
    }
}
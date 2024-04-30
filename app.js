// AWS Rekog API demo

// load the express framework

var express = require('express')
var app = express()
var port = process.env.PORT || 3000
require('dotenv').config()


app.use(express.json());

// configure assets and views
app.use('/assets', express.static(__dirname + '/public'));
app.use( express.static(__dirname + '/images'));
app.use( express.static(__dirname + '/public'));
app.use( express.static(__dirname + '/extracted'));
app.use( express.static(__dirname + '/productsImages'));
app.use( express.static(__dirname + '/temp'));
app.use(express.static(__dirname + 'views/partials'));

// Error handler middleware
app.use((err, req, res, next) => {
    // Log the error
    console.error(err);
    // Send a 500 status code and a generic error message
    res.status(500).send('Server Error');
});  
  


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// load the controller
var rekogController = require('./controllers/rekogController');

rekogController(app);

// Start server.
console.log('Node server listening on port', port);

app.listen(port);

// done -eol

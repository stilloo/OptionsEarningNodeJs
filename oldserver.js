var express = require('express');

var services = require('./routes/services'); 
 
var app = express();

var util = require('util'),
connect = require('connect'),
connectRoute = require('connect-route'),
port=8080;

var server = connect.createServer(connect.static(__dirname));
 
server.use(connectRoute(function(app) {
    app.get('/', function(req, res) {
    res.send([{name:'2014-03'}, {name:'2014-04'}]);
});

app.get('/getTimeFrames/:ticker', services.findById);

app.get('/getOptionChain/:ticker/:expiration', services.getOptionChain);

app.post('/getPnL', services.getPnL);

//app.use(express.json());
//app.use(express.urlencoded());
}));


server.listen(port);
util.puts('Listening on ' + port + '...');

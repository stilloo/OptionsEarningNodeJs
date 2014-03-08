var express = require('express');

var services = require('./routes/services');
var app = express();

var util = require('util'),
port=8080;


app.get('/', function(req, res) {
    res.send([{name:'2014-03'}, {name:'2014-04'}]);
});

app.get('/index', services.findById);

app.get('/getStockPrice/:ticker', services.findByPrice);

app.get('/getTimeFrames/:ticker', services.findById);

app.get('/getOptionChain/:ticker/:expiration', services.getOptionChain);

app.post('/getPnL', services.getPnL);

app.use(express.json());
app.use(express.urlencoded());

app.use(express.static(__dirname));

app.listen(port);
util.puts('Listening on ' + port + '...');

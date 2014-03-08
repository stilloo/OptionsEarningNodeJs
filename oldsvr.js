
var YQL=require('/home/ec2-user/node_modules/yqlp/lib/yql');
var util=require('util');

exports.findById = function(req, res) {
YQL.exec(" SELECT contract FROM yahoo.finance.option_contracts WHERE symbol='"+req.params.ticker+"'", function(error, response) {
    if (error) {
            console.log('Ut oh! Example #1 has messed up:', error);
                } else {
                        var results = response.query.results;
    res.send({"expirations":results});
}
});
};

exports.getAllStrikePrices  = function(req, res) {
YQL.exec(" SELECT contract FROM yahoo.finance.option_contracts WHERE symbol='"+req.params.ticker+"' and contract='"+expiration+"'", function(error, response) {
    if (error) {
            console.log('Ut oh! Example #1 has messed up:', error);
                } else {
                        var results = response.query.results;
    res.send({"expirations":results});
}
});
};

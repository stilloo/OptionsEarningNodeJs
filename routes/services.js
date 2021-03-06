
var YQL=require('yqlp/lib/yql');
var util=require('util');
var http = require('http');

exports.findByPrice= function(req, res) {
    var options = {
      host: "localhost",
      port: 8090,
      path: "/optionsservice/webapi/optionsresource/quotes/"+req.params.ticker,
      method: 'GET'
    };
var responseString = '';
    http.request(options, function(response) {
     
      response.on('data', function (chunk) {
            responseString+=chunk;
           console.log(responseString);
           var responseObject = JSON.parse(responseString);
        res.send({"stockPrice":responseObject});
      });
    }).end();

  
};

exports.findById = function(req, res) {
    var options = {
      host: "localhost",
      port: 8090,
      path: "/optionsservice/webapi/optionsresource/expirations/"+req.params.ticker,
      method: 'GET'
    };
var responseString = '';
    http.request(options, function(response) {
     
      response.on('data', function (chunk) {
            responseString+=chunk;
           console.log(responseString);
           var responseObject = JSON.parse(responseString);
        res.send({"expirations":responseObject});
      });
    }).end();

};

exports.getOptionChain  = function(req, res) {
    var options = {
      host: "localhost",
      port: 8090,
      path: "/optionsservice/webapi/optionsresource/optionschain/"+req.params.ticker+"/"+req.params.expiration,
      method: 'GET'
    };
var responseString = '';
    http.request(options, function(response) {
     
      response.on('data', function (chunk) {
            responseString+=chunk;
           console.log(responseString);
           var responseObject = JSON.parse(responseString);
        res.send({"chain":responseObject});
      });
    }).end();

};

function OptionsModel (ticker,strikePrice, optionPremium, optionType, optionDate, transactionType, contracts) {
    
 this.ticker = ticker; 
 this.strikePrice=strikePrice;
 this.optionPremium=optionPremium;
 this.optionType =optionType;
 this,optionDate = optionDate;
 this.transactionType=transactionType;
 this.contracts=contracts;
 
}

var optionModelList = new Array();

var pnlProfitLossMap = {};

exports.getPnL  = function(req, res) {
/* 
 * {
 *"options":[ 
 * { 
 *  "option":
 *  { 
 *    "ticker":"aapl",
 *    "stockPrice":550,
 *    "strike":600,
 *    "expiration":"2014-04",
 *    "price":20,
 *    "type":"C",
 *    "transactionType":"BUY",
 *    "contracts":1
 *   }
 * }
 */
    pnlProfitLossMap = {};
    optionModelList = new Array();
    var content = '';
    var stockPrice=0;
    var minStrike=100000;
    var maxStrike=0;
    var data;
       req.on('data', function (data) {
          // Append data.
                 content += data;
       });
          
       req.on('end', function () {
        // Assuming, we're receiving JSON, parse the string into a JSON object to return.
        data = JSON.parse(content);
        //console.log(data.options.length);
        //for(var i=0;i<data.options.length;i++){
         //var opt = data.options[i].option;
          var opt=data;
          var expiryDate=null;
          var ticker=null;
          var strike=null;
          var price=null;
          var type=null;
          var transactionType=null;
          var contracts=null;

          for (var key in opt){
            
            //console.log("key " +key);
            if(key.match("^stockPrice"))
            {
                stockPrice = +opt.stockPrice;   
            }
            else if(key.match("^expiration"))
            {
                 expiryDate=opt[key];
            }
            else if(key.match("^ticker"))
            {
                ticker=opt.ticker;
            }
            else if(key.match("^strike"))
            {
                strike= +opt[key];
            }
            else if(key.match("^premium"))
            {
                price= +opt[key];
            }
            else if(key.match("^type"))
            {
                type=opt[key];
            }
            else if(key.match("^transaction"))
            {
                transactionType=opt[key];
            }
            else if(key.match("^contracts"))
            {
                contracts= +opt[key];
            }
            if(strike !=null && strike < minStrike)
                 minStrike=strike;
            if(strike !=null && strike > maxStrike)
                  maxStrike=strike;
              //populate object
              if(ticker !=null && strike !=null && price!=null && type !=null && expiryDate !=null && transactionType !=null && contracts !=null)
              {
                  console.log(strike);
                  console.log(price);
                  console.log(type);
                  console.log(expiryDate);
                  console.log(transactionType);
                  console.log(contracts);
                  for(var j=0;j<contracts;j++)
                  {
                    optionModelList.push(new OptionsModel(ticker,strike,price,type,expiryDate,transactionType,contracts));
                  }
                  console.log(ticker);
                  expiryDate=null;
                  strike=null;
                  price=null;
                  type=null;
                  transactionType=null;
                  contracts=null;
             }
        }
         
        
         
        //}
        
        //ok option model has the list of objects now
        if(maxStrike < stockPrice) maxStrike=stockPrice;
        //ok lets calculate profit
        var minPrice = minStrike/2;
        console.log("minPrice "+minPrice);
        console.log("maxStrike "+maxStrike);
         console.log("minStrike "+minStrike);
        var maxPrice = +maxStrike + +minPrice;
        console.log("maxPrice "+maxPrice);
        var max=0,min=0;

        console.log(minPrice);
        console.log(maxPrice);
	   for(var i = minPrice; i <maxPrice;i=i+2)
        {


            var pnl = populateModelToPlot(i);
            if(pnl < min) min = pnl;
            if(pnl > max) max = pnl;

        }
      //  console.log(pnlProfitLossMap);
        var responseArr = [];
        for (var key in pnlProfitLossMap) {
          var value = pnlProfitLossMap[key];
          var rowArr = new Array();
          rowArr.push(key);
          rowArr.push(value);
          responseArr.push(rowArr);
        }
        console.log(responseArr);
        res.send(responseArr);
      });
 
 };
 
function populateModelToPlot(stockPriceAtExpiration)
{
    var pnlList = calculatePnL(stockPriceAtExpiration);
    //add all pnl for this stockPrice
    var sum = 0 ;
    for(var i =0;i<pnlList.length;i++)
    {
        pnl=pnlList[i];
        sum+=pnl;
    }

    //System.out.println("Sum is "+sum);
    //console.log("Adding ["+stockPriceAtExpiration+"] , "+sum);
    pnlProfitLossMap[stockPriceAtExpiration]=Math.floor(sum);
    return sum;
}

function calculatePnL(stockPriceAtExpiration)
{

    var pnlList = new Array();

    for(var i=0;i<optionModelList.length;i++)
    {
        var model=optionModelList[i];
        var pnl = 0;
        var isProfit = false;
        if(model.optionType == "C" && model.transactionType == "BUY")
            {
                //ok its call option
                var profitableStockPrice = model.strikePrice + +model.optionPremium;

                if(stockPriceAtExpiration < profitableStockPrice)
                {
                    if(stockPriceAtExpiration < model.strikePrice)
                    {
                        //max loss is option premium
                        pnl = +model.optionPremium*100;
                    }
                    else
                    {
                        pnl = (profitableStockPrice - stockPriceAtExpiration) * 100;
                    }
                }
                else if(stockPriceAtExpiration == profitableStockPrice)
                {
                    //System.out.println("There is no profit or loss, its break even");
                }
                else
                {
                    pnl = (stockPriceAtExpiration - profitableStockPrice)*100;
                    //System.out.println("There is a profit of "+pnl);
                    isProfit=true;
                }

            }
            else if(model.optionType == "C" && model.transactionType == "SELL")
            {
                //ok its call option

                var lossStockPrice = model.strikePrice + model.optionPremium;

                if(stockPriceAtExpiration < lossStockPrice)
                {
                    if(stockPriceAtExpiration < model.strikePrice)
                    {
                        pnl = model.optionPremium * 100;
                    }
                    else
                    {
                        pnl = (lossStockPrice - stockPriceAtExpiration) * 100;
                    }
                    //System.out.println("There is a profit of "+ pnl);
                    isProfit=true;

                }
                else if(stockPriceAtExpiration == lossStockPrice)
                {
                    //System.out.println("There is no profit or loss, its break even");
                }
                else
                {
                    pnl = (stockPriceAtExpiration - lossStockPrice)*100;
                    //System.out.println("There is a loss of "+pnl);

                }
            }
            else if(model.optionType == "P" && model.transactionType == "BUY")
            {
                //ok its put option
                var profitableStockPrice = model.strikePrice - model.optionPremium;

                if(stockPriceAtExpiration < profitableStockPrice)
                {
                    pnl = (profitableStockPrice - stockPriceAtExpiration) * 100;
                    //System.out.println("There is a profit of "+ pnl);
                    isProfit=true;

                }
                else if(stockPriceAtExpiration == profitableStockPrice)
                {
                    //System.out.println("There is no profit or loss, its break even");
                }
                else
                {
                    if(stockPriceAtExpiration < model.strikePrice)
                    {
                            pnl = (stockPriceAtExpiration - (model.strikePrice - model.optionPremium) ) * 100;
                    }
                    else
                    {
                            pnl = model.optionPremium * 100;
                    }
                    //System.out.println("There is a loss of "+pnl);

                }
            }
            else if(model.optionType == "P" && model.transactionType == "SELL")
            {
                    //ok its put option
                var profitableStockPrice = model.strikePrice - model.optionPremium;

                if(stockPriceAtExpiration < profitableStockPrice)
                {
                    pnl = (profitableStockPrice - stockPriceAtExpiration) * 100;
                    //System.out.println("There is a loss of "+ pnl);

                }
                else if(stockPriceAtExpiration == profitableStockPrice)
                {
                    //System.out.println("There is no profit or loss, its break even");
                }
                else
                {
                    if(stockPriceAtExpiration < model.strikePrice)
                    {
                        pnl = (stockPriceAtExpiration - (model.strikePrice - model.optionPremium) ) * 100;
                    }
                    else
                    {
                        pnl = model.optionPremium * 100;
                    }
                    //System.out.println("There is a profit of "+pnl);
                    isProfit=true;

                }
            }
            if(!isProfit)
            {
                pnlList.push(-1*pnl);
            }
            else
            {
                pnlList.push(pnl);
            }

    }
    return pnlList;


}

 
function getInvestment()
{
    var investment = 0.0;
    for(var i=0;i<optionModelList.length;i++)
    {
        var model=optionModelList[i];
        if(model.optionType == "C" && model.transactionType == "BUY")
        {
            //ok its call option
            if(model.contracts > 0)
            {
                    investment+=model.contracts * model.optionPremium;
            }
            else
            {
                    investment+=model.optionPremium;
            }

        }
        else if(model.optionType == "C" && model.transactionType == "SELL")
        {
            if(model.contracts > 0)
            {
                    investment-=model.contracts * model.optionPremium;
            }
            else
            {
                    investment-=model.optionPremium;	
            }

        }
        else if(model.optionType == "P" && model.transactionType=="BUY")
        {
            if(model.contracts > 0)
            {
                    investment+=model.contracts * model.optionPremium;
            }
            else
            {
                    investment+=model.optionPremium;
            } 

        }
        else if(model.optionType=="P" && model.transactionType=="SELL")
        {
                if(model.contracts > 0)
                {
                        investment-=model.contracts * model.optionPremium;
                }
                else
                {
                        investment-=model.optionPremium;
                }
        }
        }
        return investment*100;
}




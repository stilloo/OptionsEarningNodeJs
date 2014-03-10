
var YQL=require('yqlp/lib/yql');
var util=require('util');

exports.findByPrice= function(req, res) {
  YQL.exec(" SELECT * FROM yahoo.finance.quotes WHERE symbol='"+req.params.ticker+"'", function(error, response) {
        if (error) {
                console.log('Ut oh! Example #1 has messed up:', error);
        } else {
               // console.log(response);
                var quote = response.query.results.quote.Ask;
                if(quote == null || quote == '')
                {
                    quote = response.query.results.quote.AskRealtime;
                
                    if(quote == null || quote == 0.00 || quote == '' || quote == 0)
                        {
                        quote = response.query.results.quote.LastTradePriceOnly;
                        }
                }
                res.send({"stockPrice":quote});
    }
    });
};

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

exports.getOptionChain  = function(req, res) {
    YQL.exec(" SELECT * FROM yahoo.finance.options WHERE symbol='"+req.params.ticker+"' and expiration='"+req.params.expiration+"'", function(error, response) {
        if (error) {
                console.log('Ut oh! Example #1 has messed up:', error);
                    } else {
                            var results = response.query.results;
        res.send({"chain":results});
    }
    });
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
         stockPrice = +opt.stockPrice;
         var ticker = opt.ticker;
         var strike = +opt.strike_1;
         var price = +opt.premium_1;
         var type = opt.type_1;
         var expiryDate=opt.expiration_1;
         var transactionType = opt.transaction_1;
         var contracts = +opt.contracts_1;
         if(strike < minStrike)
            minStrike=strike;
	      if(strike > maxStrike)
	        maxStrike=strike;
         //populate object
         optionModelList.push(new OptionsModel(ticker,strike,price,type,expiryDate,transactionType,contracts));
         console.log(ticker);
        //}
        
        //ok option model has the list of objects now
       
        if(maxStrike < stockPrice) maxStrike=stockPrice;
        //ok lets calculate profit
        var minPrice = minStrike/2;
        console.log("minPrice "+minPrice);
        console.log("maxStrike "+maxStrike);
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




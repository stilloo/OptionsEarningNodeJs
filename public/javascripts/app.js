'use strict';

$.extend({
      postJSON: function(params) {
          return jQuery.ajax(jQuery.extend(params, {
              type: 'POST',
              data: params.data,
              dataType: 'json',
              contentType: 'application/json',
              processData: false
          }));
      }
  });
  

 $.fn.serializeObject = function(){
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
 };

var expirationsArray = [];
$(document).on('ready', function(){

  var appInstance = app();
  appInstance.init();

});




var app = function(){

  return {
      init: function(){

          $('#gobutton').click(function(event) {
                  event.preventDefault();
                  console.log('came here');
                  console.log($('#ticker').val());
                  $.getJSON( 'getTimeFrames/' + $('#ticker').val(), function( data ) {
                    //now populate expiration with this data
                    $(data.expirations.expirations).each(function()
                    {
                          //this refers to the current item being iterated over
                         var option = $('<option />');
                         console.log(this.expiration);
                         option.attr('value', this.expiration).text(this.displayText);
                         expirationsArray.push(this.expiration);
                         $('#expiration_0').append(option);
                   });

                   
                   /*
                    $.postJSON({
                        url: '/getTimeFrames',
                        data: { val1: this.input1.value, val2: this.input2.value },
                        success: function(json) {
                            alert(JSON.stringify(json));
                        },
                        error: function(err) {
                            alert(err.responseText);
                        }
                    });
                    */
                   // return true;
          });

            $.getJSON( 'getStockPrice/' + $('#ticker').val(), function( data ) {
              console.log(data);
              $('#stockPrice').val(data.stockPrice.price);
            });
            return true;
          });
        
          var strikePremium = {};

         $('#positionsTable').undelegate('.expiration').delegate('.expiration', 'change', function() {
          // do your processing here
             var thisType = $(this).closest('.tr_clone').find('.type').children().first().val();
             var strikeRef = $(this).closest('.tr_clone').find('.strike').children().first();
             var thisExpiration=$(this).attr('value');
             var premiumRef = $(this).closest('.tr_clone').find('.premium').children().first();
             //var symbolRef = $(this).closest('.tr_clone').find('.symbol').children().first();

             strikeRef.html("<option value=\"\">-----</option>");
             //symbolRef.html("<option value=\"\">-----</option>");
             premiumRef.val('');
             //console.log(thisType);
             //symbolRef.prop('disabled','disabled');
             strikeRef.prop('disabled', 'disabled');
             $.getJSON( "getOptionChain/"+$('#ticker').val()+"/"+$(this).attr('value'), function( data ) {
                  console.log(data);
                 // symbolRef.removeAttr('disabled');
                  strikeRef.removeAttr('disabled');  
                  var symbolYrMoDayArr = new Array();
                  //var ticker = data.chain.optionsChain.symbol;
                  var strikeArr = new Array();
                  
                  $.each(data.chain, function(key,value) {
                    
                       $(value.optionsChain).each(function()
                       {
                        if(value.type == thisType ) {
                           var option = $('<option />');
                            option.attr('value', this.strike).text(this.strike);
                           strikeRef.append(option);
                          }
                          strikePremium[thisExpiration+value.type+this.strike] = this.premium;
                          //premiumRef.val(this.premium);
                     // var symbol = this.symbol; //AAPL140419C00225000
                     // var symbolYrMoDay = symbol.substring(ticker.length,ticker.length+6);
                     // var symbolType = symbol.substring(ticker.length+6,ticker.length+7);
                     // console.log("symbolType "+symbolType);
                     // if(symbolType == thisType )
                     // {
                     //   if(symbolYrMoDayArr[symbolYrMoDay] != symbolYrMoDay)
                     //   {
                     //     symbolYrMoDayArr[symbolYrMoDay]=symbolYrMoDay;
                     //     if (symbol.toLowerCase().indexOf(ticker+"7") == -1)
                     //      {
                     //        //symbol is not mini option
                     //        //lets get expiration
                     //        var option = $('<option />');
                     //        option.attr('value', symbolYrMoDay).text(symbolYrMoDay);
                     //        symbolRef.append(option);
                     //       }
                     //     }
                     //  }
                       //console.log(symbol.substring(ticker.length,ticker.length+6));
                       //strikePremium[symbolYrMoDay+thisExpiration+this.type+this.strikePrice] = this.lastPrice; 
                 });
                      
                    
                  });
                 

              });
              return false;
         });
         
          $('#positionsTable').undelegate('.type').delegate('.type', 'change', function() {
          // do your processing here
              var thisType = $(this).attr('value');
              var thisExpiration = $(this).closest('.tr_clone').find('.expiration').children().first().val();
              var strikeRef = $(this).closest('.tr_clone').find('.strike').children().first();
              var premiumRef = $(this).closest('.tr_clone').find('.premium').children().first();
            //  var symbolRef = $(this).closest('.tr_clone').find('.symbol').children().first();

            //  //console.log(thisType);
            //  symbolRef.prop('disabled','disabled');
              strikeRef.prop('disabled', 'disabled');
              if(thisExpiration == "" || thisType == "")
              {
                 if(strikeRef.val() !="")
                 {
                   strikeRef.val("");
                 }
                 premiumRef.val("");
                 return false;
              }

              if(strikeRef.val() != "")
             {
             //   var symbolYrMoDay = symbolRef.val();
                var premium = strikePremium[thisExpiration+thisType+strikeRef.val()];
                premiumRef.val(premium);   
            //    symbolRef.removeAttr('disabled');  
                strikeRef.removeAttr('disabled');  
                return false;
              }
            
              $.getJSON( "getOptionChain/"+$('#ticker').val()+"/"+thisExpiration, function( data ) {
            //       console.log(data);
            //       symbolRef.removeAttr('disabled');  
                   strikeRef.removeAttr('disabled');  
            //       var ticker = data.chain.optionsChain.symbol;
            //       var symbolYrMoDayArr = new Array();
                  var strikeArr = new Array();

                  $.each(data.chain, function(key,value) {
                    if(value.type == thisType ) {
                       $(value.optionsChain).each(function()
                       {
                     
                          var option = $('<option />');
                          option.attr('value', this.strike).text(this.strike);
                          strikeRef.append(option);
                          strikePremium[thisExpiration+value.type+this.strike] = this.premium;
                      });
                      
                    }
                     });
                   //$(data.chain.optionsChain.option).each(function()
            //       {
            //          //this refers to the current item being iterated over
            //          //alert($(this).parent().siblings('#addr_0').find('#type_0').val());
                  
            //          if(thisType == this.type)
            //          {
            //            if(strikeArr[this.strikePrice] != this.strikePrice)
            //             {
            //               strikeArr[this.strikePrice] = this.strikePrice;
            //               var option = $('<option />');
            //               option.attr('value', this.strikePrice).text(this.strikePrice);
            //               strikeRef.append(option);
            //             }
            //          }
            //          var symbol = this.symbol; //AAPL140419C00225000
            //          var symbolYrMoDay = symbol.substring(ticker.length,ticker.length+6);
            //           var symbolType = symbol.substring(ticker.length+6,ticker.length+7);
            //          console.log("symbolType "+symbolType);
            //          if(symbolType == thisType )
            //          {
            //            if(symbolYrMoDayArr[symbolYrMoDay] != symbolYrMoDay)
            //            {
            //              symbolYrMoDayArr[symbolYrMoDay]=symbolYrMoDay;
            //              if (symbol.toLowerCase().indexOf(ticker+"7") == -1)
            //               {
            //                 //symbol is not mini option
            //                 //lets get expiration
            //                 var option = $('<option />');
            //                 option.attr('value', symbolYrMoDay).text(symbolYrMoDay);
            //                 symbolRef.append(option);
            //                 //console.log(symbol.substring(ticker.length,ticker.length+6));
            //               }
            //            }
            //         }
            //          strikePremium[symbolYrMoDay+thisExpiration+this.type+this.strikePrice] = this.lastPrice; 
                     
                   
            //      });

               });
              return false;
         });

      
         $('#positionsTable').undelegate('.strike').delegate('.strike', 'change', function() {
            var thisType = $(this).closest('.tr_clone').find('.type').children().first().val();
            var premiumRef = $(this).closest('.tr_clone').find('.premium').children().first();
            var thisExpiration = $(this).closest('.tr_clone').find('.expiration').children().first().val();
            var ticker = $('#ticker').val();
          //  var symbolYrMoDay = symbolRefVal.substring(ticker.length,ticker.length+6);
            var premium = strikePremium[thisExpiration+thisType+$(this).attr('value')];
            premiumRef.val(premium);   
            return false;
          });


          $('#subbtn').click(function(event) {
                event.preventDefault();
                 var formdata = JSON.stringify($('form').serializeObject());
                 console.log(formdata);
                 $.postJSON({
                      url: 'getPnL',
                      data: formdata,
                      success: function(json) {
                          console.log(json);
                          //alert(JSON.stringify(json));
                          var g = new Dygraph(document.getElementById("graph"),
                       // For possible data formats, see http://dygraphs.com/data.html
                       json,
                       {
                           // options go here. See http://dygraphs.com/options.html
                           legend: 'always',
                           animatedZooms: true,
                           title: 'P&L Chart',
                           ylabel: 'Profit',
                           xlabel: 'Stock at Expiration'
                       });
                      },
                      error: function(err) {
                          alert(err.responseText);
                      }
                  });
          });
        

        var rowCounter=1;

       $("#addButton").click(function(){

              var $tr = $(this).closest('.tr_clone');
              var allTrs = $tr.closest('table').find('.tr_clone');
              var lastTr = allTrs[allTrs.length-1];
              var $clone = $(lastTr).clone();

              $clone.find('td').each(function(){
                  var el = $(this).find(':first-child');
                  var id = el.attr('id') || null;
                  console.log(id);
                  if(id) {
                      var i = id.substr(id.length-1);
                      var prefix = id.substr(0, (id.length-1));
                      el.attr('id', prefix+(+i+1));
                      el.attr('name', prefix+(+i+1));
                  }
              });

              $clone.find('input:text').val('');
              $clone.find('.strike').children().first().html("<option value=\"\">-----</option>");
              $clone.find('.addButton').hide();
              $tr.closest('table').append($clone);
          //$(this).closest('.addr0').clone().insertAfter(".addr0");
        /*
               $('#addr'+rowCounter).html("<td><select name='transaction_"+rowCounter+"' id='transaction_"+rowCounter+"' class='order-type'><option value=''>- -</option><option value='BUY'>Buy</option><option value='SELL'>Sell</option></select></td><td><input type='text' value='' name='contracts_"+rowCounter+"' id='contracts_"+rowCounter+"' style='width:100%;height:100%''> </td><td><select width='100%'' class='type osi-option-type' name='type_"+rowCounter+"' id='type_"+rowCounter+"' tabindex='8'><option>- -</option><option value='C'>Call</option><option value='P'>Put</option></select></td><td><select name='expiration_"+rowCounter+"' id='expiration_"+rowCounter+"' class='expiration' tabindex='9'><option value=''>-------</option></select></td><td><select width='100%' name='strike_"+rowCounter+"' id='strike_"+rowCounter+"' class='strike' tabindex='4'><option value=''>-----</option></td><td><input type='text' value='' name='premium_"+rowCounter+"' id='premium_"+rowCounter+"' style='width:100%;height:100%''></td><td></td>");
              $('#positionsTable').append('<tr id="addr'+(rowCounter+1)+'"></tr>');
              $('#expiration_'+(rowCounter-1).clone(true).appendTo('');
         
            for(var expirationsIndex=0; expirationsIndex < expirationsArray.length;expirationsIndex++)
            {
                 var option = $('<option />');
                 option.attr('value', expirationsArray[expirationsIndex]).text(expirationsArray[expirationsIndex]);
                 console.log(option);
              $('#expiration_'+rowCounter).append(option);
           
            }
            */
         
              rowCounter++; 
          });

          $('#positionsTable').undelegate('.deleteButton').delegate('.deleteButton', 'click', function() {
              var $tr = $(this).closest('.tr_clone');
              $tr.remove();
          });
      }
  } // return

}; // app

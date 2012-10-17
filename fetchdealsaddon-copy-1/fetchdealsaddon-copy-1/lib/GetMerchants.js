// GetMerchants.js - FetchDealsAddon's module
// author: laragam

// Import the APIs we need.
var request = require("request");
 
// Define the 'translate' function using Request
function GetMerchants(callback) {
  var req = request.Request({
    url: "http://raquel.dwalliance.com/fetchdeals/api_get_affiliates.php",
    onComplete: function (response) {
      
      callback(response.json);
      //console.log("Funcion")
    }
  });
  req.get();
  
}
 
// Export the 'GetMerchants' function
exports.GetMerchants = GetMerchants;
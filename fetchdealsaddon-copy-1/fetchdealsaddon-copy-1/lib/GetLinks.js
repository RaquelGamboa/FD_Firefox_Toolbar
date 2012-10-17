// GetLinks.js - FetchDealsAddon's module
// author: laragam

// Import the APIs we need.
var request = require("request");
 
// Define the 'translate' function using Request
function GetLinks(merchantURL,memberid,callback) {
  var req = request.Request({
    url: "http://raquel.dwalliance.com/fetchdeals/api_get_offerslink.php",
    content: {murl: merchantURL, mid: memberid},
    onComplete: function (response) {
      
      callback(response.json);
      //console.log("Funcion LINKS:"+response.text);
    }
  });
  req.get();
  
}
 
// Export the 'GetMerchants' function
exports.GetLinks = GetLinks;
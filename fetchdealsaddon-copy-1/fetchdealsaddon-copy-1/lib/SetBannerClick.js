// SetBannerClick.js - FetchDealsAddon (copy 1)'s module
// author: laragam

// Import the APIs we need.
var request = require("request"); 
// Define the 'translate' function using Request
function SetBannerClick(merchantid,memberid,callback) {
    console.log("ENTRO EN GET CLICK=" +merchantid +" "+memberid);
  var req = request.Request({
    url: "http://raquel.dwalliance.com/fetchdeals/api_set_bannerclick.php",
    content: {merid: merchantid, mid: memberid, from_addon:'y'},
    onComplete: function (response) {
      
      callback(response.text);

    }
  });
  req.get();
  
}
 
// Export the 'GetMerchants' function
exports.SetBannerClick = SetBannerClick;
// import the modules we need
var data = require('self').data;
var {Cc, Ci, Cr, Cu} = require('chrome');
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
//widget modules
var widgets = require("widget");
var tabs = require("tabs");
var self = require("self");
//
var {XPCOMUtils} = Cu.import("resource://gre/modules/XPCOMUtils.jsm");
 
var merchants = require("GetMerchants");
var link = require("GetLinks");
var bannerClick = require("SetBannerClick");

// exports.main is called when extension is installed or re-enabled
exports.main = function(options, callbacks) {
    var referralURL = "";
    var browserName = "";
    var hostName = "";
    var merchantsList = "";
    /*Creates the button in the Nav Toolbar*/
    addToolbarButton();
    
    
    tabs.on("ready", logURL);
 
    function logURL(tab) {
        
        
        tabAct = tabs.activeTab;
        
                
            console.log("Current URL="+tab.url);
            var tabActive = require("tabs").activeTab;
            tabActive.attach({
              contentScript: "self.postMessage(document.referrer);",
              onMessage: function(data)
              {
                referralURL = data;
              }
            });
            tabActive.attach({
              contentScript: "self.postMessage(navigator.userAgent);",
              onMessage: function(data)
              {
                browserName = data;
              }
            });
            
            
            tabActive.attach({
              contentScript: "self.postMessage(document.location.hostname);",
              onMessage: function(data)
              {
                hostURL = data;
                hostURL = hostURL.split(".")
                hostName=hostURL[hostURL.length -2]+"."+hostURL[hostURL.length -1];
                console.log("HOST NAME: "+hostName);
              }
            });
            
            /*Get list of merchants URL*/    
            merchants.GetMerchants(function(response) {
                    merchantsList = response;  
                    hostNameMd5 =  calcMD5(hostName);
                    console.log("HOST NAME:"+hostName+" MD5 "+ hostNameMd5);
                   
                   for (var i=0;i<merchantsList.length;i++){
                   
                                         
                      if (hostNameMd5.toString() == merchantsList[i][0].toString()){
                        console.log("MERCHANT IS IN THE LIST"+hostName);
                      
                        var merchantID = merchantsList[i][1];
                        var tbCookie = getCookie("www.fetchdeals.com", "tb");
                        var fuidCookie = getCookie("www.fetchdeals.com", "fuid");
                        
                        if (tbCookie[0] == 0 && fuidCookie[0] == 0 && hostName!="fetchdeals.com"){ //Redirect if not logged in
                            tabActive.url = "http://www.fetchdeals.com/";
                            tabs.open("http://www.fetchdeals.com/login.html");
                            
                        }else{
                            if(tbCookie[0] == 0){
                                tbCookie[0] = fuidCookie[0];
                            }
                            
                            postData(tbCookie[0], referralURL, tabAct.url, browserName);
                         
                             link.GetLinks(hostName,tbCookie[0], function(response){
                                redirectURL = response;
                                clickURL = redirectURL[0][0].toString();
                                NoAuto = redirectURL[0][1];
                                                               
                                console.log("REDIRECT LINK :" +NoAuto+" link: "+clickURL);
                                var hostNameCookie = new Array();
                                hostNameCookie = getCookie(hostName, "fdlr");
                                                               
                                var timeInSeconds = (new Date().getTime() / 1000);
                                console.log("FDLR: "+hostNameCookie[0]);
                                
                                if ((hostNameCookie[0]==1) && !(hostNameCookie[1]<timeInSeconds) ){
                                    tabActive.attach({
                                              contentScriptFile: [data.url("jquery-1.8.0.js"), data.url("banner.js")],
                                              contentScriptOptions: {
                                                merchantID: merchantID
                                              },
                                              onMessage: function(data){
                                                  console.log("Banner Congrats: "+data);
                                              }
                                        });
                                         setCookie(hostName, 2); // Banner 
                                        
                                }else{
                                    if ((hostNameCookie[0]==0)||(hostNameCookie[0]==3)||(hostNameCookie[1]<timeInSeconds)){
                                                                              
                                       if(NoAuto == 1){
                                            bannerClick.SetBannerClick(merchantID,tbCookie[0], function(response){
                                                console.log("SHOW SECOND BANNER RESPNSE:"+response);
                                                if (response =="Updated to 0"){ //banner one displayed and click
                                                    console.log("SHOW SECOND BANNER" + tbCookie[0]);
                                                    tabActive.attach({
                                                              contentScriptFile: [data.url("jquery-1.8.0.js"), data.url("bannerNoauto2.js")],
                                                              contentScriptOptions: {
                                                                merchantID: merchantID
                                                              },
                                                              onMessage: function(data){}
                                                        });
                                                        setCookie(hostName, 4);
                                                }else{
                                                         //show click banner
                                                       if(hostNameCookie[0]!=3) {
                                                            tabActive.attach({
                                                                  contentScriptFile: [data.url("jquery-1.8.0.js"), data.url("bannerNoauto.js")],
                                                                  contentScriptOptions: {
                                                                    merchantID: merchantID,
                                                                    memberID: tbCookie[0]
                                                                  },
                                                                  onMessage: function(data){}
                                                            });
                                                            //setCookie(hostName, 3);
                                                       }
                                                }
                                            } );     
                                                
                                        }else{
                                            
                                            console.log("Redireccionando");
                                            setCookie(hostName, 1); //Redirected 
                                            tabAct.url = clickURL;
                                           //show congrats banner
                                                      
                                            
                                        }
                                        
                                        
                                    }
                             }//else
                                //console.log("LOG:"+tabAct.url+" Ref:"+referralURL);
                                
                                
                             });  //get Links
                         
                        }//else 
                         
                         break;
                      } 
                   
                   }//for
                    
            });//getmerchants
    };
};
 
// exports.onUnload is called when Firefox starts and when the extension is disabled or uninstalled
exports.onUnload = function(reason) {
	removeToolbarButton();
	// do other stuff
};

 
// add our button
function addToolbarButton() {
	//this document is an XUL document
	var document = mediator.getMostRecentWindow('navigator:browser').document;		
	var navBar = document.getElementById('nav-bar');
	if (!navBar) {
		return;
	}
	var btn = document.createElement('toolbarbutton');	
	btn.setAttribute('id', 'fd_button');
	btn.setAttribute('type', 'menu-button');
	// the toolbarbutton-1 class makes it look like a traditional button
	btn.setAttribute('class', 'toolbarbutton-1');
	// the data.url is relative to the data folder
	btn.setAttribute('image', data.url('img/logo.jpg'));
	btn.setAttribute('title', 'fetchdeals.com');
	// this text will be shown when the toolbar is set to text or text and iconss
	btn.setAttribute('label', 'Fetch Deals');
	//btn.addEventListener('click', function() {
	//	 tabs.open("http://www.fetchdeals.com/");
	//}, false)
	navBar.appendChild(btn);
    
    
    var popupMenu = document.createElement('menupopup');
    //popupMenu.setAttibute('id', 'fd_menu');
    btn.appendChild(popupMenu);
    
    // TOP DEALS
    var menuItem = document.createElement("menuitem");
    menuItem.setAttribute("label","Top Deals");
    menuItem.addEventListener('click', function() {
         tabs.open("http://www.fetchdeals.com/");
    }, false)
    popupMenu.appendChild(menuItem);
    //Browse Stores
    menuItem = document.createElement("menuitem");
    menuItem.setAttribute("label","Browse Stores");
    menuItem.addEventListener('click', function() {
         tabs.open("http://www.fetchdeals.com/stores");
    }, false)
    popupMenu.appendChild(menuItem);
    //Browse Categories
    menuItem = document.createElement("menuitem");
    menuItem.setAttribute("label","Browse Categories");
    menuItem.addEventListener('click', function() {
         tabs.open("http://www.fetchdeals.com/category");
    }, false)
    popupMenu.appendChild(menuItem);
    //Print Coupons
    menuItem = document.createElement("menuitem");
    menuItem.setAttribute("label","Print Coupons");
    menuItem.addEventListener('click', function() {
         tabs.open("http://www.fetchdeals.com/coupon");
    }, false)
    popupMenu.appendChild(menuItem);
    //Help
    menuItem = document.createElement("menuitem");
    menuItem.setAttribute("label","Help");
    menuItem.addEventListener('click', function() {
         tabs.open("http://www.fetchdeals.com/toolbarfaq");
    }, false)
    popupMenu.appendChild(menuItem);
};
 
function removeToolbarButton() {
	// this document is an XUL document
	var document = mediator.getMostRecentWindow('navigator:browser').document;		
	var navBar = document.getElementById('nav-bar');
	var btn = document.getElementById('fd_button');
	if (navBar && btn) {
		navBar.removeChild(btn);
	}
};
function setCookie(url, redirected){
    var expSeconds = (new Date().getTime() / 1000)+86400;
    
    
    var cm = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2);
    cm.add(url, url, "fdlr", redirected, false, false, false, expSeconds);
    
};

function getCookie(url, cookieName){
    
    
    var cookieManager = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2);
    var cookieStr = cookieManager.getCookiesFromHost(url);
    
    var val = new Array();
    val[0]= 0;
    val[1]= 0;
    
    if (cookieStr==null){
    	val[0]= 0;
        val[1]= 0;
		
	}else{
        while (cookieStr.hasMoreElements()){
            var cookie = cookieStr.getNext();
            // looking for tb cookie value
            if ((cookie instanceof Ci.nsICookie) && (cookie.name==cookieName)){
                val[0] = cookie.value;
                val[1] = cookie.expires;
            }
        }
    }
    return val;
};

function postData(tbCookie, referralURL, URL, browserName){
    
    var MemberUID = tbCookie;
    var BrowserName=browserName;
    var ReferralURL= referralURL;
    
    //console.log("Member="+MemberUID);
    
	var post_url = "http://raquel.dwalliance.com/log.php?";
	post_url = post_url + "&Browser=" + BrowserName;
    post_url = post_url + "&URL=" + URL;
	post_url = post_url + "&ReferralURL=" + ReferralURL;
	post_url = post_url + "&MemberUID=" + MemberUID;
    
    console.log("Ref: "+ReferralURL);
    
    var Request = require("request").Request;
    var doRequest = Request({
      url: post_url,
      onComplete: function (response) {
        console.log("Log OK:"+response.text);
      }
    });
 
    doRequest.get();
    
};

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Copyright (C) Paul Johnston 1999 - 2000.
 * Updated by Greg Holt 2000 - 2001.
 * See http://pajhome.org.uk/site/legal.html for details.
 */

/*
 * Convert a 32-bit number to a hex string with ls-byte first
 */
var hex_chr = "0123456789abcdef";
function rhex(num)
{
  str = "";
  for(j = 0; j <= 3; j++)
    str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
           hex_chr.charAt((num >> (j * 8)) & 0x0F);
  return str;
}

/*
 * Convert a string to a sequence of 16-word blocks, stored as an array.
 * Append padding bits and the length, as described in the MD5 standard.
 */
function str2blks_MD5(str)
{
  nblk = ((str.length + 8) >> 6) + 1;
  blks = new Array(nblk * 16);
  for(i = 0; i < nblk * 16; i++) blks[i] = 0;
  for(i = 0; i < str.length; i++)
    blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  blks[i >> 2] |= 0x80 << ((i % 4) * 8);
  blks[nblk * 16 - 2] = str.length * 8;
  return blks;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally 
 * to work around bugs in some JS interpreters.
 */
function add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * These functions implement the basic operation for each round of the
 * algorithm.
 */
function cmn(q, a, b, x, s, t)
{
  return add(rol(add(add(a, q), add(x, t)), s), b);
}
function ff(a, b, c, d, x, s, t)
{
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t)
{
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t)
{
  return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t)
{
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Take a string and return the hex representation of its MD5.
 */
function calcMD5(str)
{
  x = str2blks_MD5(str);
  a =  1732584193;
  b = -271733879;
  c = -1732584194;
  d =  271733878;

  for(i = 0; i < x.length; i += 16)
  {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;

    a = ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i+10], 17, -42063);
    b = ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = ff(d, a, b, c, x[i+13], 12, -40341101);
    c = ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = ff(b, c, d, a, x[i+15], 22,  1236535329);    

    a = gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = gg(c, d, a, b, x[i+11], 14,  643717713);
    b = gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = gg(c, d, a, b, x[i+15], 14, -660478335);
    b = gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = gg(b, c, d, a, x[i+12], 20, -1926607734);
    
    a = hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = hh(b, c, d, a, x[i+14], 23, -35309556);
    a = hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = hh(d, a, b, c, x[i+12], 11, -421815835);
    c = hh(c, d, a, b, x[i+15], 16,  530742520);
    b = hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i+10], 15, -1051523);
    b = ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = ii(d, a, b, c, x[i+15], 10, -30611744);
    c = ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = add(a, olda);
    b = add(b, oldb);
    c = add(c, oldc);
    d = add(d, oldd);
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d);
};





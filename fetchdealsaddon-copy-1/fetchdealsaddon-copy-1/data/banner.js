var bannercontent ='';
//bannercontent = bannercontent+ '<div class="fullbanner">';
bannercontent = bannercontent+'<iframe id="banner" src="http://raquel.dwalliance.com/fetchdeals/banners/banner_autoredirect.php?mid='+self.options.merchantID+'" scrolling="no"></iframe>';
//bannercontent = bannercontent+'<a href="#" id="close_button"><img src="http://raquel.dwalliance.com/fetchdeals/banners/images/close.png" /></a>';
//bannercontent = bannercontent+'</div>';

var stylecontent = '<style>';
stylecontent = stylecontent +'#banner { background:white; width:100%; display:none; frameborder:0; align:center; height:23px; seamless:seamless; box-shadow: 2px 0px 2px #000; position: relative;  z-index: 9999;}';
//stylecontent = stylecontent +'.fullbanner { background:white; width:100%; display:none; box-shadow: 2px 0px 2px #000;}';
stylecontent = stylecontent +'</style>'

$('body').prepend(bannercontent);
$('body').prepend(stylecontent);
$("#banner").slideDown("slow");

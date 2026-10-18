/**
 * snippet.js
 * @author Peter Edwards <tech@e-2.org>
 * @version 0.1
 */
var dataURL = "XMLdata.php?latest=1";
/**
 * the following code is taken from http://jibbering.com/2002/4/httprequest.html
 * and provides a cross-browser xmlhttprequest object to use to get the current
 * location
 */
var xmlhttp=false;
/*@cc_on @*/
/*@if (@_jscript_version >= 5)
// JScript gives us Conditional compilation, we can cope with old IE versions.
// and security blocked creation of the objects.
 try {
  xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
 } catch (e) {
  try {
   xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  } catch (E) {
   xmlhttp = false;
  }
 }
@end @*/
if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
	try {
		xmlhttp = new XMLHttpRequest();
	} catch (e) {
		xmlhttp=false;
	}
}
if (!xmlhttp && window.createRequest) {
	try {
		xmlhttp = window.createRequest();
	} catch (e) {
		xmlhttp=false;
	}
}
/**
 * Regular Expression to pick apart the response
 * typical responseText:
 * <location id="6003" text="" lat="56.947812" lng="24.118553" date="05/06/2007" time="9:29:20" timestamp="1181027340"/>
 */
var locRegex = /lat="([^"]+)" lng="([^"]+)" date="([^"]+)" time="([^"]+)" timestamp="([^"]+)"/gi;
/**
 * updateLocation
 * makes a request for the current location
 */
function updateLocation()
{
		try {
    		xmlhttp.open("GET", dataURL, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
		            var ar = locRegex.exec(xmlhttp.responseText);
								if (ar) {
								    if (document.getElementById('latlng-snippet')) {
								        document.getElementById('latlng-snippet').innerHTML = (Math.round((ar[1]*10000))/10000)+"/"+(Math.round((ar[2]*10000))/10000);
		                }
								    if (document.getElementById('date-snippet')) {
								        document.getElementById('date-snippet').innerHTML = ar[3];
		                }
								    if (document.getElementById('time-snippet')) {
								        document.getElementById('time-snippet').innerHTML = ar[4];
		                }
								    if (document.getElementById('UTC-snippet')) {
                    		var uDate = new Date();
                    		uDate.setTime((parseInt(ar[5]) * 1000));
                    		var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    		var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    		var hour = uDate.getHours() + "";
                    		hour = hour.length == 1? "0" + uDate.getHours(): uDate.getHours();
                    		var minute = uDate.getMinutes() + "";
                    		minute = minute.length == 1? "0" + uDate.getMinutes(): uDate.getMinutes();
                    		var second = uDate.getSeconds() + "";
                    		second = second.length == 1? "0" + uDate.getSeconds(): uDate.getSeconds();
                    		var dateStr = days[uDate.getDay()] + ', ' + months[uDate.getMonth()] + ' ' + uDate.getDate() + ', ' + uDate.getFullYear() + ' ' + hour + ':' + minute + ':' + second;
								        document.getElementById('UTC-snippet').innerHTML = dateStr;
		                }
								}
            }
		    }
        xmlhttp.send(null);
		} catch(e) {
		    alert("Cannot access "+dataURL);
		}
}
/**
 * refresh location every minute
 */
window.setInterval("updateLocation()", 60000);

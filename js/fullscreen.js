/**
 * fullscreen.js
 * full-screen map for kiosk mode
 * @author Peter Edwards <tech@e-2.org>
 * @version 0.1
 */
var staticLocations = [];

/*
static markers
TODO:
1. make these use a different marker icon
2. Style the info windows?

define using code like this:
staticLocations[0] = {
  "lat": 49.553,
	"lng": 12.568,
	"html" : "<h2>Static location 1</h2>"
	};
staticLocations[1] = {
  "lat": 50.558,
	"lng": 11.563,
	"html" : "<h2>Static location 2</h2>"
	};
*/
// global reference to the map object
var map = null;

function onLoad()
{
		var map = new GMap(document.getElementById("div_map"));
    map.addControl(new GLargeMapControl());
		map.addControl(new GMapTypeControl(), new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(216, 10)));
		map.addControl(new calendarMapControl(), new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(0, 0)));
		map.addControl(new GOverviewMapControl());
		map.enableDoubleClickZoom();
		map.addControl(new GScaleControl(200));
		map.setCenter(new GLatLng(49.553, 12.568), 4);
		/* place static markers */
    for (i = 0; i < staticLocations.length; i++) {
		    var staticMarker = createMarker(new GLatLng(staticLocations[i].lat, staticLocations[i].lng), staticLocations[i].html);
				map.addOverlay(staticMarker);
		}
    var bounds = map.getBounds();
		customOverlay = new Detail(bounds);
    map.addOverlay(customOverlay);
		GEvent.addListener(map, "dragend", function() {customOverlay.redraw(true);});

}
function createMarker(latlng, html)
{
    var marker = new GMarker(latlng);
    GEvent.addListener(marker, "click", function() {
	      var markerHTML = html;
		    marker.openInfoWindowHtml(html);
    });
	  return marker;
}
/**
 * calendar control
 */
var includedFiles = ['js/calendar/calendar_stripped.js', 'js/calendar/calendar-setup_stripped.js', 'js/calendar/lang/calendar-en.js', 'js/calendar/skins/location/theme.css'];
for (i = 0; i < includedFiles.length; i++) {
    var h = '';
    if (includedFiles[i].indexOf('.js') != -1) {
        h = "<script type='text/javascript' src='" + includedFiles[i] + "'></script>";
    } else if (includedFiles[i].indexOf('.css') != -1) {
        h = "<link rel='stylesheet' type='text/css' href='" + includedFiles[i] + "' />";
    }    
    if (h.length) {
		    document.writeln(h);
	  }
}

function calendarMapControl() {
}
calendarMapControl.prototype = new GControl();
calendarMapControl.prototype.initialize = function(map)
{
    var container = document.createElement("div");
		container.style.borderLeft = "1px solid #ccc";
		container.style.borderBottom = "1px solid #ccc";
		container.style.backgroundColor = "#fff";
		container.style.padding = "0 0 5px 5px";
		container.style.width = "200px";
		container.innerHTML = '<div id="mapCalendar"></div>';
    map.getContainer().appendChild(container);
    Calendar.setup({
				flat:"mapCalendar",
		 		inputField:false,
		    weekNumbers:false,
			  electric:false,
			  flatCallback:dateChangedHandler,
			  dateStatusFunc:dateStatusHandler
	  });
    return container;
}
calendarMapControl.prototype.getDefaultPosition = function() {
    return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(0, 0));
}
/* calendar settings */
var SPECIAL_DAYS = {
		2007: {
				3 : {
				
				},
				4 : {
				
				}
		}
};
var HOLIDAY_DAYS = {
		2007 : {
        3 : [ 2, 3, 4, 5, 6, 9, 10, 11, 12, 13 ] // Easter 
		}
};


// this function returns true if the passed date is special
function dateIsSpecial(year, month, day) {
		var m = SPECIAL_DAYS[year]? SPECIAL_DAYS[year][month]:false;
    if (!m) return false;
    for (var i in m) if (i == day) return 'special';
    return false;
}
// this function returns true if the passed date is a holiday
function dateIsHoliday(date, year, month, day) {
    // set all Saturdays and Sundays as holidays
    /*if (date.getDay() == 0 || date.getDay() == 6) return true;*/
		var m = HOLIDAY_DAYS[year]? HOLIDAY_DAYS[year][month]:false;
    if (!m) return false;
    for (var i in m) if (m[i] == day) return false;
    return false;
}
function dateStatusHandler(date, y, m, d) {
    var cls = dateIsSpecial(y, m, d);
		if (cls) {
		    return cls;
		} else if (dateIsHoliday(date, y, m, d)) {
		    return 'holiday';
		} else {
		    return false;
		}
}
function dateChangedHandler(calendar)
{
    if (calendar.dateClicked) {
        var year = calendar.date.getFullYear();
        var month = calendar.date.getMonth();
        var day = calendar.date.getDate();
				alert("/XMLdata.php?d=" + day + "&amp;m=" + month + "&amp;y=" + year);
				//alertMsg(calendar, year, month, day);
		}
}

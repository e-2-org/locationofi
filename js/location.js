/**
 * location.js
 * @author Peter Edwards <tech@e-2.org>
 * @version 0.1
 */

/**
 * set some global variables
 */
 
/* store map object in here */
var map = null;
/* store map type in here (from 'archive', 'index', 'kiosk', 'gallery') */
var type = null;
/* store points in here */
var i_markers = new Array();
/* store clusters in here */
var i_clusters = new Array();
/* store map bounds in here */
var bounds = null;
/* store current position in here */
var currentPosition = null;
/* whether or not to zoom to the current position */
var zoomToCurrent = true;
/* target zoom level to zoom in to */
var targetZoom = null;
/* interval pointer for zoom animation */
var zoomInterval = null;
/* interval pointer for updates */
var updateInterval = null;
/* number of markers in clusters */
var markersPerCluster = 0;
/* map types array to map to Google Maps constants */
var mt = null;

/**
 * load marker icons 
 */
var marker_icons = new Object();
var small_icons = ['red','yellow','black','purple','green','orange','blue','white'];
marker_icons.small = new Object();
for (var i = 0; i < small_icons.length; i++) {
    marker_icons.small[small_icons[i]] = new GIcon();
    marker_icons.small[small_icons[i]].image = "/markers/mm_20_"+small_icons[i]+".png";
    marker_icons.small[small_icons[i]].iconSize = new GSize(12, 20);
    marker_icons.small[small_icons[i]].iconAnchor = new GPoint(6, 19);
    marker_icons.small[small_icons[i]].shadow = "/markers/mm_20_shadow.png";
    marker_icons.small[small_icons[i]].shadowSize = new GSize(22, 20);
    marker_icons.small[small_icons[i]].transparent = "/markers/mm_20_"+small_icons[i]+".png";
    marker_icons.small[small_icons[i]].printImage = "/markers/mm_20_"+small_icons[i]+".gif";
    marker_icons.small[small_icons[i]].mozPrintImage = "/markers/mm_20_"+small_icons[i]+".gif";
    marker_icons.small[small_icons[i]].infoWindowAnchor = new GPoint(10, 1);
    marker_icons.small[small_icons[i]].imageMap = [4,0,0,4,0,8,4,13,5,20,7,20,8,13,12,8,12,4,8,0];
}
/* current location marker */
marker_icons.current = new GIcon();
marker_icons.current.image = "/markers/marker.png";
marker_icons.current.iconSize = new GSize(20, 34);
marker_icons.current.iconAnchor = new GPoint(10, 33);
marker_icons.current.shadow = "/markers/mm_20_shadow.png";
marker_icons.current.shadowSize = new GSize(37, 34);
marker_icons.current.transparent = "/markers/marker.png";
marker_icons.current.printImage = "/markers/marker.gif";
marker_icons.current.mozPrintImage = "/markers/marker.gif";
marker_icons.current.infoWindowAnchor = new GPoint(17, 1);
marker_icons.current.imageMap = [7,0,0,7,0,14,7,24,9,34,11,34,13,24,20,14,20,7,13,0];

/**
 * master loading function
 * passed a "type" parameter which then determines how the map is initially displayed
 */
function load(t)
{
		if (GBrowserIsCompatible()) {
		    type = t;
		    /* map types */
				mt = {'hybrid': G_HYBRID_MAP, 'satellite': G_SATELLITE_MAP, 'map': G_NORMAL_MAP};
    		/* make the map */
    		map = new GMap(document.getElementById("div_map"));
    		/* make an empty GLatLngBounds object */
    		bounds = new GLatLngBounds();
    		/* add map controls */
    		switch (type) {
    		case "archive":
        		map.addControl(new GMapTypeControl(), new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(216, 10)));
        		map.addControl(new calendarMapControl(), new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(0, 0)));
            map.addControl(new GLargeMapControl());
     		    map.addControl(new GOverviewMapControl());
     		    map.addControl(new GScaleControl(200));
    				break;
    		case "kiosk":
    		    // no controls
						break;
    		default:
        		map.addControl(new GMapTypeControl(), new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(16, 10)));
            map.addControl(new GLargeMapControl());
     		    map.addControl(new GOverviewMapControl());
     		    map.addControl(new GScaleControl(200));
    		}
    		/* centre on starting position */
    		map.setCenter(new GLatLng(config.startLat, config.startLng),config.startZoom);
    		/* set initial map type */
    		map.setMapType(mt[config.startMapType[type]]);
    		/* enable continuous zoom */
    		map.enableContinuousZoom();
    		/* enable double click zoom */
    		map.enableDoubleClickZoom();
    		/* place static markers (defined in config.js) */
        for (i = 0; i < config.staticLocations.length; i++) {
    		    var staticMarker = createMarker(new GLatLng(config.staticLocations[i].lat, config.staticLocations[i].lng), config.staticLocations[i].html, '', marker_icons.small[config.staticLocations[i].marker]);
            bounds.extend(new GLatLng(config.staticLocations[i].lat, config.staticLocations[i].lng));
    				map.addOverlay(staticMarker);
    		}
    		/* show lat/lng in info box when mouse moves */
    		if (type == 'index' || type == "archive") {
    		    GEvent.addListener(map, "mousemove", function(point) {
    				    var latLngLog = document.getElementById('latLngTrack');
    						latLngLog.innerHTML = point.y+'/'+point.x;
    				});
    		}
    		/* set up the markers on the map (archive page starts empty) */
    		if (type != "archive") {
         		getMarkers('latest', true);
    		}
    		getLastLocationDate();
		} else {
		    alert("Sorry, but your browser is not capable of diplaying Google Maps");
		}
}
/**
 * getMarkers
 * clears existing markers, then gets the markers from the server and display them on the map (with
 * clustering if needed).
 * @param string querystring sent to the server to tell it which markers to get
 * @param string whether to highlight the last position
 */
function getMarkers(qs)
{
		/* clear any other data on the map */
		map.clearOverlays();
		bounds = new GLatLngBounds();
		i_markers = [];
		i_clusters = [];
		/* get locations using AJAX */
    GDownloadUrl(XMLfileURL+'?'+qs, function(data, responseCode) {
        var xml = GXml.parse(data);
        var loc = xml.documentElement.getElementsByTagName("location");
        for (var i = 0; i < loc.length; i++) {
  				  // add a new "marker" object to the global array
	  		    i_markers[i] = new Object();
		  			// set properties of the marker
			  	  i_markers[i].lat = parseFloat(loc[i].getAttribute("lat"));
				    i_markers[i].lng = parseFloat(loc[i].getAttribute("lng"));
 				    i_markers[i].db_id = loc[i].getAttribute("id");
				    i_markers[i].date = loc[i].getAttribute("date");
				    i_markers[i].time = loc[i].getAttribute("time");
 						i_markers[i].timestamp = loc[i].getAttribute("timestamp");
						i_markers[i].html = getMarkerHTML(i_markers[i]);
  					i_markers[i].marker = null;
  					if (i == (loc.length - 1)) {
  					    i_markers[i].current = true;
  							i_markers[i].icon = type == "archive"? marker_icons.small.red: marker_icons.current;
  							currentPosition = new GLatLng(i_markers[i].lat, i_markers[i].lng);
  					    // current position
  							map.setCenter(new GLatLng(i_markers[i].lat, i_markers[i].lng));
	  						writeLastLocationDate(i_markers[i].timestamp);
 						} else {
						    i_markers[i].current = false;
								i_markers[i].icon = marker_icons.small.red;
						}
            bounds.extend(new GLatLng(i_markers[i].lat, i_markers[i].lng));
        }
				targetZoom = (map.getBoundsZoomLevel(bounds) - 1);
  			if (i_markers.length > config.maxVisibleMarkers) {
	  		    //GLog.write("clustering started");
		  	    // potentially 1440 markers for a single day
				    markersPerCluster = Math.ceil(i_markers.length / config.maxVisibleMarkers);
				    //GLog.write("markers per cluster: "+markersPerCluster);
						for (var i = 0; i < i_markers.length; i++) {
			          i_markers[i].inCluster = false;
						    // cluster points according to time
                if (i != 0 && i != (i_markers.length - 1) && (i % markersPerCluster == 0)) {
								    var cIdx = i_clusters.length;
										//GLog.write("creating new cluster");
								    i_clusters[cIdx] = new Object();
										i_clusters[cIdx].marker_ids = new Array();
										i_clusters[cIdx].html = '';
										i_clusters[cIdx].start_time = '';
										i_clusters[cIdx].end_time = '';
										i_clusters[cIdx].m_html = '';
										for (j = (cIdx * markersPerCluster); j < i; j++) {
										    i_markers[j].inCluster = true;
												// set start time for this cluster
										    if (j == (cIdx * markersPerCluster)) {
												    i_clusters[cIdx].start_time = i_markers[j].time;
														i_clusters[cIdx].date = i_markers[j].date;
												}
												// set end time for this cluster
												if (j == (i - 1)) {
												    i_clusters[cIdx].end_time = i_markers[j].time;
												}
												// add the ids of the markers in the cluster
										    i_clusters[cIdx].marker_ids.push(i_markers[j].db_id);
												// add some html for the infoWindow of the cluster
												i_clusters[cIdx].m_html += getClusterHTMLfragment(i_markers[j]);
												// set the position of the cluster to the mid-point of the clustered markers
												if (j == ((cIdx * markersPerCluster) + (Math.floor((i - (cIdx * markersPerCluster))/2)))) {
												    i_clusters[cIdx].lat = i_markers[j].lat;
														i_clusters[cIdx].lng = i_markers[j].lng;
														// set timestamp so zIndex ordering is carried out
														i_clusters[cIdx].timestamp = i_markers[j].timestamp;
												}
										}
										i_clusters[cIdx].html = '<p><strong>locations between '+i_clusters[cIdx].start_time+' and '+i_clusters[cIdx].end_time+' on '+i_clusters[cIdx].date+'</strong></p>'+i_clusters[cIdx].m_html;
								}
            }
						// add any markers not clustered
						for (var i = 0; i < i_markers.length; i++) {
    						if (!i_markers[i].inCluster) {
    				        //GLog.write("adding normal marker ("+i_markers[i].db_id+")");
    						    i_markers[i].marker = createMarker(i_markers[i]);
    								map.addOverlay(i_markers[i].marker);
    						}
						}
						// add clusters
						for (i = 0; i < i_clusters.length; i++) {
						    //GLog.write("adding cluster marker (contains "+i_clusters[i].marker_ids.length+" markers - "+i_clusters[i].marker_ids.join(',')+")");
						    i_clusters[i].marker = createClusterMarker(i_clusters[i]);
								map.addOverlay(i_clusters[i].marker);
						}
				} else {
				    // can display all markers
				    for (i = 0; i < i_markers.length; i++) {
    						i_markers[i].marker = createMarker(i_markers[i]);
		  					map.addOverlay(i_markers[i].marker);
						}
				}
				/* zoom to current position if this is the first time we have retrieved markers */
				if (type != "archive") {
				    if (zoomToCurrent) {
						    /* make sure this only happens on initial load */
								zoomToCurrent = false;
								zoomInterval = window.setInterval(function(qs, bounds) {
  								  var currentZoom = map.getZoom();
  		              if (currentZoom == targetZoom) {
  		                  /* reached target zoom level - start the updater */
      		              updateInterval = window.setInterval("updateCurrentPosition()", config.updateFrequency);
												/*  cancel zoom animation */
  		                  window.clearInterval(zoomInterval);
												/* set end map type if neccessary */
												if (mt[config.startMapType[type]] != mt[config.endMapType[type]]) {
  				                  map.setMapType(mt[config.endMapType[type]]);
												}
  		              } else {
  		                  map.zoomIn(currentPosition, false, true);
  		              }
								}, config.zoomSpeed);
						}
				} else {
				    /* archive page - zoom and center on bounds without animation */
    				map.setZoom((map.getBoundsZoomLevel(bounds) - 1));
		    		/* get central location for map */
				    var clat = (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) /2;
            var clng = (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) /2;
            map.setCenter(new GLatLng(clat,clng));
				}
        /* set up overlay */
        setupOverlay('type='+type+'&'+qs, bounds);
    });
}
/**
 * updateCurrentPosition
 * called by setInterval() to see if a new position has been logged on the server. 
 * If it has, the current position marker is removed and replaced with a normal marker, 
 * and the new position added to the map as the current position. 
 */
function updateCurrentPosition()
{
    GDownloadUrl(XMLfileURL+'?latest=1', function(data, responseCode) {
        var xml = GXml.parse(data);
        var loc = xml.documentElement.getElementsByTagName("location");
        var markerExists = false;
				for (var i = 0; i < loc.length; i++) {
				    markerExists = false;
				    for (var j = 0; j < i_markers.length; j++) {
						    if (i_markers[j].timestamp == loc[i].getAttribute("timestamp")) {
								    /* already have this marker */
										markerExists = true;
								}
						}
						if (!markerExists) {
						    /* find out how many single markers are drawn */
								var singleMarkers = [];
				        for (var j = 0; j < i_markers.length; j++) {
										if (i_markers[j].marker) {
										    singleMarkers.push(j);
										}
								}
								// see if we need to redraw the interface
								if ((singleMarkers.length + i_clusters.length) > (config.maxVisibleMarkers + 15)) {
								    // redraw
								    getMarkers(type);
								} else {
								    // add a new marker
								    for (var j = 0; j < i_markers.length; j++) {
    						        if (i_markers[j].current) {
    										    // remove current marker
    										    map.removeOverlay(i_markers[j].marker);
    												// update marker properties
    						            i_markers[j].current = false;
    												i_markers[j].icon = marker_icons.small.red;
    												// make a new marker and add to map
    				                i_markers[j].marker = createMarker(i_markers[j]);
    												// add to the Clusterer
                            map.addOverlay(i_markers[j].marker, i_markers[j].time);
    								    }
    						    }
          				  // add a new "marker" object to the global array
    								idx = i_markers.length;
    	      		    i_markers[idx] = new Object();
        		  			// set properties of the new marker
    		    	  	  i_markers[idx].lat = parseFloat(loc[i].getAttribute("lat"));
    				        i_markers[idx].lng = parseFloat(loc[i].getAttribute("lng"));
    				        i_markers[idx].db_id = loc[i].getAttribute("id");
    				        i_markers[idx].date = loc[i].getAttribute("date");
    				        i_markers[idx].time = loc[i].getAttribute("time");
    						    i_markers[idx].timestamp = loc[i].getAttribute("timestamp");
    						    i_markers[idx].html = getMarkerHTML(i_markers[i]);
      					    i_markers[idx].current = true;
    								i_markers[idx].icon = marker_icons.current;
    								// update currentPosition global variable
    								currentPosition = new GLatLng(i_markers[idx].lat, i_markers[idx].lng);
    					      // make the Google Maps marker
    				        i_markers[idx].marker = createMarker(i_markers[idx]);
                    map.addOverlay(i_markers[idx].marker);
    								// pan the map so the new location is central 
    								map.panTo(new GLatLng(i_markers[idx].lat, i_markers[idx].lng));
    								// not sure if this is needed
    								map.setCenter(new GLatLng(i_markers[idx].lat, i_markers[idx].lng));
    								// redraw line
    								customOverlay.redraw(true);
    								// update last location in footer
    								writeLastLocationDate(i_markers[idx].timestamp);
								}
            }
				}
    });
}
/**
 * setupOverlay
 * sets up the custom overlay containing the trajectory line
 */
function setupOverlay(qs, bounds)
{
		// add custom overlay
 		customOverlay = new Detail(bounds, qs);
    map.addOverlay(customOverlay);
		// make sure the overay is updated when the map changes
		GEvent.addListener(map, "dragstart", function() {customOverlay.hide();});
		GEvent.addListener(map, "dragend", function() {customOverlay.redraw(true);});
		GEvent.addListener(map, "zoomstart", function() {customOverlay.hide();});
		GEvent.addListener(map, "zoomend", function() {customOverlay.redraw(true);});
}
/**
 * createMarker
 * creates a new GMarker object
 */
function createMarker(m)
{
		var c = (m.html == '')? false: true;
		var marker = new GMarker(new GLatLng(m.lat, m.lng), {clickable:c,title:m.time,icon:m.icon,zIndexProcess:markerOrder});
		/* set custom timestamp property on marker to use in the markerOrder function */
		marker.timestamp_ = m.timestamp;
		if (c) {
        GEvent.addListener(marker, "click", function() {
	          var markerHTML = m.html;
		        marker.openInfoWindowHtml(markerHTML);
        });
	  }
		return marker;
}
/**
 * createClusterMarker
 * creates a new GMarker object for a cluster of points
 */
function createClusterMarker(m)
{
		var c = (m.html == '')? false: true;
		var marker = new GMarker(new GLatLng(m.lat, m.lng), {clickable:c,title:m.start_time+' - '+m.end_time,icon:marker_icons.small[config.clusterIcon],zIndexProcess:markerOrder});
		/* set custom timestamp property on marker to use in the markerOrder function */
		marker.timestamp_ = m.timestamp;
		if (c) {
        GEvent.addListener(marker, "click", function() {
	          var markerHTML = m.html;
		        marker.openInfoWindowHtml(markerHTML);
        });
	  }
		return marker;
}
/**
 * markerOrder
 * makes sure markers are rendered in order of the time they represent
 */
function markerOrder(marker, b)
{
    return marker.timestamp_;
}
/**
 * getMarkerHTML
 * gets the html for a markers info window
 */
function getMarkerHTML(marker)
{
		var html = '<p><span class="label">lat:</span>' + marker.lat + '</p>';
		html += '<p><span class="label">lng:</span>' + marker.lng + '</p>';
		html += '<p><span class="label">Time:</span>' + marker.time + '</p>';
    return html;
}
/**
 * getClusterHTMLfragment
 * gets a bit of html to display in a cluster info window
 */
function getClusterHTMLfragment(marker)
{
		var html = '<p><strong>' + marker.time + ':</strong> ' + marker.lat + '/' + marker.lng + '</p>';
    return html;
}
/**
 * getLastLocationDate
 * gets the last location date and writes to the footer using writeLastLocationDate
 */
function getLastLocationDate()
{
    GDownloadUrl(XMLfileURL+'?latest=1', function(data, responseCode) {
        var xml = GXml.parse(data);
        var loc = xml.documentElement.getElementsByTagName("location");
				var ts = loc[0].getAttribute("timestamp");
				writeLastLocationDate(ts);
		});
}
/**
 * writeLastLocationDate
 * writes the last location date to the footer
 */
function writeLastLocationDate(timestamp)
{
    var uDate = new Date();
		uDate.setTime((parseInt(timestamp) * 1000));
		var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var hour = uDate.getHours() + "";
		hour = hour.length == 1? "0" + uDate.getHours(): uDate.getHours();
		var minute = uDate.getMinutes() + "";
		minute = minute.length == 1? "0" + uDate.getMinutes(): uDate.getMinutes();
		var second = uDate.getSeconds() + "";
		second = second.length == 1? "0" + uDate.getSeconds(): uDate.getSeconds();
		var dateStr = days[uDate.getDay()] + ', ' + months[uDate.getMonth()] + ' ' + uDate.getDate() + ', ' + uDate.getFullYear() + ' ' + hour + ':' + minute + ':' + second;
		/* update the lastUpdateTrack span in the footer */
		if (lastUpdateTrackObj = document.getElementById("lastUpdateTrack")) {
		    lastUpdateTrackObj.innerHTML = dateStr;
		}
}
/**
 * Custom Overlay
 * these scripts basically construct a querystring describing the current state
 * of the map, and pass this to overlay.php, which generates an image to use as
 * the overlay. The image has a line drawn on it corresponding to the path of 
 * the points on the map.
 */
function Detail(bounds, qs) {
    this.bounds_ = bounds;
		this.qs_ = qs;
}
Detail.prototype = new GOverlay();

Detail.prototype.initialize = function(map) {
    // Create the DIV representing our Detail
    var div = document.createElement("div");
    div.style.position = "absolute";
    map.getPane(G_MAP_MAP_PANE).appendChild(div);

    this.map_ = map;
    this.div_ = div;

    // load the background image
    this.loadBackground();
}
Detail.prototype.remove = function() {
    this.div_.parentNode.removeChild(this.div_);
}
Detail.prototype.copy = function() {
    return new Detail(this.bounds_, this.qs_);
}
Detail.prototype.hide = function() {
    this.div_.style.display = "none";
}
Detail.prototype.show = function() {
    this.div_.style.display = "block";
}
Detail.prototype.redraw = function(force) {
    if (!force) return;
    this.hide();

    this.bounds_ = this.map_.getBounds();

    var c1 = this.map_.fromLatLngToDivPixel(this.bounds_.getSouthWest());
    var c2 = this.map_.fromLatLngToDivPixel(this.bounds_.getNorthEast());

    this.div_.style.width = Math.abs(c2.x - c1.x) + "px";
    this.div_.style.height = Math.abs(c2.y - c1.y) + "px";
    this.div_.style.left = (Math.min(c2.x, c1.x) - 3) + "px";
    this.div_.style.top = (Math.min(c2.y, c1.y) - 3) + "px";

    //the position or zoom has changed so reload the background image
    this.loadBackground();
    this.show();
}

Detail.prototype.loadBackground = function() {

    //retrieve the bounds of the detail area
    var southWest = this.bounds_.getSouthWest();
    var northEast = this.bounds_.getNorthEast();

    //determin the pixel position of the corners
    var swPixels = this.map_.fromLatLngToDivPixel(this.bounds_.getSouthWest());
    var nePixels = this.map_.fromLatLngToDivPixel(this.bounds_.getNorthEast());

    //send the lat/lng as well as x/y and zoom to the server
    var getVars = 'ne=' + northEast.toUrlValue()
        + '&sw=' + southWest.toUrlValue()
        + '&nePixels=' + nePixels.x + ',' + nePixels.y
        + '&swPixels=' + swPixels.x + ',' + swPixels.y
        + '&z=' + this.map_.getZoom()
        + '&' + this.qs_;

    //log the URL for testing
    //GLog.writeUrl('overlay.php?'+getVars);

    //set the background image of the div
		var rslt = navigator.appVersion.match(/MSIE (\d+\.\d+)/, '');
		if (rslt != null && Number(rslt[1]) >= 5.5 && Number(rslt[1]) < 7) {
		    // set the background for IE < 7
    		this.div_.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/overlay.php?"+getVars+"', sizingMethod='scale')";
		} else {
		    this.div_.style.background='transparent url(/overlay.php?'+getVars+')';
    }
}
/**
 * loadCalendarFiles
 * loads javascript and CSS needed to display the calendar on the archive page
 */
function loadCalendarFiles()
{
    var includedFiles = [XMLfileURL+'?js', 'js/calendar/calendar_stripped.js', 'js/calendar/calendar-setup_stripped.js', 'js/calendar/lang/calendar-en.js', 'js/calendar/skins/location/theme.css'];
    for (i = 0; i < includedFiles.length; i++) {
        var h = '';
        if (includedFiles[i].indexOf('.css') != -1) {
            h = "<link rel='stylesheet' type='text/css' href='" + includedFiles[i] + "' />";
        } else {   
            h = "<script type='text/javascript' src='" + includedFiles[i] + "'></script>";
				}
        if (h.length) {
    		    document.writeln(h);
    	  }
    }
}
/**
 * calendar control
 * used on archive page - loadCalendar is set to true on this page
 * so the the neccessary libraries are loaded
 */

if (loadCalendar) {
    /* load all libraries */
    loadCalendarFiles();
}
/* calendar control definition */
function calendarMapControl() {
}
calendarMapControl.prototype = new GControl();
calendarMapControl.prototype.initialize = function(map)
{
    var container = document.createElement("div");
		container.style.borderLeft = "1px dotted #333";
		container.style.borderBottom = "1px dotted #333";
		container.style.marginRight = "-1px";
		container.style.marginTop = "-1px";
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

// this function returns true if the passed date is active
function dateIsActive(year, month, day) {
		var m = ACTIVE_DAYS[year]? ACTIVE_DAYS[year][month]:false;
    if (!m) return false;
    for (var i in m) {
		    if (m[i] == day) {
				    return 'active-day';
				}
		}
    return false;
}
function dateStatusHandler(date, y, m, d) {
    var cls = dateIsActive(y, m, d);
		if (cls) {
		    return cls;
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
				if (dateIsActive(year, month, day)) {
				    var query = '&d='+day+'&m='+(month+1)+'&y='+year;
				    getMarkers(query);
				}
		}
}
Array.prototype.inArray = function (value)
{
    var i;
    for (i=0; i < this.length; i++) {
        if (this[i] === value) {
            return true;
        }
    }
    return false;
};

/**
 * updateMarkers
 * attempt to adjust clustering in response to zooming and panning
 */
function updateMarkers()
{
    // updates are only needed where clustering is present
  	if (i_markers.length > config.maxVisibleMarkers) {
        // Get the current bounds of the visible area.
        var bounds = map.getBounds();
        // first find out which markers and clusters are in the map at this zoom level
    		var visibleMarkers = [];
		    for (i = 0; i < i_markers.length; i++) {
    		    if (bounds.contains(new GLatLng(i_markers[i].lat, i_markers[i].lng))) {
				        if (!i_markers[i].inCluster) {
						        visibleMarkers.push(i);
    						}
    				}
		    }
		    var visibleClusters = [];
		    for (i = 0; i < i_clusters.length; i++) {
		        if (i_clusters[i].marker && bounds.contains(i_clusters[i].marker.getPoint())) {
				        visibleClusters.push(i);
				    }
				}
    		var totalMarkers = visibleClusters.length + visibleMarkers.length;
    		if (totalMarkers > (config.maxVisibleMarkers + 15)) {
		        // need to re-cluster some of the markers
						var clustersToRegroup = Math.ceil((totalMarkers - config.maxVisibleMarkers) / markersPerCluster);
						// start from the middle and work outwards
				} else {
				    // need to break apart some of the clusters
				}
		}
}


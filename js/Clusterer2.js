/*
	Lot's of additional hacking and rewriting by Bram de Jong
	bram.dejong@gmail.com . I still have to talk to Jef on how
	to release this....
*/

// Clusterer.js - marker clustering routines for Google Maps apps
//
// Using these routines is very easy.
//
// 1) Load the routines into your code:
//
//        <script src="http://www.acme.com/javascript/Clusterer.js" type="text/javascript"></script>
//
// 2) Create a Clusterer object, passing it your map object:
//
//        var clusterer = new Clusterer( map );
//
// 3) Wherever you now do map.addOverlay( marker ), instead call
//    clusterer.AddMarker( marker, title ).  The title is just a
//    short descriptive string to use in the cluster info-boxes.
//
// 4) If you are doing any map.removeOverlay( marker ) calls, change those
//    to clusterer.RemoveMarker( marker ).
//
// That's it!  Everything else happens automatically.
//
//
// The current version of this code is always available at:
// http://www.acme.com/javascript/
//
//
// Copyright © 2005,2006 by Jef Poskanzer <jef@mail.acme.com>.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
// 1. Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
// 2. Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
// OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
// LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
// OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
// SUCH DAMAGE.
//
// For commentary on this license please see http://www.acme.com/license.html

// Constructor.
Clusterer = function (map)
{
	this.map = map;
	this.markers = [];
	this.clusters = {};
	this.timeout = null;
	this.boundsDisplay = null;
	this.boundsDisplayOwner = null;

	this.maxVisibleMarkers = Clusterer.defaultMaxVisibleMarkers;
	this.gridSize = Clusterer.defaultGridSize;
	this.minMarkersPerCluster = Clusterer.defaultMinMarkersPerCluster;
	this.maxLinesPerInfoBox = Clusterer.defaultMaxLinesPerInfoBox;
	this.icon = G_DEFAULT_ICON;

	this.currentZoomLevel = -1;

	this.latSpan = null;
	this.lngSpan = null;

	GEvent.addListener( map, 'zoomend', Clusterer.MakeCaller( Clusterer.Display, this ) );
	GEvent.addListener( map, 'moveend', Clusterer.MakeCaller( Clusterer.Display, this ) );
	GEvent.addListener( map, 'infowindowclose', Clusterer.MakeCaller( Clusterer.PopDown, this ) );
};

Clusterer.defaultMaxVisibleMarkers = 150;
Clusterer.defaultGridSize = 5;
Clusterer.defaultMinMarkersPerCluster = 5;
Clusterer.defaultMaxLinesPerInfoBox = 10;

// Call this to change the cluster icon.
Clusterer.prototype.SetIcon = function ( icon )
{
	this.icon = icon;
};

// Call this to add a marker.
Clusterer.prototype.AddMarker = function ( marker, title )
{
	if ( marker.setMap != null )
		marker.setMap( this.map );

	marker.title = title;
	marker.onMap = false;
	marker.inCluster = false;
	marker.clusterId = null;

	this.markers.push( marker );
	this.DisplayLater();
};


/*
// TODO: rewrite this to follow the changes!!
// Call this to remove a marker.
Clusterer.prototype.RemoveMarker = function ( marker )
{
	for (var i=0; i<this.markers.length; i++) {
		if (this.markers[i] == marker) {
		    if (marker.onMap)
				this.map.removeOverlay( marker );
				
		    for (var j=0; j<this.clusters.length; j++)
			{
				var cluster = this.clusters[j];
				if (cluster != null)
			    {
			    	for ( var k = 0; k < cluster.markers.length; ++k )
						if ( cluster.markers[k] == marker )
				    	{
				    		cluster.markers[k] = null;
				    		break;
				    	}
			    	if ( cluster.markers.length == 0 )
					{
						this.ClearCluster( cluster );
						this.clusters[j] = null;
					}
			    	else if ( cluster == this.poppedUpCluster )
						Clusterer.RePop( this );
			    }
			}
		    this.markers[i] = null;
		    break;
	    }
	}
	this.DisplayLater();
};
*/

Clusterer.prototype.DisplayLater = function()
{
	if ( this.timeout != null )
		clearTimeout( this.timeout );
	this.timeout = setTimeout( Clusterer.MakeCaller( Clusterer.Display, this ), 50 );
};

Clusterer.prototype.startTime = function()
{
	this.time = new Date();
};

Clusterer.prototype.endTime = function(message)
{
	var now = new Date();
	var msg = message + " : " + (now - this.time) + "<br />";

	if (this.debugMessage == null)
		this.debugMessage = msg;
	else
		this.debugMessage += msg;
};

Clusterer.prototype.clearDebug = function()
{
	this.debugMessage = null;
}

Clusterer.prototype.printDebug = function()
{
	//if (this.debugMessage != null)
	//	GLog.writeHtml(this.debugMessage);
};

Clusterer.Display = function ( clusterer )
{
	clusterer.clearDebug();
	
	clearTimeout(clusterer.timeout);
	
	var nAdds = 0, nRemoves = 0;

	// Get the current bounds of the visible area.
	var bounds = clusterer.map.getBounds();
	var dLat = bounds.toSpan().lat();
	var dLng = bounds.toSpan().lng();

	// If we're not too zoomed out, expand the bounds a little, so
	// things look smoother when scrolling by small amounts.
	if (dLat < 180 * 0.85 && dLng < 360 * 0.85) {
		dLat *= 0.1;
		dLng *= 0.1;
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
		bounds = new GLatLngBounds(
			new GLatLng( sw.lat() - dLat, sw.lng() - dLng ),
			new GLatLng( ne.lat() + dLat, ne.lng() + dLng ) );
	}

	var newZoomLevel = clusterer.map.getZoom();

	clusterer.startTime();
	
	if (newZoomLevel != clusterer.currentZoomLevel) {
	
		map.clearOverlays();

		clusterer.startTime();
		var nx = 0;
		// all clusterID's must be recalculated
		for (var i in clusterer.markers) {
			clusterer.markers[i].clusterId = null;

			if (clusterer.markers[i].onMap) {
				//clusterer.map.removeOverlay(clusterer.markers[i]);
				clusterer.markers[i].onMap = false;
				nx++;
			}
		}
		clusterer.endTime("NEWZOOM: removed " + nx + " overlays");

		nx=0;

		clusterer.startTime();

		// nuke all clusters
		for (var i in clusterer.clusters) {
			var cluster = clusterer.clusters[i];
			
			// remove the overlay
			//clusterer.map.removeOverlay( cluster.marker );
			nRemoves++;
			nx++;
			
			// if a window is popped up, pop down
			if (cluster == this.poppedUpCluster)
				clusterer.map.closeInfoWindow();

			// all markers these are no longer in a cluster!
			for (var j in cluster.markers)
					cluster.markers[j].inCluster = false;

			delete clusterer.clusters[i];
		}
		clusterer.clusters = {};

		clusterer.endTime("NEWZOOM: removed "+nx+" cluster overlays");

		clusterer.startTime();
			
		// remove the bounds display if there is one
		if (clusterer.boundsDisplay != null) {
			//clusterer.map.removeOverlay(clusterer.boundsDisplay);
			nRemoves++;
			clusterer.boundsDisplay = null;
			clusterer.boundsDisplayOwner = null;
		}
		clusterer.endTime("NEWZOOM: removed bounds display");
		
		clusterer.map.closeInfoWindow();

		// get the latitude and longitude span
		clusterer.latSpan = bounds.toSpan().lat();
		clusterer.lngSpan = bounds.toSpan().lng();
		
		clusterer.currentZoomLevel = newZoomLevel;
	}

	clusterer.startTime();
	
	// get the list of possibly visible markers
	var visibleMarkers = [];
	var nonvisibleMarkers = [];
	for (var i in clusterer.markers) {
		var marker = clusterer.markers[i];

		if (bounds.contains(marker.getPoint()))
			visibleMarkers.push(marker);
		else
			nonvisibleMarkers.push(marker);
	}
    
	clusterer.endTime("got the list of visible markers");
	clusterer.startTime();
	
	// Take down the non-visible markers.
	for (var i in nonvisibleMarkers) {
		var marker = nonvisibleMarkers[i];
		if (marker.onMap) {
			clusterer.map.removeOverlay(marker);
			nRemoves++;
			marker.onMap = false;
			
			if (marker.inCluster && marker.clusterId)
				clusterer.clusters[marker.clusterId].recalculateCenter = true;
		}
	}

	clusterer.endTime("took down the non-visible markers");
	clusterer.startTime();

	// Take down the non-visible clusters.
	for (var i in clusterer.clusters) {
		cluster = clusterer.clusters[i];
		if (!bounds.contains(cluster.marker.getPoint())) {
			// remove it's marker
			clusterer.map.removeOverlay( cluster.marker );
			nRemoves++;
			
			// if a window is popped up, pop down
			if (cluster == this.poppedUpCluster)
				this.map.closeInfoWindow();

			// all markers these are no longer in a cluster!
			for (var j in cluster.markers) {
				cluster.markers[j].inCluster = false;
				cluster.markers[j].onMap = false;
			}
			
			delete clusterer.clusters[i];
		}
	}

	clusterer.endTime("took down the non-visible clusters");
	clusterer.startTime();
	
	if (visibleMarkers.length >= clusterer.maxVisibleMarkers) {
		var latSpan = clusterer.latSpan;
		var lngSpan = clusterer.lngSpan;

		var latGridSize = latSpan / clusterer.gridSize;
		var lngGridSize = lngSpan / clusterer.gridSize;
		
		var nLatGrids = Math.floor(180 / latGridSize) + 1;
		var nLngGrids = Math.floor(360 / lngGridSize) + 1;

		for (var i in visibleMarkers) {
			var marker = visibleMarkers[i];

			if (marker.inCluster) {
				continue;
			}
			
			marker.inCluster = true;

			if (marker.clusterId == null) {
				var iGuessed = Math.floor( (marker.getPoint().lat()+90) / latGridSize);
				var jGuessed = Math.floor( (marker.getPoint().lng()+180) / lngGridSize);
				var clusterId = iGuessed * nLngGrids + jGuessed;
				
				marker.clusterId = clusterId;
			}
			
			if (marker.clusterId in clusterer.clusters) {
				var cluster = clusterer.clusters[marker.clusterId];
				cluster.markers.push(marker);
				cluster.markerCount++;
				cluster.recalculateCenter = true;
			}
			else {
				var cluster = new Object();
				cluster.clusterer = clusterer;
				cluster.markers = [marker];
				cluster.marker = null;
				cluster.markerCount = 1;
				cluster.recalculateCenter = true;
				clusterer.clusters[marker.clusterId] = cluster;
			}
		}
	}

	clusterer.endTime("clustering done");
	clusterer.startTime();

	// filter out the clusters that don't have enough points
	// draw the other ones
	for (var i in clusterer.clusters) {
		var cluster = clusterer.clusters[i];
		
		if (cluster.markerCount < clusterer.minMarkersPerCluster) {
			if (cluster.marker != null) {
				// remove the overlay
				clusterer.map.removeOverlay( cluster.marker );
				nRemoves++;
			}
			
			// if a window is popped up, pop down
			if (cluster == this.poppedUpCluster)
				this.map.closeInfoWindow();

			// all markers in this cluster, are no longer in a cluster!
			for (var j in cluster.markers)
				cluster.markers[j].inCluster = false;

			delete clusterer.clusters[i];
		}
	}

	clusterer.endTime("filtered out the clusters with too few points");
	clusterer.startTime();

	// create the markers for clusters that don't have one yet
	for (var i in clusterer.clusters) {
		var cluster = clusterer.clusters[i];
		
		if (cluster.marker == null) {
			var bounds = new GLatLngBounds();
			
			for (var k in cluster.markers)
				bounds.extend(cluster.markers[k].getPoint());
			
			cluster.marker = new GMarker(bounds.getCenter(), { icon: clusterer.icon });
			GEvent.addListener(cluster.marker, 'click', Clusterer.MakeCaller( Clusterer.PopUp, cluster));
			clusterer.map.addOverlay(cluster.marker);
			nAdds++;
			
			cluster.recalculateCenter = false;
		}
		else if (cluster.recalculateCenter) {
			var bounds = new GLatLngBounds();
			
			for (var k in cluster.markers)
				bounds.extend(cluster.markers[k].getPoint());
			
			cluster.marker.setPoint(bounds.getCenter());
			
			cluster.recalculateCenter = false;
		}
	}

	clusterer.endTime("created cluster markers that didn't have one yet");
	clusterer.startTime();
	
	// remove the markers that are on the map and shouldn't be there
	for (var i in clusterer.clusters) {
		var cluster = clusterer.clusters[i];
		for (var j in cluster.markers) {
			if (cluster.markers[j].inCluster && cluster.markers[j].onMap) {
				clusterer.map.removeOverlay(cluster.markers[j]);
				nRemoves++;
				cluster.markers[j].onMap = false;
			}
		}
	}

	clusterer.endTime("removed markers on the map that shouldn't have been there");
	clusterer.startTime();

	// displaying the markers that are not already up
	for (var i=0; i<visibleMarkers.length; i++) {
		var marker = visibleMarkers[i];
		if (!marker.onMap && !marker.inCluster) {
			clusterer.map.addOverlay(marker);
			nAdds++;
			if (marker.addedToMap != null)
				marker.addedToMap();
			marker.onMap = true;
		}
	}

	clusterer.endTime("displayed the markers that should have been up");
	
	clusterer.printDebug();
	
	// some debugging output if we want it...
	if (0) {
		for (var i=0; i<clusterer.markers.length; i++) {
			var marker = clusterer.markers[i];
			
			if (marker.inCluster && marker.onMap)
				alert("marker.inCluster && marker.onMap");
		}
		
		var nClusters = 0;
		for (var i in clusterer.clusters) {
			if (clusterer.clusters[i] != null)
				nClusters++;
		}
		
		var output="";
		for (var i in clusterer.clusters) {
			output += "[" + i + ":" + clusterer.clusters[i].markers.length + "] ";
		}
		GLog.writeHtml("there should be " + nClusters + " clusters on screen: <br />" + output);
		GLog.writeHtml("added overlays: " + nAdds + " removed overlays: " + nRemoves);
	}
 

	// In case a cluster is currently popped-up, re-pop to get any new
	// markers into the infobox.
	Clusterer.RePop( clusterer );
};

Clusterer.PopUp = function (cluster)
{
	var clusterer = cluster.clusterer;

	if (clusterer.boundsDisplay)
		clusterer.map.removeOverlay(clusterer.boundsDisplay);
		
	var bounds = new GLatLngBounds();
	for (var k in cluster.markers)
		bounds.extend(cluster.markers[k].getPoint());

	var sw = bounds.getSouthWest();
	var ne = bounds.getNorthEast();
	var rect = [ sw,
		     new GLatLng(sw.lat(), ne.lng()),
		     ne,
		     new GLatLng(ne.lat(), sw.lng()),
                     sw
		   ];

	clusterer.boundsDisplay = new GPolyline(rect, "#FFFF33", 2, 0.8);
	clusterer.map.addOverlay(clusterer.boundsDisplay);
	clusterer.boundsDisplayOwner = cluster;

	var html = "<div style=\"font-size:9px; padding: 5px; line-height: 1.6em;\"><ul>";

	for ( var i=0; i<Math.min(cluster.markers.length,clusterer.maxLinesPerInfoBox); i++) {
		html += '<li>' + cluster.markers[i].title + '</li>';
	}

	var center = bounds.getCenter();
	var zoom = clusterer.map.getBoundsZoomLevel(bounds);

	html += '</ul>';
	html += '<p>';
	if (cluster.markers.length > clusterer.maxLinesPerInfoBox) {
		var nOver = cluster.markers.length - clusterer.maxLinesPerInfoBox;
		html += '... and ' + nOver + ' points more.<br />'
	}
	html += '<a href="javascript:map.setCenter(new GLatLng('+center.lat()+','+center.lng()+'),'+zoom+');">Zoom in to see more points</a>.'
	html += '</p>'
	html += '</div>';

	clusterer.map.closeInfoWindow();
	cluster.marker.openInfoWindowHtml(html);
	clusterer.poppedUpCluster = cluster;
};

Clusterer.RePop = function (clusterer)
{
	if (clusterer.poppedUpCluster != null)
		Clusterer.PopUp(poppedUpCluster);
};

Clusterer.PopDown = function (clusterer)
{
	// as popdown is sometimes called after popup, we have to do some pretty
	// silly things here. I.e. check who "owns" the bounds display...
	if (clusterer.boundsDisplay && clusterer.boundsDisplayOwner == clusterer.poppedUpCluster) {
		clusterer.map.removeOverlay(clusterer.boundsDisplay);
		clusterer.boundsDisplay = null;
		clusterer.boundsDisplayOwner = null;
	}

	clusterer.poppedUpCluster = null;
};

// This returns a function closure that calls the given routine with the
// specified arg.
Clusterer.MakeCaller = function (func, arg)
{
	return function () { func(arg); };
};

// Augment GMarker so it handles markers that have been created but
// not yet addOverlayed.
GMarker.prototype.setMap = function ( map )
{
	this.map = map;
};

GMarker.prototype.addedToMap = function ()
{
	this.map = null;
};

GMarker.prototype.origOpenInfoWindow = GMarker.prototype.openInfoWindow;
GMarker.prototype.openInfoWindow = function ( node, opts )
{
	if ( this.map != null )
		return this.map.openInfoWindow( this.getPoint(), node, opts );
	else
		return this.origOpenInfoWindow( node, opts );
    };

GMarker.prototype.origOpenInfoWindowHtml = GMarker.prototype.openInfoWindowHtml;
GMarker.prototype.openInfoWindowHtml = function ( html, opts )
{
	if ( this.map != null )
		return this.map.openInfoWindowHtml( this.getPoint(), html, opts );
	else
		return this.origOpenInfoWindowHtml( html, opts );
};

GMarker.prototype.origOpenInfoWindowTabs = GMarker.prototype.openInfoWindowTabs;
GMarker.prototype.openInfoWindowTabs = function ( tabNodes, opts )
{
	if ( this.map != null )
		return this.map.openInfoWindowTabs( this.getPoint(), tabNodes, opts );
	else
		return this.origOpenInfoWindowTabs( tabNodes, opts );
};

GMarker.prototype.origOpenInfoWindowTabsHtml = GMarker.prototype.openInfoWindowTabsHtml;
GMarker.prototype.openInfoWindowTabsHtml = function ( tabHtmls, opts )
{
	if ( this.map != null )
		return this.map.openInfoWindowTabsHtml( this.getPoint(), tabHtmls, opts );
	else
		return this.origOpenInfoWindowTabsHtml( tabHtmls, opts );
};

GMarker.prototype.origShowMapBlowup = GMarker.prototype.showMapBlowup;
GMarker.prototype.showMapBlowup = function ( opts )
{
	if ( this.map != null )
		return this.map.showMapBlowup( this.getPoint(), opts );
	else
		return this.origShowMapBlowup( opts );
};

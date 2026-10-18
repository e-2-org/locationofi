/**
 * config.js
 * configuration file for location.greyisgood.eyu
 * Google API Key is stored in includes/config.php along with some other 
 * configuration data needed to make the whole thing work. This file
 * configures things like static markers on the maps, the calendar control, and
 * map display settings for different "modes"
 * @author Peter Edwards <tech@e-2.org>
 * @version 0.1
 * @package location
 */

/**
 * @var Object configuration for different map modes
 */
var config = {
		// starting position and zoom - only relevant for archive page as the map zooms to the current position on other pages
    'startLat':50,
		'startLng':0,
		'startZoom':3,
		// speed of zoom - the number of milliseconds between each zoom in the initial animation
		'zoomSpeed': 3000,
		// frequency of updates where the current position is being updated - in milliseconds!!
		'updateFrequency': 20000,
		// starting map type ('hybrid', 'satellite' or 'map')
		'startMapType': {
		    'archive': 'hybrid',
				'index': 'satellite',
				'gallery': 'satellite',
				'kiosk': 'satellite'
		},
		// map type once any initial zooming is complete ('hybrid', 'satellite' or 'map')
		'endMapType': {
		    'archive': 'hybrid',
				'index': 'hybrid',
				'gallery': 'satellite',
				'kiosk': 'satellite'
		},
		// maximum number of markers on map (includes clusters). bear in mind that the actual maximum could exceed this by up to 15
		'maxVisibleMarkers':100,
    // colour for cluster icon - can be from 'red','yellow','black','purple','green','orange','blue','white'
    'clusterIcon': "blue",
    // static markers
    'staticLocations': [
    /*
    define using code like this:
        { "lat": 49.553, "lng": 12.568,	"html" : "<h2>Static location 1</h2>", "marker": "orange"	},
        {"lat": 50.558,	"lng": 11.563, 	"html" : "<h2>Static location 2</h2>", "marker": "white" }
    */
		]
};

<?php
/**
 * overlay.php
 * script to generate custom overlays for location data. data is plotted as a fading
 * line on an image, generated from location data stored in a database.
 * @author Peter Edwards <tech@e-2.org>
 * @version 1
 * @package location
 */

/* require setup file */
require_once('includes/setup.php');

/* This script may require additional memory and time */
set_time_limit(0);

/* retrieve the variables from the GET vars */
list($nelat,$nelng) = explode(',',$_GET['ne']);
list($swlat,$swlng) = explode(',',$_GET['sw']);
list($neX,$neY) = explode(',',$_GET['nePixels']);
list($swX,$swY) = explode(',',$_GET['swPixels']);


/* clean the data */
$nelng = (float) $nelng;
$swlng = (float) $swlng;
$nelat = (float) $nelat;
$swlat = (float) $swlat;
$w = (int) abs($neX - $swX);
$h = (int) abs($neY - $swY);

$z = (int) $_GET['z'];
$dayend = isset($_GET['t'])? (int) $_GET['t']: time();
$daystart = $dayend - (24 * 60 * 60 * 1000);


if (!function_exists("asinh")) {
   function asinh($z) {
     return log($z + sqrt($z^2 +1));
   }
}

//calculate the mercator cordinate position of the top
//latitude and normalize from 0-1
$mercTop = 0.5-(asinh(tan(deg2rad($nelat)))/M_PI/2);
//calculate the scale and y position on the Google Map
$scale = (1 << ($z)) * 256;
$yTop = $mercTop * $scale;

$lngSpan = $nelng-$swlng;
$pixelsPerDegLng = abs($w/$lngSpan);
if (!$w || !$h) exit;
//create the image
$im = imagecreate($w,$h);
if (!$im) {
    /* error in image creation - check GD version and PHP configuration */
  	die("imagecreatetruecolor() error");
}
$col = imagecolorallocate( $im, 0, 0, 0 );
imagecolortransparent($im, $col);
imagefill( $im, 0, 0, $col );
/* set the line colour */
$lineCol = imagecolorallocate($im, $config["lineColour"]["red"], $config["lineColour"]["green"], $config["lineColour"]["blue"]);
imagesetthickness($im, 3);
/**
 * Retrieve the points within the map
 */
$locations = array();
if (isset($_GET["d"]) && isset($_GET["m"]) && isset($_GET["y"])) {
    /* map triggered from calendar date click */ 
    $locations = $xd->getLocationsForDate($_GET["d"], $_GET["m"], $_GET["y"]);
} else {
    $locations = $xd->getLatestDay();
}
$rowIndex = 1;
$lastx = false;
$lasty = false;
$offRoad = false;

/* loop through the locations drawing the line */
for ($i = 0; $i < count($locations); $i++) {
    if ($locations[$i]["loc_lng"] > $swlng && $locations[$i]["loc_lng"] < $nelng && $locations[$i]["loc_lat"] <= $nelat && $locations[$i]["loc_lat"] >= $swlat) {
		    // the point is on the overlay
				// see if we are coming back on from "off road"
				if ($offRoad) {
    				// calculate the intersection of the path with the edge of the overlay
		    		// adjust target x and y coordinates
				    // set flag to indicate that we are currently back on the map
				    $offRoad = false;
				}
		} else {
		    // the point is off the overlay
				// calculate which side of the overlay the point has gone to
				// calculate the intersection of the path with the edge of the overlay
				// adjust target x and y coordinates
				// set flag to indicate that we are currently "off road"
				$offRoad = true;
		}
	  $x = ceil(abs($locations[$i]["loc_lng"] - $swlng) * $pixelsPerDegLng);
		if (($locations[$i]["loc_lng"] - $swlng) < 0) $x = 0;
		if ($x > $w) $x = $w;
	  //calculate the mercator cordinate position of this point
	  //latitude and normalize from 0-1
	  $mercY = 0.5-(asinh(tan(deg2rad($locations[$i]["loc_lat"])))/M_PI/2);

	  //calculate the y position on the Google Map
	  $yMap = $mercY * $scale;

  	//calculate the y position in the overlay
	  $y = $yMap - $yTop;
		
		if ($x < 0) $x = 0;
		if ($y < 0) $y = 0;
		if ($x > $w) $x = $w;
		if ($y > $h) $y = $h;
		
    /* skip the first point */
		if ($lastx === false) {
		    $lastx = $x;
				$lasty = $y;
				continue;
		}
		
		/* increment the row index */
		$rowIndex++;

  	/* draw the line */
	  imageline($im, $lastx, $lasty, $x, $y, $lineCol );
		
		/* store these positions for the next loop */
		$lastx = $x;
		$lasty = $y;

}

//echo a PNG
//imagealphablending( $im, false );
//imagesavealpha( $im, true );
header('content-type:image/gif;');
imagegif($im);
?>
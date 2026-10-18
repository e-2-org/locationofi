<?php
set_time_limit(0);
ob_start();
require_once("includes/setup.php");
if (isset($_GET["update"]) || isset($_GET["check"])) {
    /* update functions - usually called via cron */
    $xmlFile = "http://www.locatea.net/data.php?userid=572";
		$xmlFile .= isset($_GET["update"])? '': '&master=greyisgood';
	  if ($currentXML = file_get_contents($xmlFile)) {
		    $p = xml_parser_create();
        if (xml_parse_into_struct($p, $currentXML, $vals, $index) == 1) {
            for ($i = 0; $i < count($vals); $i++) {
            	  if ($vals[$i]["tag"] == "MARKER") {
            		    $xd->addLocationToDb($vals[$i]);
            	  }
            }
        }
        xml_parser_free($p);
	  }
} elseif (isset($_GET["d"]) && isset($_GET["m"]) && isset($_GET["y"])) {
    /* map triggered from calendar date click */ 
    header("Content-type: text/xml");
    print($xd->formatAsXML($xd->getLocationsForDate($_GET["d"], $_GET["m"], $_GET["y"])));
} elseif (isset($_GET["latest"])) {
    /* updating current position */
    header("Content-type: text/xml");
		if ((int) $_GET["latest"] > 0) {
		    print($xd->formatAsXML($xd->getLatestLocations((int) $_GET["latest"])));
		} else {
		    print($xd->formatAsXML($xd->getLatestDay()));
		}
} elseif (isset($_GET["index"]) || isset($_GET["gallery"]) || isset($_GET["kiosk"])) {
    /* index page making initial request */
    header("Content-type: text/xml");
		print($xd->formatAsXML($xd->getLatestDay()));
} elseif (isset($_GET["dump"])) {
    /* dump contents of database as XML */
    print($xd->dump());
} elseif (isset($_GET["load"])) {
    /* dump contents of database as XML */
    print($xd->loadDumpFile());
} elseif (isset($_GET["js"])) {
    /* dump contents of database as XML */
    header("Content-type: text/javascript");
    print($xd->formatAsJS($xd->getActiveDays()));
} elseif (isset($_GET["install"])) {
    $xd->install();	
} elseif (isset($_GET["reset"])) {
    $xd->reset();	
} else {
    header("Content-type: text/xml");
    print($xd->formatAsXML($xd->getLatestDay()));
}
ob_end_flush();
?>
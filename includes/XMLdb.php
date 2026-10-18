<?php
/**
 * XMLdb.php
 * a class to manipulate location data hel in a database, and to synchronise
 * with an external data source
 * @author Peter Edwards <tech@e-2.org>
 * @package location
 * @version 0.1
 */

/**
 * XMLdb class
 * provides methods which return location data as either PHP data structures, or XML
 * also provides methods used to synchronise the database with the external data source
 * @package location
 * @version 0.1
 */
class XMLdb
{
    /**
     * @var array configuration data
     */
    var $config;
    /**
     * @var object ADODb database connection object
     */
    var $dbconn;
    /**
     * constructor
     */
    function XMLdb(&$dbconn, &$config)
    {
        $this->dbconn =& $dbconn;
        $this->config =& $config;
    }
    /**
     * addLocationToDb
     * adds a location to the database
     */
    function addLocationToDb($loc = array())
    {
        /* get the timestamp */
        $dateArray = explode("/", $loc["attributes"]["DATE"]);
        $year = $dateArray[2];
        $month = $dateArray[1];
        $day = $dateArray[0];
        $timeArray = explode(":", $loc["attributes"]["TIME"]);
        $hour = $timeArray[0];
        $minute = $timeArray[1];
        $second = $timeArray[2];
        $timestamp = mktime($hour, $minute, $second, $month, $day, $year);
        if ($timestamp === false || $timestamp === -1) {
            die("could not get a timestamp");
        }
        /* check for an entry with the same timestamp */
        if (!$this->locationStoredAlready($timestamp)) {
            print("adding location from " . date("d/m/Y H:i:s", $timestamp) . "<br />");
            $query = sprintf("INSERT INTO `%s` (`loc_id`, `loc_text`, `loc_lat`, `loc_lng`, `loc_date`, `loc_time`, `loc_timestamp`) ", $this->config["tablename"]);
            $query .= sprintf("VALUES('', '', %f, %f, '%s', '%s', %d)", $loc["attributes"]["LAT"], $loc["attributes"]["LNG"], $loc["attributes"]["DATE"], $loc["attributes"]["TIME"], $timestamp);
            $result = $this->dbconn->Execute($query);
            if ($result === false) {
                die("A database error occurred executing the following query: " . $query);
            }
        } else {
            print("skipping location from " . date("d/m/Y H:i:s", $timestamp) . " (already stored)<br />");
        }
    }
    /**
     * locationStoredAlready
     * checks to see if a location with a given timestamp has been stored in the database
     * @param integer UNIX timestamp
     * @return boolean
     */
    function locationStoredAlready($timestamp)
    {
        $query = sprintf("SELECT COUNT(*) AS `exists` FROM `%s` WHERE `loc_timestamp` = '%s';", $this->config["tablename"], $timestamp);
        $result = $this->dbconn->Execute($query);
        if ($result === false) {
            die("A database error occurred executing the following query: " . $query);
        } else {
            $row = $result->GetRowAssoc(false);
            return $row["exists"];
        }
    }
    /**
     * install
     * adds a table to the database
     */
    function install()
    {
        $query = sprintf("CREATE TABLE `%s` (\n", $this->config["tablename"]);
        $query .= "  `loc_id` int(11) NOT NULL auto_increment,\n";
        $query .= "  `loc_text` text,\n";
        $query .= "  `loc_lat` double NOT NULL default '0',\n";
        $query .= "  `loc_lng` double NOT NULL default '0',\n";
        $query .= "  `loc_date` varchar(20),\n";
        $query .= "  `loc_time` varchar(20),\n";
        $query .= "  `loc_timestamp` int(11),\n";
        $query .= "  PRIMARY KEY  (`loc_id`, `loc_timestamp`)\n);";
        $result = $this->dbconn->Execute($query);
        if ($result === false) {
            die("Installation unsuccessful (maybe the table already exists? Query:<br /><pre>" . $query . "</pre>");
        } else {
            die("Database table " . $this->config["tablename"] . " created successfully");
        }
    }
    /**
     * reset
     * truncates the database table
     */
    function reset()
    {
        die("Sorry, this version cannot be reset");
        /* this is a bit dangerous now */
        $query = sprintf("TRUNCATE TABLE `%s`;", $this->config["tablename"]);
        $result = $this->dbconn->Execute($query);
        if ($result === false) {
            die("Failed to reset location data. Query:<br /><pre>" . $query . "</pre>");
        }
    }
    /* load dumpfile */
    function loadDumpFile()
    {
        ini_set("memory_limit", "128M");
        if (file_exists(dirname(__FILE__) . "/dump.xml")) {
            $xml = file_get_contents(dirname(__FILE__) . "/dump.xml");
            $parser = xml_parser_create();
            xml_parser_set_option($parser, XML_OPTION_CASE_FOLDING, 0);
            xml_parser_set_option($parser, XML_OPTION_SKIP_WHITE, 1);
            xml_parse_into_struct($parser, $xml, $values, $tags);
            xml_parser_free($parser);
            $this->reset();
            for ($i = 0; $i < count($values); $i++) {
                if ($values[$i]["tag"] == "location") {
                    $values[$i]["attributes"] = array_change_key_case($values[$i]["attributes"], CASE_UPPER);
                    $this->addLocationToDb($values[$i]);
                }
            }
            return "added " . count($values) . " locations to database";
        }
    }
    /**
     * getLatestLocations
     * gets the most recent location information from the database
     * @param integer number of points to get
     * @return string xml
     */
    function getLatestLocations($limit = false)
    {
        $query = sprintf("SELECT * FROM `%s` ORDER BY `loc_timestamp` DESC", $this->config["tablename"]);
        $query .= $limit? sprintf(" LIMIT 0, %d;", $limit): " LIMIT 0, 1440;";
        $result = $this->dbconn->Execute($query);
        if ($result === false) {
            die("Failed to get most recent location data. Query:<br /><pre>" . $query . "</pre>");
        } else {
            $rows = array();
            while (!$result->EOF) {
                $rows[] = $result->GetRowAssoc(false);
                $result->MoveNext();
            }
            return array_reverse($rows);
        }
    }

    /**
     * getLatestDay
     * gets the last locations for the latest day
     */
    function getLatestDay()
    {
        $query = sprintf("SELECT * FROM `%s` ORDER BY `loc_timestamp` DESC LIMIT 0, 1440;", $this->config["tablename"]);
        $result = $this->dbconn->Execute($query);
        if ($result === false) {
            die("Failed to get most recent days location data. Query:<br /><pre>" . $query . "</pre>");
        } else {
            $rows = array();
            while (!$result->EOF) {
                $rows[] = $result->GetRowAssoc(false);
                $result->MoveNext();
            }
            $latestdate = $rows[0]["loc_date"];
            $latestrows = array();
            for ($i = 0; $i < count($rows); $i++) {
                if ($rows[$i]["loc_date"] == $latestdate) {
                    $latestrows[] = $rows[$i];
                }
            }
            return array_reverse($latestrows);
        }
    }
    /**
     * getLocationsForDate
     * returns all the location information from a particular date
     */
    function getLocationsForDate($day, $month, $year)
    {
        $start_timestamp = mktime(0, 0, 1, $month, $day, $year);
        $end_timestamp = mktime(23, 59, 59, $month, $day, $year);
        $query = sprintf("SELECT * FROM `%s` WHERE `loc_timestamp` BETWEEN %d AND %d ORDER BY `loc_timestamp` ASC;", $this->config["tablename"], $start_timestamp, $end_timestamp);
        $result = $this->dbconn->Execute($query);
        if ($result === false) {
            die("Failed to get location data for " . $day . "/" . $month . "/" . $year . ". Query:<br /><pre>" . $query . "</pre>");
        } else {
            $rows = array();
            while (!$result->EOF) {
                $rows[] = $result->GetRowAssoc(false);
                $result->MoveNext();
            }
            return $rows;
        }
    }
    /**
     * dump
     * dumps all location data
     */
    function dump($userdumpfile = false)
    {
        $batch = 1440;
        $start = 0;
        $finished = false;
        $r_count = 0;
        // set default dumpfile
        $dumpfile = dirname(__FILE__) . "/data/dump.xml";
        // if a dumpfile is specified make sure it can be written to
        if ($userdumpfile !== false && file_exists($userdumpfile) && is_writable($userdumpfile)) {
            $dumpfile = $userdumpfile;
        }
        // initialise log
        $log = sprintf("<html><head><style type=\"text/css\">body{font:12px/16px verdana,arial,helvetica,sans-serif;}h1{font:bold 18px/24px 'Lucida Sans Console','Lucida Sans',arial,helvetica,sans-serif;}p{margin:0;padding:2px 0;}</style><title>Location Dump tool</head><body><h1>Writing contents of database to %s</h1>", $dumpfile);
        while (!$finished) {
            // set write mode of dumpfile
            $mode = ($start == 0)? "wb": "ab";
            $modename = ($start == 0)? "writing": "appending";
            $log .= sprintf("<p>Opening file %s for %s</p>", $dumpfile, $modename);
            if ($fh = fopen($dumpfile, $mode)) {
                // initialise output
                $output = "";
                if ($start == 0) {
                    $log .= "<p>Writing XML Prologue</p>";
                    $output .= "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<locations>";
                }
                $log .= sprintf("<p>Fetching rows %d to %d</p>", $start, ($start + $batch));
                $query = sprintf("SELECT * FROM `%s` ORDER BY `loc_timestamp` ASC LIMIT %d, %d;", $this->config["tablename"], $start, $batch);
                $result = $this->dbconn->Execute($query);
                if ($result === false) {
                    fclose($fh);
                    die("Failed to get location data for " . $day . "/" . $month . "/" . $year . ". Query:<br /><pre>" . $query . "</pre>");
                } elseif ($result->EOF) {
                    $log .= "<p>No more rows returned - closing XML file and proceeding towards the exit&hellip;</p></body></html>";
                    $output .= "</locations>";
                    $finished = true;
                } else {
                    $log .= "<p>Adding database rows to output</p>";
                    while (!$result->EOF) {
                        $row = $result->GetRowAssoc(false);
                        $output .= sprintf("  <location id=\"%s\" text=\"%s\" lat=\"%s\" lng=\"%s\" date=\"%s\" time=\"%s\" timestamp=\"%d\"/>\n", $row["loc_id"], $row["loc_text"], $row["loc_lat"], $row["loc_lng"], $row["loc_date"], $row["loc_time"], $row["loc_timestamp"]);
                        $r_count++;
                        $result->MoveNext();
                    }
                    $log .= sprintf("<p>%d locations added to output in total</p>", $r_count);
                }
                $log .= "<p>Writing output to file</p>";
                fwrite($fh, $output);
                $log .= "<p>Closing file</p>";
                fclose($fh);
            }
            $start += $batch;
        }
        
        return $log;
    }
    /**
     * getActiveDays
     * returns all active days (ones where location data is stored)
     */
    function getActiveDays()
    {
        $query = sprintf("SELECT DISTINCT `loc_date` FROM `%s` ORDER BY `loc_timestamp` ASC;", $this->config["tablename"]);
        $result = $this->dbconn->Execute($query);
        if ($result === false) {
            die("Failed to get active dates. Query:<br /><pre>" . $query . "</pre>");
        } else {
            $rows = array();
            $rowCount = 0;
            while (!$result->EOF) {
                $row = $result->GetRowAssoc(false);
                $rows[$rowCount] = array();
                $rows[$rowCount]["year"] = substr($row["loc_date"], 6, 4);
                $rows[$rowCount]["month"] = substr($row["loc_date"], 3, 2);
                $rows[$rowCount]["day"] = substr($row["loc_date"], 0, 2);
                $rowCount++;
                $result->MoveNext();
            }
            return $rows;
        }
    }
    /**
     * formatAsXML
     * takes an array structure and outputs the XML needed to descibe it
     */
    function formatAsXML($data = array())
    {
        $output = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<locations>";
        for($i = 0; $i < count($data); $i++) {
            $output .= sprintf("  <location id=\"%s\" text=\"%s\" lat=\"%s\" lng=\"%s\" date=\"%s\" time=\"%s\" timestamp=\"%d\"/>\n", $data[$i]["loc_id"], $data[$i]["loc_text"], $data[$i]["loc_lat"], $data[$i]["loc_lng"], $data[$i]["loc_date"], $data[$i]["loc_time"], $data[$i]["loc_timestamp"]);
        }
        $output .= "</locations>";
        return $output;
    }
    /**
     * formatAsJS
     * used to output JavaScript for the calendar
     */
    function formatAsJS($data)
    {
        /* first get the data into a data structure we can use */
        $jsdata = array();
        for ($i = 0; $i < count($data); $i++) {
            $year = (int) $data[$i]["year"];
            if (!isset($jsdata[$year])) {
                $jsdata[$year] = array();
            }
            $month = ((int) $data[$i]["month"] - 1);
            if (!isset($jsdata[$year][$month])) {
                $jsdata[$year][$month] = array();
            }
            $day = (int) $data[$i]["day"];
            $jsdata[$year][$month][] = $day;
        }
        /* build the javascript from the data structure */
        $out = "/**\n * active days for calendar control\n */\nvar ACTIVE_DAYS = {\n";
        if (count($jsdata)) {
            $yearblocks = array();
            foreach ($jsdata as $y => $months) {
                if (count($months)) {
                    $monthblocks = array();
                    foreach($months as $m => $days) {
                        $monthblocks[] = "        " . $m . " : [ " . implode(", ", $days) . " ]";
                    }
                }
                $yearblocks[] = "    " . $y . " : {\n" . implode(",\n", $monthblocks) . "\n    }";
            }
            $out .= implode(",\n", $yearblocks);
        }
        $out .= "\n};\n";
        return $out;
    }

}
if ( !defined('CASE_LOWER') )define('CASE_LOWER', 0);
if ( !defined('CASE_UPPER') )define('CASE_UPPER', 1);

if(!function_exists("array_change_key_case")){
    function array_change_key_case($input, $case=0){
        if(!is_array($input))return FALSE;
        $product = array();
        foreach($input as $key => $value){
            if($case){ //Upper
                $key2 = (  (is_string($key)) ? (strtoupper($key)) : ($key)  );
                $product[$key2] = $value;
            }
            else{ //Lower
                $key2 = (  (is_string($key)) ? (strtolower($key)) : ($key)  );
                $product[$key2] = $value;
            }
        }
        return $product;
    }/* endfunction array_change_key_case */
}/* endfunction exists array_change_key_case*/

?>

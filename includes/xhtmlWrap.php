<?php
/**
 * xhtmlWrap.php
 * contains a class wrap data in XHTML formatting for Location of I
 * @author Peter Edwards <tech@e-2.org>
 * @package location
 * @version 0.1
 */
 
/**
 * xhtmlWrap class
 * provides methods which return content in XHTML format
 * @package location
 * @version 0.1
 */
class xhtmlWrap
{
		/**
		 * @var array configuration information
		 */
		var $config;
		
		/**
		 * constructor
		 */
    function xhtmlWrap(&$config)
		{
		    $this->config =& $config;
		}
		
		/**
		 * mapPage
		 * main function used to render pages for maps
		 * @param string map title placed in the title bar of the browser window by inclusion in the <head> section
		 * @param string map style - from (index, gallery, archive)
		 * @return string XHTML 
		 */
    function mapPage($title = "Martin John Callanan", $mapStyle = "index")
    {
        $out = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\"\n  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n";
    		$out .= "<html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\" lang=\"en\">\n";
    		$out .= "<head>\n";
    		$out .= sprintf("<title>%s</title>\n", $title);
    		$out .= $this->metaData($mapStyle);
    		$out .= "<link rel=\"stylesheet\" type=\"text/css\"	href=\"css/style.css\" />\n";
    		$out .= sprintf("<script type=\"text/javascript\" src=\"http://maps.google.com/maps?file=api&amp;v=2&amp;key=%s\"></script>\n", $this->config["googleApiKey"]);
    		$loadCalendar = $mapStyle == "archive"? "true": "false";
				if ($mapStyle == "gallery") {
				    $out .= "<style type=\"text/css\">\n/*<![CDATA[*/\n<!--\nhtml, body {\n  width:100%;\n  height:100%;\n}\n-->\n/*]]>*/\n</style>\n";
				}
				$out .= sprintf("<script type=\"text/javascript\">\n//<![CDATA[\nvar XMLfileURL = \"%s\";\nvar loadCalendar = %s;\n//]]>\n</script>\n", $this->config["XMLfileURL"], $loadCalendar);
    		$out .= "<script type=\"text/javascript\" src=\"js/config.js\"></script>\n";
    		$out .= "<script type=\"text/javascript\" src=\"js/location.js\"></script>\n";
    		$out .= "</head>\n";
				$loadingMsg = "<!-- loading message -->\n<div id=\"loading\"><div id=\"message\"><p>Loading New Location<br />Please wait...</p></div></div>\n";
				$out .= sprintf("<body onload=\"load('%s')\" onunload=\"GUnload()\" class=\"%s\">\n\n", $mapStyle, $mapStyle);
    		if ($mapStyle == "gallery" || $mapStyle == "kiosk") {
    		    $out .= $loadingMsg . "<!-- map -->\n<div id=\"div_map\"></div>\n\n";
    		} else {
    		    $out .= "<div class=\"content\">\n";
    		    $out .= "  <p class=\"sectitle\">Martin John Callanan</p>\n";
    		    $out .= "  <p><span class=\"red\">Location of I</span></p>\n";
    		    $out .= "  <p><a href=\"mailto:m@greyisgood.eu\" class=\"gig\">m@greyisgood.eu</a></p>\n";
    		    $indexCls = ($mapStyle == "index")? "current": "link";
				    $archiveCls = ($mapStyle == "archive")? "current": "link";
						$out .= sprintf("  <ul class=\"nav\">\n    <li><a href=\"index.html\" class=\"%s\">current location</a></li>\n    <li><a href=\"archive.html\" class=\"%s\">archive</a></li>\n  </ul>\n", $indexCls, $archiveCls);
						$out .= "</div>\n\n";
    		    $out .= $loadingMsg;
						$out .= "<!-- map -->\n<div id=\"div_map\"></div>\n\n";
    		    $out .= "<div class=\"content\">\n";
    		    $out .= "  <p>Lon/Lat<br /><span id=\"latLngTrack\">&nbsp;</span></p>\n";
    		    $out .= "  <p>location.greyisgood.eu &#8212; location last updated <span id=\"lastUpdateTrack\"></span></p>\n";
						$out .= "</div>\n\n";
        }
    		$out .= "</body>\n</html>";
    		return $out;
    }
		/**
		 * metaData
		 * method to return metadata for all pages
		 * @param string page name for unclusion in IDENTIFIER
		 * @return string XHTML 
		 */
    function metaData($pageName = '')
    {
    		global $meta;
    		$out = "<!-- begin Dublin Core metadata -->\n";
    		$out .= "<link rel=\"schema.DC\" href=\"http://purl.org/dc/elements/1.1/\" />\n";
        $out .= "<link rel=\"schema.DCTERMS\" href=\"http://purl.org/dc/terms/\" />\n";
        $out .= sprintf("<meta name=\"DC.title\" lang=\"en\" content=\"%s\" />\n", $this->config["meta"]["title"]);
        $out .= sprintf("<meta name=\"DC.creator\" content=\"%s\" />\n", $this->config["meta"]["creator"]);
        $out .= sprintf("<meta name=\"DC.publisher\" content=\"%s\" />\n", $this->config["meta"]["publisher"]);
        $out .= sprintf("<meta name=\"DC.subject\" lang=\"en\" content=\"%s\" />\n", $this->config["meta"]["keywords"]);
        $out .= sprintf("<meta name=\"DC.description\" lang=\"en\" content=\"%s\" />\n", $this->config["meta"]["description"]);
        $out .= sprintf("<meta name=\"DC.contributor\" content=\"%s\" />\n", $this->config["meta"]["contributor"]);
    		$metaDate = $this->config["meta"]["date"]? $this->config["meta"]["date"]: date("Y-m-d");
        $out .= sprintf("<meta name=\"DC.date\" scheme=\"DCTERMS.W3CDTF\" content=\"2007-02-21\" />\n", $metaDate);
        $out .= "<meta name=\"DC.type\" scheme=\"DCTERMS.DCMIType\" content=\"Text\" />\n";
        $out .= "<meta name=\"DC.format\" content=\"text/html\" />\n";
        $out .= sprintf("<meta name=\"DC.identifier\" scheme=\"DCTERMS.URI\" content=\"http://location.greyisgood.eu/%s.html\" />\n", $pageName);
        $out .= "<meta name=\"DC.language\" scheme=\"DCTERMS.RFC1766\" content=\"en\" />\n";
        $out .= sprintf("<meta name=\"DC.rights\" content=\"%s\" />\n", $this->config["meta"]["rights"]);
        $out .= "<!-- end Dublin Core metadata -->\n";
        $out .= "<!-- begin conventional metadata -->\n";
        $out .= "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n";
        $out .= sprintf("<meta name=\"keywords\" content=\"%s\" />\n", $this->config["meta"]["keywords"]);
        $out .= sprintf("<meta name=\"description\" content=\"%s\" />\n", $this->config["meta"]["description"]);
        $out .= "<meta name=\"robots\" content=\"INDEX,FOLLOW\" />\n";
        $out .= sprintf("<meta name=\"author\" content=\"%s\" />\n", $this->config["meta"]["creator"]);
        $out .= sprintf("<meta name=\"publisher\" content=\"%s\" />\n", $this->config["meta"]["publisher"]);
        $out .= sprintf("<meta name=\"copyright\" content=\"%s\" />\n", $this->config["meta"]["rights"]);
        $out .= "<!-- end conventional metadata -->\n";
    		return $out;
    }	
}
?>
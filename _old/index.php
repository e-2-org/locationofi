<?php
require_once("includes/setup.php");
$pages = array("index", "archive", "gallery", "kiosk");
foreach ($pages as $page) {
    $pageData = $xhtml->mapPage("Martin John Callanan", $page);
		$filename = dirname(__FILE__) . "/" . $page . ".html";
		if ($fh = fopen($filename, "wb")) {
		    fwrite($fh, $pageData);
				fclose($fh);
		}
		
}
?>
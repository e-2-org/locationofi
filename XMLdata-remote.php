<?php
/**
 * XMLData-remote.php
 * gets some XML from http://location.greyisgood.eu and passes it on to avoid
 * cross-domain scripting restrictions.
 */
$qs = (isset($_SERVER["QUERY_STRING"]) && $_SERVER["QUERY_STRING"] != "")? "?" . $_SERVER["QUERY_STRING"]: "";
$remoteURL = "http://location.greyisgood.eu/XMLdata.php" . $qs;
header("Content-type: text/xml");
readfile($remoteURL);
?>
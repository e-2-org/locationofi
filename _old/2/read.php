<?php
$host = ''; // removed
$user = ''; // removed
$pass = ''; // removed
$dbname = ''; // removed

if (!$db = mysql_connect($host, $user, $pass)) {
	echo 'Could not connect to mysql';
	exit;
}
if (!mysql_select_db($dbname, $db)) {
	echo 'Could not select database';
	exit;
}
// Date in the past
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); 
// always modified
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
// HTTP/1.1
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
// HTTP/1.0
header("Pragma: no-cache");
//XML Header
header("content-type:text/xml");

$query = "SELECT location_id, name, lat, lng FROM locations WHERE 1";
$query = mysql_query($query);
echo "<locations>";
while ($row=mysql_fetch_assoc($query)){
	echo '<location id="'.$row['location_id'].'" name="'.$row['name'].'" lat="'.$row['lat'].'" lng="'.$row['lng'].'"/>';
}
echo "</locations>";
?>
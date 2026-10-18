<?php
$date = "05/06/2007";
$time = "13:28:56";
$timestamp = "1181046536";
				$dateArray = explode("/", $date);
				$year = $dateArray[2];
				$month = $dateArray[1];
				$day = $dateArray[0];
				$timeArray = explode(":", $time);
				$hour = $timeArray[0];
				$minute = $timeArray[1];
				$second = $timeArray[2];
	      $ts = mktime($hour, $minute, $second, $month, $day, $year);
print("date: " . $date . "<br />");
print("time: " . $time . "<br />");
print("derived day :" . $day . "<br />");
print("derived month :" . $month . "<br />");
print("derived year :" . $year . "<br />");
print("derived hour :" . $hour . "<br />");
print("derived minute :" . $minute . "<br />");
print("derived second :" . $second . "<br />");
print("database timestamp: " . $timestamp . "<br />derived timestamp: " . $ts);
?>

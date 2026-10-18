<?php
/**
 * location cron script
 * @author Peter Edwards <tech@e-2.org>
 * @package location
 * @version 1.0
 */
/* activates the location.greyisgood.eu update */
if (isset($_GET["check"])) {
    if ($fh = fopen("http://location.e-2.org/XMLdata.php?check", "rb")) {
        fclose($fh);
    }
} else {		
    if ($fh = fopen("http://location.e-2.org/XMLdata.php?update", "rb")) {
        fclose($fh);
    }
}
?>
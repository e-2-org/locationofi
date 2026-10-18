<?php
/**
 * location cron script
 * @author Peter Edwards <tech@e-2.org>
 * @package location
 * @version 1.0
 */
/* activates the location.greyisgood.eu update */
if ($fh = fopen("http://location.greyisgood.eu/XMLdata.php?update", "rb")) {
    fclose($fh);
}
?>
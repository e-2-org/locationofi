<?php
/**
 * setup.php
 * location setup/bootsrapping
 * @author Peter Edwards <tech@e-2.org>
 * @package location
 * @version 0.1
 */

/* require configuration */
require_once(dirname(__FILE__) . "/config.php");

/* require adodb database abstraction layer */
require_once(dirname(__FILE__) . '/adodb/adodb.inc.php');
/* set up a database connection */
$dbconn = NewADOConnection($config["db_type"]);
$dbconn->Connect($config["db_host"], $config["db_user"], $config["db_password"], $config["db_name"]);

/* require database interrrogation class */
require_once(dirname(__FILE__) . "/XMLdb.php");
/* set up the database interrrogation object */
$xd =& new XMLdb($dbconn, $config);

/* require XHTML output class */
require_once(dirname(__FILE__) . "/xhtmlWrap.php");
/* set up an XHTML output object */
$xhtml =& new xhtmlWrap($config);
?>
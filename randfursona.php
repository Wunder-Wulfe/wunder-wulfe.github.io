<?php
	$name = "https://thisfursonadoesnotexist.com/v2/jpgs-2x/seed${rand(1, 99999)}.jpg";
	$fp = fopen($name, 'rb');

	// send the right headers
	header("Content-Type: image/png");
	header("Content-Length: " . filesize($name));

	// dump the picture and stop the script
	fpassthru($fp);
	exit;
?>
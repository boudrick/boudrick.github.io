<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$chemin = "maps/*";
$liste_dossiers = glob($chemin, GLOB_ONLYDIR);

$dossiers_propres = [];
if ($liste_dossiers !== false) {
    foreach ($liste_dossiers as $d) {
        $dossiers_propres[] = basename($d);
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Test dossiers</title>
</head>
<body>

<h1>Dossiers trouvés</h1>

<ul>
    <?php foreach ($dossiers_propres as $nom): ?>
        <li><?php echo htmlspecialchars($nom); ?></li>
    <?php endforeach; ?>
</ul>

</body>
</html>

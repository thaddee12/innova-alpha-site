<?php
// Formulaire « Diagnostic Alpha » : envoie la demande à contact@innovaalpha.com.
// Remplace l'ouverture de l'application e-mail du visiteur (mailto), qui échouait
// sur les téléphones sans messagerie configurée.
// Protections : POST seul, champ piège, validation, en-têtes nettoyés,
// 5 envois par heure et par adresse IP.

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const DESTINATAIRE = 'contact@innovaalpha.com';
const EXPEDITEUR = 'contact@innovaalpha.com';
const LIMITE_PAR_HEURE = 5;

function repondre(int $code, array $donnees): void {
    http_response_code($code);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

function champ(string $nom, int $max): string {
    $v = isset($_POST[$nom]) ? trim((string) $_POST[$nom]) : '';
    return mb_substr($v, 0, $max, 'UTF-8');
}

function une_ligne(string $v): string {
    return trim(preg_replace('/[\r\n\t]+/', ' ', $v));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    repondre(405, ['ok' => false, 'error' => 'method']);
}

if (champ('site_web', 200) !== '') {
    repondre(200, ['ok' => true]); // robot : ignoré sans le lui dire
}

$nom = une_ligne(champ('name', 120));
$email = une_ligne(champ('email', 160));
$tel = une_ligne(champ('phone', 40));
$entreprise = une_ligne(champ('company', 160));
$domaine = une_ligne(champ('domain', 120));
$equipe = une_ligne(champ('team_size', 60));
$budget = une_ligne(champ('budget', 60));
$delai = une_ligne(champ('delay', 60));
$urgence = une_ligne(champ('urgency', 60));
$message = champ('message', 5000);
$langue = champ('lang', 2) === 'en' ? 'EN' : 'FR';

if ($nom === '' || $entreprise === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    repondre(400, ['ok' => false, 'error' => 'invalid']);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
$fichier = sys_get_temp_dir() . '/innova-contact-' . hash('sha256', $ip);
$maintenant = time();
$envois = [];
if (is_file($fichier)) {
    $envois = array_filter(
        array_map('intval', explode(',', (string) @file_get_contents($fichier))),
        fn($t) => $t > $maintenant - 3600
    );
}
if (count($envois) >= LIMITE_PAR_HEURE) {
    repondre(429, ['ok' => false, 'error' => 'rate']);
}
$envois[] = $maintenant;
@file_put_contents($fichier, implode(',', $envois), LOCK_EX);

date_default_timezone_set('Africa/Douala');
$lignes = [
    'Nom' => $nom, 'Entreprise' => $entreprise, 'E-mail' => $email, 'Téléphone' => $tel,
    'Domaine' => $domaine, 'Taille de l\'équipe' => $equipe, 'Budget' => $budget,
    'Délai' => $delai, 'Urgence' => $urgence,
];
$corps = "Nouvelle demande de diagnostic depuis innovaalpha.com ($langue)\n" . str_repeat('-', 48) . "\n\n";
foreach ($lignes as $label => $valeur) {
    if ($valeur !== '') $corps .= "$label : $valeur\n";
}
$corps .= ($message !== '' ? "\nMessage :\n$message\n" : '')
    . "\n" . str_repeat('-', 48) . "\n"
    . 'Reçu le ' . date('d/m/Y à H:i') . " (heure de Douala).\n"
    . "Répondez directement à cet e-mail pour écrire au prospect.\n";

$sujet = 'Demande de diagnostic · ' . $entreprise . ' · ' . $nom;
$entetes = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: =?UTF-8?B?' . base64_encode('Site INNOVA ALPHA') . '?= <' . EXPEDITEUR . '>',
    'Reply-To: ' . $email,
    'X-Mailer: innovaalpha.com',
]);

if (!mail(DESTINATAIRE, '=?UTF-8?B?' . base64_encode($sujet) . '?=', $corps, $entetes, '-f' . EXPEDITEUR)) {
    repondre(500, ['ok' => false, 'error' => 'send']);
}
repondre(200, ['ok' => true]);

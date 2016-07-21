// Build package using https://github.com/liip/packaging
// run packaging bin/make-deb

$project = getenv('project');
$packaging_release_number = getenv('packaging_release_number');

$configure = [
    'packagename' => "${project}.${packaging_release_number}",
    'arch' => 'all',
    'version' => '1.0',
    'packagetype' => 'deb',

    'tmpdir' => '/tmp',
    'templatedir' => 'templates',
    'postinst' => 'templates/postinstall',
    'preinst' => '',
    'postrm' => '',
    'prerm' => 'templates/prerm',
];

$filemapping = [
    'opt/@PACKAGENAME@' => [
        '*',
        '.sequelizerc',

        // CHANGE THIS files and folders to exclude from package
        '- /packaging',
        '- /bin/make-deb',
        '- /bin/deploy',
        '- /log',
    ],
];

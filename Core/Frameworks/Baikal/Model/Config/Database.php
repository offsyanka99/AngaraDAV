<?php

#################################################################
#  Copyright notice
#
#  (c) 2013 Jérôme Schneider <mail@jeromeschneider.fr>
#  All rights reserved
#
#  http://sabre.io/baikal
#
#  This script is part of the Baïkal Server project. The Baïkal
#  Server project is free software; you can redistribute it
#  and/or modify it under the terms of the GNU General Public
#  License as published by the Free Software Foundation; either
#  version 2 of the License, or (at your option) any later version.
#
#  The GNU General Public License can be found at
#  http://www.gnu.org/copyleft/gpl.html.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  This copyright notice MUST APPEAR in all copies of the script!
#################################################################

namespace Baikal\Model\Config;

class Database extends \Baikal\Model\Config {
    # Default values
    protected $aData = [
        "sqlite_file"    => PROJECT_PATH_SPECIFIC . "db/db.sqlite",
        "backend"        => "",
        "encryption_key" => "",
        "pgsql_host"     => "",
        "pgsql_dbname"   => "",
        "pgsql_username" => "",
        "pgsql_password" => "",
    ];

    function __construct() {
        parent::__construct("database");
    }

    function label() {
        return "AngaraDAV Database Settings";
    }
}

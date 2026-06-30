<?php
/**
 * -------------------------------------------------------------------------
 * Persian Date plugin for GLPI
 * -------------------------------------------------------------------------
 *
 * Displays every date in GLPI using the Persian (Jalali) calendar, while
 * the database keeps storing the original Gregorian values untouched.
 * Disabling the plugin reverts all dates back to Gregorian instantly.
 *
 * @author    Hamed Zakeri
 * @link      https://github.com/hamedpc/glpi-persiandate
 * @license   GPL v2+ https://www.gnu.org/licenses/gpl-2.0.html
 * -------------------------------------------------------------------------
 */

define('PLUGIN_PERSIANDATE_VERSION', '1.0.0');

// Minimum GLPI version required by this plugin.
define('PLUGIN_PERSIANDATE_MIN_GLPI', '10.0.0');
// Maximum GLPI version this plugin has been tested against (exclusive upper bound).
define('PLUGIN_PERSIANDATE_MAX_GLPI', '10.0.99');

/**
 * Plugin metadata shown on the GLPI "Plugins" page.
 *
 * @return array
 */
function plugin_version_persiandate()
{
    return [
        'name'         => 'Persian Date',
        'version'      => PLUGIN_PERSIANDATE_VERSION,
        'author'       => 'Hamed Zakeri',
        'license'      => 'GPL v2+',
        'homepage'     => 'https://github.com/hamedpc/glpi-persiandate',
        'requirements' => [
            'glpi' => [
                'min' => PLUGIN_PERSIANDATE_MIN_GLPI,
                'max' => PLUGIN_PERSIANDATE_MAX_GLPI,
            ],
        ],
    ];
}

/**
 * Prerequisites check. No server-side dependency is required: the plugin is
 * purely front-end (JavaScript/CSS), so it is always compatible.
 *
 * @return bool
 */
function plugin_persiandate_check_prerequisites()
{
    return true;
}

/**
 * Configuration check. Nothing to configure.
 *
 * @return bool
 */
function plugin_persiandate_check_config()
{
    return true;
}

/**
 * Install hook. The plugin creates no tables and changes nothing in the
 * database, so there is nothing to do here.
 *
 * @return bool
 */
function plugin_persiandate_install()
{
    return true;
}

/**
 * Uninstall hook. Nothing was created, so nothing has to be removed.
 *
 * @return bool
 */
function plugin_persiandate_uninstall()
{
    return true;
}

/**
 * Initialise the plugin: register the CSS/JS assets that turn every GLPI
 * date field and date label into the Persian (Jalali) calendar.
 *
 * @return void
 */
function plugin_init_persiandate()
{
    global $PLUGIN_HOOKS;

    // Mark the plugin as CSRF compliant (required by GLPI to load its hooks).
    $PLUGIN_HOOKS['csrf_compliant']['persiandate'] = true;

    // Front-end assets. Order matters:
    //   1) jquery-bridge      : guarantees a global window.jQuery for the libs
    //   2) persian-date       : Jalali date engine (leap years, conversions)
    //   3) persian-datepicker : the visual Jalali calendar widget
    //   4) persiandate        : our glue code that swaps GLPI pickers/labels
    $PLUGIN_HOOKS['add_javascript']['persiandate'] = [
        'js/jquery-bridge.js',
        'lib/persian-date.min.js',
        'lib/persian-datepicker.min.js',
        'js/persiandate.js',
    ];

    $PLUGIN_HOOKS['add_css']['persiandate'] = [
        'lib/persian-datepicker.min.css',
        'css/persiandate.css',
    ];
}

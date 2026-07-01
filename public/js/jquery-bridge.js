/**
 * jQuery bridge
 * -------------------------------------------------------------------------
 * The bundled persian-datepicker library expects a global `jQuery`.
 * GLPI exposes jQuery as the global `$`, so we make sure `window.jQuery`
 * points to it before the library scripts are evaluated.
 */
window.jQuery = window.jQuery || window.$;

/**
 * Persian Date for GLPI
 * -------------------------------------------------------------------------
 * Turns GLPI's Gregorian date UI into the Persian (Jalali) calendar without
 * touching the database. Two things happen:
 *
 *   1. Date INPUTS  - GLPI builds its date fields with flatpickr using an
 *      `altInput`: a hidden field holds the real Gregorian value (Y-m-d
 *      H:i:s, the one submitted to the server) and a visible field shows it
 *      to the user. We remove flatpickr from each field and attach a real
 *      Jalali calendar (persian-datepicker) to a new visible input, while
 *      writing the Gregorian value back into GLPI's hidden field. The data
 *      sent to the server therefore stays exactly the same.
 *
 *   2. Date LABELS  - Read-only Gregorian dates rendered as text (ticket
 *      lists, tables, tooltips ...) are converted to Jalali on the fly.
 *
 * Disabling the plugin removes these assets, so every date is Gregorian
 * again immediately.
 * -------------------------------------------------------------------------
 */
(function () {
    'use strict';

    /**
     * Run a callback as soon as the DOM is ready.
     * @param {Function} fn
     */
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    /**
     * Left-pad a number to two digits.
     * @param {number|string} n
     * @returns {string}
     */
    function pad(n) {
        n = '' + n;
        return n.length < 2 ? '0' + n : n;
    }

    /* --------------------------------------------------------------------- *
     *  Gregorian string helpers (local time, mirrors flatpickr's behaviour)
     * --------------------------------------------------------------------- */

    /**
     * Parse a Gregorian "Y-m-d" / "Y-m-d H:i:s" string into a millisecond
     * timestamp, interpreting it as local time (same as flatpickr does).
     * @param {string} value
     * @returns {number|null}
     */
    function parseGregorian(value) {
        var m = ('' + value).match(
            /(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
        );
        if (!m) {
            return null;
        }
        return new Date(
            +m[1], +m[2] - 1, +m[3],
            +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)
        ).getTime();
    }

    /**
     * Format a millisecond timestamp back into the Gregorian string GLPI
     * expects in its hidden field.
     * @param {number} unix
     * @param {boolean} withTime
     * @returns {string}
     */
    function formatGregorian(unix, withTime) {
        var d = new Date(unix);
        var out = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        if (withTime) {
            out += ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }
        return out;
    }

    /* --------------------------------------------------------------------- *
     *  1. Date INPUTS - replace flatpickr with the Jalali calendar
     * --------------------------------------------------------------------- */

    /**
     * Convert a single GLPI date field (a wrapper element that owns a
     * flatpickr instance) into a Persian calendar field.
     * @param {HTMLElement} wrapper
     */
    function convertField(wrapper) {
        if (wrapper.dataset.pdDone) {
            return; // already processed
        }
        var fp = wrapper._flatpickr;
        if (!fp) {
            return; // flatpickr not initialised yet
        }
        wrapper.dataset.pdDone = '1';

        var config = fp.config || {};

        // Leave time-only and multi-date pickers to flatpickr: persian
        // numbers are identical there and a Jalali grid is not relevant.
        if (config.noCalendar || config.mode === 'multiple') {
            return;
        }

        var hasTime = !!config.enableTime;
        var hasSeconds = !!config.enableSeconds;

        // The real <input name="..."> that GLPI submits (Gregorian value).
        var hiddenInput = fp.input;
        if (!hiddenInput) {
            return;
        }
        var gregorian = (hiddenInput.value || '').trim();

        // Drop flatpickr; it un-hides the hidden input and removes its altInput.
        try {
            fp.destroy();
        } catch (e) {
            /* ignore */
        }

        // Keep the Gregorian field in the DOM (still submitted) but invisible.
        hiddenInput.style.display = 'none';

        // Build the visible Jalali input shown to the user.
        var view = document.createElement('input');
        view.type = 'text';
        view.className = hiddenInput.className || 'form-control';
        view.setAttribute('autocomplete', 'off');
        view.setAttribute('dir', 'ltr');
        hiddenInput.parentNode.insertBefore(view, hiddenInput.nextSibling);

        var options = {
            format: hasTime ? 'YYYY/MM/DD HH:mm:ss' : 'YYYY/MM/DD',
            persianDigit: true,
            autoClose: true,
            initialValue: false,
            // Write the Gregorian value back into GLPI's hidden field.
            altField: hiddenInput,
            altFieldFormatter: function (unix) {
                return formatGregorian(unix, hasTime);
            },
            timePicker: {
                enabled: hasTime,
                second: { enabled: hasSeconds }
            },
            toolbox: {
                calendarSwitch: { enabled: false }
            }
        };

        // Pre-fill from any existing Gregorian value (edit forms).
        var initialUnix = gregorian ? parseGregorian(gregorian) : null;
        if (initialUnix != null) {
            options.initialValue = '' + initialUnix;
            options.initialValueType = 'unix';
        }

        try {
            window.jQuery(view).persianDatepicker(options);
        } catch (e) {
            // On failure, restore the original Gregorian field gracefully.
            hiddenInput.style.display = '';
            if (view.parentNode) {
                view.parentNode.removeChild(view);
            }
            wrapper.dataset.pdDone = '';
            return;
        }

        // Let GLPI's calendar icon open the picker too.
        var icon = wrapper.querySelector('[data-toggle], .fa-calendar-alt, .fa-calendar');
        if (icon) {
            icon.addEventListener('click', function () {
                try {
                    window.jQuery(view).data('datepicker').show();
                    view.focus();
                } catch (e) {
                    /* ignore */
                }
            });
        }
    }

    /**
     * Find and convert every GLPI date field in a given subtree.
     * @param {Document|HTMLElement} [root]
     */
    function scanFields(root) {
        if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.persianDatepicker) {
            return; // libraries not ready
        }
        // GLPI wraps date fields in `.flatpickr` (modern forms) or in a
        // legacy `#showdate{rand}` element.
        var nodes = (root || document).querySelectorAll('[id^="showdate"], div.flatpickr');
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i]._flatpickr) {
                convertField(nodes[i]);
            }
        }
    }

    /* --------------------------------------------------------------------- *
     *  2. Date LABELS - convert read-only Gregorian text to Jalali
     * --------------------------------------------------------------------- */

    /**
     * Convert a Gregorian date (year, month, day) to Jalali [jy, jm, jd].
     * Algorithm by Kazimierz M. Borkowski / jalaali-js (public domain),
     * accurate over the supported calendar range.
     * @param {number} gy
     * @param {number} gm
     * @param {number} gd
     * @returns {number[]}
     */
    function toJalali(gy, gm, gd) {
        var gYear = gy - 1600;
        var gMonth = gm - 1;
        var gDay = gd - 1;

        var gDayNo = 365 * gYear
            + Math.floor((gYear + 3) / 4)
            - Math.floor((gYear + 99) / 100)
            + Math.floor((gYear + 399) / 400);

        var gMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        for (var i = 0; i < gMonth; i++) {
            gDayNo += gMonthDays[i];
        }
        // Add a leap day for the current Gregorian year if needed.
        if (gMonth > 1 && ((gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0)) {
            gDayNo++;
        }
        gDayNo += gDay;

        var jDayNo = gDayNo - 79;
        var jNp = Math.floor(jDayNo / 12053);
        jDayNo %= 12053;

        var jYear = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
        jDayNo %= 1461;

        if (jDayNo >= 366) {
            jYear += Math.floor((jDayNo - 1) / 365);
            jDayNo = (jDayNo - 1) % 365;
        }

        var jMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
        var jMonth = 0;
        for (; jMonth < 11 && jDayNo >= jMonthDays[jMonth]; jMonth++) {
            jDayNo -= jMonthDays[jMonth];
        }
        return [jYear, jMonth + 1, jDayNo + 1];
    }

    /**
     * Replace Gregorian dates inside a piece of text with their Jalali form.
     * Both "Y-m-d" and "Y-m-d H:i[:s]" patterns are handled.
     * @param {string} text
     * @returns {string}
     */
    function convertText(text) {
        return text
            .replace(
                /\b(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) (\d{2}:\d{2}(?::\d{2})?)/g,
                function (match, y, mo, d, time) {
                    var j = toJalali(+y, +mo, +d);
                    return j[0] + '/' + pad(j[1]) + '/' + pad(j[2]) + ' ' + time;
                }
            )
            .replace(
                /\b(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g,
                function (match, y, mo, d) {
                    var j = toJalali(+y, +mo, +d);
                    return j[0] + '/' + pad(j[1]) + '/' + pad(j[2]);
                }
            );
    }

    // Tags whose text content must never be rewritten.
    var SKIP_TAGS = {
        SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1
    };

    /**
     * True when the node lives inside the Persian datepicker popup (which is
     * already Jalali and must be left alone).
     * @param {Node} node
     * @returns {boolean}
     */
    function inDatepicker(node) {
        return !!(node.closest &&
            node.closest('.datepicker-plot-area, .datepicker-container'));
    }

    /**
     * Walk a DOM subtree and convert Gregorian dates found in text nodes.
     * @param {Node} node
     */
    function walk(node) {
        if (!node) {
            return;
        }
        if (node.nodeType === 3) { // text node
            var original = node.nodeValue;
            var converted = convertText(original);
            if (converted !== original) {
                node.nodeValue = converted;
            }
        } else if (node.nodeType === 1 && !SKIP_TAGS[node.tagName] && !inDatepicker(node)) {
            for (var i = 0; i < node.childNodes.length; i++) {
                walk(node.childNodes[i]);
            }
        }
    }

    /* --------------------------------------------------------------------- *
     *  Bootstrap
     * --------------------------------------------------------------------- */
    ready(function () {
        scanFields();
        walk(document.body);

        // GLPI builds some forms slightly after DOM ready; retry a few times.
        [200, 600, 1200, 2500].forEach(function (delay) {
            setTimeout(scanFields, delay);
        });

        // Handle AJAX-loaded forms, modals and dynamically inserted content.
        var debounce;
        var observer = new MutationObserver(function (mutations) {
            clearTimeout(debounce);
            debounce = setTimeout(scanFields, 120);

            for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var node = added[j];
                    if (node.nodeType === 1 && !inDatepicker(node)) {
                        walk(node);
                    } else if (node.nodeType === 3) {
                        walk(node);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });

})();

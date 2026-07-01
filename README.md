# Persian Date — GLPI Plugin

A plugin for **GLPI** that displays every date using the **Persian (Jalali) calendar**, without changing the database structure or data. All dates keep being stored as **Gregorian** in the database — only the display layer becomes Jalali. Disabling the plugin instantly reverts everything back to Gregorian.

---

## ✨ Features

- A **real Jalali date-picker** on every date field (ticket date, SLA dates, etc.) instead of the default Gregorian calendar.
- **The database stays untouched** — the Gregorian value (`Y-m-d H:i:s`) is kept in a hidden field and submitted to the server exactly as before.
- Read-only dates in lists and tables (e.g. the ticket list) are also converted to Jalali on the fly.
- Correct **leap-year** handling and Jalali month lengths.
- Dates are shown with **Persian digits**.
- Works with **AJAX** forms and **modals** (newly added content is converted automatically).
- Zero configuration — just install and enable.

## ✅ Compatibility

- **GLPI 10.0.x** and **GLPI 11.0.x** (tested on 10.0.17 and 11.0.8, PHP 8.3)

## 📦 Installation

1. Clone the repository into GLPI's plugins directory, naming the folder `persiandate`:

   ```bash
   cd glpi/plugins
   git clone https://github.com/hamedpc/glpi-persiandate.git persiandate
   ```

   The final path must be:

   ```
   glpi/plugins/persiandate/
   ```

   > If you downloaded the ZIP instead, extract it and make sure the folder is named exactly `persiandate`.

2. In GLPI, go to **Setup → Plugins**.

3. Next to "Persian Date", click **Install**, then **Enable**.

4. Do one hard refresh so the new assets load:

   - Windows / Linux: `Ctrl + Shift + R`
   - macOS: `Cmd + Shift + R`

That's it — all date fields are now Jalali.

## 🗂 Project structure

```
persiandate/
├── setup.php                     plugin definition and hook registration
└── public/                       web-served assets (required by GLPI 11)
    ├── js/
    │   ├── jquery-bridge.js      ensures a global window.jQuery for the libraries
    │   └── persiandate.js        core logic (picker replacement + text conversion)
    ├── css/
    │   └── persiandate.css       visual tweaks
    └── lib/                      third-party libraries (MIT license)
        ├── persian-date.min.js
        ├── persian-datepicker.min.js
        └── persian-datepicker.min.css
```

## ⚙️ How it works

GLPI builds its date fields with `flatpickr` using an `altInput`: a **hidden** field holds the real Gregorian value (`Y-m-d H:i:s`, the one submitted to the server) and a **visible** field is shown to the user.

For each date field, this plugin:

1. Detects and removes the `flatpickr` instance.
2. Attaches a **Jalali** visible input using the `persian-datepicker` library.
3. On selection, writes the equivalent **Gregorian** value back into GLPI's hidden field.

So the interface is Jalali, but everything stored or submitted stays Gregorian — which is why disabling the plugin never corrupts any data.

> **Example:** selecting "15 Tir 1405" in the UI stores `2026-07-06 13:28:32` in the database.

## 📄 License

- This plugin's code is released under the **GPL v2+** license (consistent with GLPI itself).
- The libraries bundled in `lib/` are licensed under the **MIT** license:
  - [persian-date](https://github.com/babakhani/PersianDate)
  - [persian-datepicker](https://github.com/babakhani/pwt.datepicker)

## 👤 Author

**Hamed Zakeri**
GitHub: [@hamedpc](https://github.com/hamedpc)

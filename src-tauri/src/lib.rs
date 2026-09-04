mod projector;

use tauri::Manager;

const MAIN_LABEL: &str = "main";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Not done via `maximized: true` in tauri.conf.json on purpose. On macOS an
      // undecorated window can't use native zoom, so tao "maximizes" it by copying
      // the *main* screen's visible frame — the screen of whichever window has
      // focus. At creation time that's the previously active app, which on a
      // multi-monitor setup lands the window on the wrong screen. Focusing first
      // makes the main screen the one this window actually lives on.
      if let Some(window) = app.get_webview_window(MAIN_LABEL) {
        window.set_focus()?;
        window.maximize()?;
      }

      Ok(())
    })
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![projector::open_projector])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

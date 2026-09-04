use tauri::webview::WebviewWindowBuilder;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl};

pub const PROJECTOR_LABEL: &str = "projector";

#[tauri::command]
pub async fn open_projector(app: AppHandle, monitor_name: Option<String>) -> Result<(), String> {
  if let Some(window) = app.get_webview_window(PROJECTOR_LABEL) {
    window.show().map_err(|e| e.to_string())?;
    return Ok(());
  }

  let monitors = app.available_monitors().map_err(|e| e.to_string())?;
  let primary = app.primary_monitor().ok().flatten();

  // Preferência: monitor pedido -> primeiro não-primário. NUNCA cai para o
  // primário: uma janela borderless + always_on_top sobre a tela do
  // operador é pior que não projetar (modo ensaio).
  let target = monitor_name
    .and_then(|name| monitors.iter().find(|m| m.name() == Some(&name)).cloned())
    .or_else(|| {
      monitors
        .iter()
        .find(|m| primary.as_ref().is_some_and(|p| p.position() != m.position()))
        .cloned()
    });

  let Some(target) = target else {
    return Err("Nenhuma tela secundária disponível — modo ensaio".into());
  };

  let position = *target.position();
  let size = *target.size();

  let window = WebviewWindowBuilder::new(&app, PROJECTOR_LABEL, WebviewUrl::App("projector.html".into()))
    .title("Poiema — Projeção")
    .decorations(false)
    .resizable(false)
    .skip_taskbar(true)
    .always_on_top(true)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

  window
    .set_position(PhysicalPosition::new(position.x, position.y))
    .map_err(|e| e.to_string())?;
  window
    .set_size(PhysicalSize::new(size.width, size.height))
    .map_err(|e| e.to_string())?;
  window.show().map_err(|e| e.to_string())?;

  Ok(())
}

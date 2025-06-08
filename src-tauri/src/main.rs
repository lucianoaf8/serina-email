// SERINA Tauri Main Process
// Handles window management, system integration, and communication with Python backend

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    Window, WindowBuilder, WindowUrl,
};

#[derive(Debug, Serialize, Deserialize)]
struct BackendRequest {
    endpoint: String,
    method: String,
    body: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct EmailRequest {
    email_id: String,
    reply_text: Option<String>,
    title: Option<String>,
    description: Option<String>,
    minutes: Option<u32>,
}

// Tauri Commands (exposed to frontend)

#[tauri::command]
async fn show_settings_window(window: Window) -> Result<(), String> {
    match window.get_window("settings") {
        Some(settings_window) => {
            settings_window.show().map_err(|e| e.to_string())?;
            settings_window.center().map_err(|e| e.to_string())?;
            settings_window.set_focus().map_err(|e| e.to_string())?;
        }
        None => {
            WindowBuilder::new(
                &window.app_handle(),
                "settings",
                WindowUrl::App("/settings".into()),
            )
            .title("SERINA Settings")
            .inner_size(600.0, 500.0)
            .resizable(false)
            .center()
            .build()
            .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn show_reminder_popup(window: Window, email_count: u32) -> Result<(), String> {
    // Close existing reminder if open
    if let Some(reminder_window) = window.get_window("reminder") {
        reminder_window.close().map_err(|e| e.to_string())?;
    }

    // Create new reminder popup
    let reminder_window = WindowBuilder::new(
        &window.app_handle(),
        "reminder",
        WindowUrl::App(format!("/reminder?count={}", email_count).into()),
    )
    .title("SERINA Reminder")
    .inner_size(320.0, 120.0)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .build()
    .map_err(|e| e.to_string())?;

    // Position at bottom-right of screen
    if let Ok(monitor) = reminder_window.current_monitor() {
        if let Some(monitor) = monitor {
            let size = monitor.size();
            let scale_factor = monitor.scale_factor();
            let x = (size.width as f64 / scale_factor) - 340.0;
            let y = (size.height as f64 / scale_factor) - 140.0;
            reminder_window
                .set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }))
                .map_err(|e| e.to_string())?;
        }
    }

    // Auto-close after 10 seconds
    let reminder_handle = reminder_window.clone();
    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
        let _ = reminder_handle.close();
    });

    Ok(())
}

#[tauri::command]
async fn show_system_notification(title: String, body: String) -> Result<(), String> {
    tauri::api::notification::Notification::new("com.serina.emailassistant")
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn backend_request(
    endpoint: String,
    method: String,
    body: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:8000{}", endpoint);

    let mut request = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        _ => return Err("Unsupported HTTP method".to_string()),
    };

    if let Some(body_data) = body {
        request = request
            .header("Content-Type", "application/json")
            .body(body_data);
    }

    let response = request.send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}: {}", response.status(), response.status()));
    }

    response.text().await.map_err(|e| e.to_string())
}

// Email-specific commands for easier frontend usage

#[tauri::command]
async fn get_emails(limit: Option<u32>) -> Result<String, String> {
    let limit = limit.unwrap_or(20);
    backend_request(format!("/emails?limit={}", limit), "GET".to_string(), None).await
}

#[tauri::command]
async fn get_email(email_id: String) -> Result<String, String> {
    backend_request(format!("/emails/{}", email_id), "GET".to_string(), None).await
}

#[tauri::command]
async fn send_reply(email_id: String, reply_text: String) -> Result<String, String> {
    let body = serde_json::json!({
        "reply_text": reply_text
    });
    backend_request(
        format!("/emails/{}/reply", email_id),
        "POST".to_string(),
        Some(body.to_string()),
    )
    .await
}

#[tauri::command]
async fn mark_email_read(email_id: String) -> Result<String, String> {
    backend_request(
        format!("/emails/{}/mark-read", email_id),
        "POST".to_string(),
        None,
    )
    .await
}

#[tauri::command]
async fn create_task_from_email(
    email_id: String,
    title: String,
    description: String,
) -> Result<String, String> {
    let body = serde_json::json!({
        "title": title,
        "description": description
    });
    backend_request(
        format!("/emails/{}/create-task", email_id),
        "POST".to_string(),
        Some(body.to_string()),
    )
    .await
}

#[tauri::command]
async fn snooze_email(email_id: String, minutes: Option<u32>) -> Result<String, String> {
    let minutes = minutes.unwrap_or(60);
    backend_request(
        format!("/emails/{}/snooze?minutes={}", email_id, minutes),
        "POST".to_string(),
        None,
    )
    .await
}

#[tauri::command]
async fn get_unread_count() -> Result<String, String> {
    backend_request("/emails/unread-count".to_string(), "GET".to_string(), None).await
}

// LLM commands

#[tauri::command]
async fn summarize_email(email_content: String) -> Result<String, String> {
    let body = serde_json::json!({
        "email_content": email_content
    });
    backend_request(
        "/llm/summarize".to_string(),
        "POST".to_string(),
        Some(body.to_string()),
    )
    .await
}

#[tauri::command]
async fn generate_task_from_email(email_content: String) -> Result<String, String> {
    let body = serde_json::json!({
        "email_content": email_content
    });
    backend_request(
        "/llm/generate-task".to_string(),
        "POST".to_string(),
        Some(body.to_string()),
    )
    .await
}

#[tauri::command]
async fn generate_reply(email_content: String, instruction: Option<String>) -> Result<String, String> {
    let body = serde_json::json!({
        "email_content": email_content,
        "instruction": instruction.unwrap_or_default()
    });
    backend_request(
        "/llm/generate-reply".to_string(),
        "POST".to_string(),
        Some(body.to_string()),
    )
    .await
}

// Configuration commands

#[tauri::command]
async fn get_config() -> Result<String, String> {
    backend_request("/config".to_string(), "GET".to_string(), None).await
}

#[tauri::command]
async fn save_config(config: serde_json::Value) -> Result<String, String> {
    let body = serde_json::json!({
        "config": config
    });
    backend_request(
        "/config".to_string(),
        "POST".to_string(),
        Some(body.to_string()),
    )
    .await
}

#[tauri::command]
async fn health_check() -> Result<String, String> {
    backend_request("/health".to_string(), "GET".to_string(), None).await
}

// Window control commands

#[tauri::command]
async fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
async fn maximize_window(window: Window) -> Result<(), String> {
    if window.is_maximized().map_err(|e| e.to_string())? {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
async fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

fn main() {
    // Create system tray
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let settings = CustomMenuItem::new("settings".to_string(), "Settings");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(settings)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "settings" => {
                    let _ = app.emit_all("show-settings", {});
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            show_settings_window,
            show_reminder_popup,
            show_system_notification,
            backend_request,
            get_emails,
            get_email,
            send_reply,
            mark_email_read,
            create_task_from_email,
            snooze_email,
            get_unread_count,
            summarize_email,
            generate_task_from_email,
            generate_reply,
            get_config,
            save_config,
            health_check,
            minimize_window,
            maximize_window,
            close_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
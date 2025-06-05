from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse # Optional, for testing
import uvicorn
import json
import asyncio

# Placeholder for actual service imports
# from .llm_service import LLMClient
# from .storage import load_config, init_db

app = FastAPI()

# In-memory store for active WebSocket connections (simple example)
active_connections: list[WebSocket] = []

# HTML for a simple WebSocket test page (optional)
html = """
<!DOCTYPE html>
<html>
    <head>
        <title>WebSocket Test</title>
    </head>
    <body>
        <h1>WebSocket Test</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://localhost:8000/ws/electron");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""

@app.get("/")
async def get_test_page(): # Optional: for testing WebSocket from a browser
    return HTMLResponse(html)

@app.websocket("/ws/electron")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"Client connected: {websocket.client}")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message: {data} from {websocket.client}")
            try:
                message = json.loads(data)
                # TODO: Process message based on 'action' or 'type'
                # e.g., if message.get("action") == "summarize":
                #     summary = await llm_service.summarize_email(message.get("payload"))
                #     await websocket.send_json({"type": "summary_result", "payload": summary})
                response = {"status": "received", "original_message": message}
                await websocket.send_json(response)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON format"})
            except Exception as e:
                print(f"Error processing message: {e}")
                await websocket.send_json({"error": str(e)})
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print(f"Client disconnected: {websocket.client}")
    except Exception as e:
        print(f"Unhandled WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

async def broadcast_message(message: str):
    # Example: send a message to all connected clients
    for connection in active_connections:
        await connection.send_text(message)

# Placeholder for the main backend logic/entry point
# This would typically be in backend/main.py

# To run this IPC server directly (for testing):
# uvicorn ipc_server:app --reload --port 8000

if __name__ == "__main__":
    # This is usually started by the Electron main process or a script
    # init_db() # Initialize database if needed
    # config = load_config() # Load configuration
    # llm_client = LLMClient(api_key=config.get("llmConfig", {}).get("openaiApiKey"))
    print("Starting IPC server on ws://localhost:8000/ws/electron")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

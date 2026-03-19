#!/usr/bin/env python3
import sys, struct, json, os, socket, threading

LOG_FILE = "/tmp/ff_bridge_debug.log"
sys.stderr = open(LOG_FILE, "a")

SOCKET_PATH = "/tmp/firefox_cli_tabs.sock"
socks_awaiting_responses = []


def log(message):
    with open(LOG_FILE, "a") as f:
        f.write(f"{message}\n")


def send_to_firefox(message):
    content = json.dumps(message).encode("utf-8")
    log(f"out to firefox: {content}")
    sys.stdout.buffer.write(struct.pack("I", len(content)))
    sys.stdout.buffer.write(content)
    sys.stdout.buffer.flush()


def handle_cli_commands():
    if os.path.exists(SOCKET_PATH):
        os.remove(SOCKET_PATH)
    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.bind(SOCKET_PATH)
    server.listen(1)

    while True:
        conn, _ = server.accept()
        data = conn.recv(1024).decode("utf-8").strip()
        log(f"in from stdin: {data}")
        msg = json.loads(data)
        msg_type = msg.get("type")
        if msg_type == "close_domain":
            send_to_firefox({"type": "close_domain", "domain": msg.get("domain")})
        elif msg_type == "query_tabs":
            send_to_firefox({"type": "query_tabs"})
        else:
            conn.sendall(json.dumps({"error": "Unknown command"}).encode("utf-8"))
            continue
        socks_awaiting_responses.append(conn)


threading.Thread(target=handle_cli_commands, daemon=True).start()

send_to_firefox({"type": "native_ready"})
log("starting up")
while True:
    try:
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            break
        length = struct.unpack("I", raw_length)[0]
        message = json.loads(sys.stdin.buffer.read(length).decode("utf-8"))
        log(f"in from firefox: {json.dumps(message)}")

        if socks_awaiting_responses:
            log(f"forwarding message to awaiting socket")
            sock = socks_awaiting_responses.pop(0)
            sock.sendall(json.dumps(message, indent=2).encode("utf-8"))
            sock.close()
        else:
            log(f"no awaiting socket, dropping message")
    except EOFError:
        break

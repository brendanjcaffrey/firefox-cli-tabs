import net from "node:net";

const SOCKET_PATH = "/tmp/firefox_cli_tabs.sock";
const TIMEOUT_MS = 5000;

export type Tab = {
  id: number;
  windowId: number;
  active: boolean;
  title: string;
  url: string;
};

type Response = { type?: string; error?: string; tabs?: Tab[]; tab?: Tab };

function send(message: object): Promise<Response> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(SOCKET_PATH);
    let data = "";

    socket.setTimeout(TIMEOUT_MS, () => {
      socket.destroy();
      reject(new Error("Timed out waiting for Firefox"));
    });
    socket.on("connect", () => socket.write(JSON.stringify(message)));
    socket.on("data", (chunk: Buffer) => (data += chunk.toString("utf-8")));
    socket.on("error", () => reject(new Error("Couldn't connect to Firefox. Is the CLI Tabs extension running?")));
    socket.on("end", () => {
      try {
        const response = JSON.parse(data) as Response;
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      } catch {
        reject(new Error("Invalid response from Firefox"));
      }
    });
  });
}

export async function queryTabs(): Promise<Tab[]> {
  const response = await send({ type: "query_tabs" });
  return response.tabs ?? [];
}

export async function focusTab(id: number): Promise<void> {
  await send({ type: "focus_tab", id });
}

export async function closeTabs(ids: number[]): Promise<Tab[]> {
  const response = await send({ type: "close_tabs", ids });
  return response.tabs ?? [];
}

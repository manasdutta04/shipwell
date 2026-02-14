import http from "node:http";
import { exec } from "node:child_process";
import { platform } from "node:os";

function openBrowser(url: string) {
  const plat = platform();
  if (plat === "darwin") exec(`open "${url}"`);
  else if (plat === "win32") exec(`start "" "${url}"`);
  else exec(`xdg-open "${url}"`);
}

export interface AuthResult {
  name: string;
  email: string;
  uid: string;
  photo?: string;
}

export function startAuthFlow(baseUrl: string): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", "http://localhost");

      if (url.pathname === "/callback") {
        const name = url.searchParams.get("name") || "";
        const email = url.searchParams.get("email") || "";
        const uid = url.searchParams.get("uid") || "";
        const photo = url.searchParams.get("photo") || undefined;

        // CORS headers so shipwell.app can reach this local server
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");

        server.close();
        resolve({ name, email, uid, photo });
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      openBrowser(`${baseUrl}/cli-auth?port=${port}`);
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Authentication timed out (5 minutes)"));
    }, 5 * 60 * 1000);
  });
}

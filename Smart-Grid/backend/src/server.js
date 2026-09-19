import http from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createStore } from "./db.js";
import { ensureDemoCustomer } from "./seed.js";

const config = loadConfig();
const store = createStore(config.dataFile);

if (config.seedDemoUser && (await ensureDemoCustomer(store))) {
  console.log("Created demo account: CUSTOMER001 / Demo@123");
}

const server = http.createServer(createApp({ store, config }));

server.listen(config.port, () => {
  console.log(`SmartGrid API listening on http://localhost:${config.port}`);
  if (config.serveFrontend) {
    console.log(`Plain HTML version:     http://localhost:${config.port}/`);
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

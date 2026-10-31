import { once } from "node:events";
import { test as base, request } from "@playwright/test";
import { createTasksServer } from "../../src/api.js";

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export const test = base.extend({
  api: async ({}, use) => {
    const server = createTasksServer();
    let apiContext;

    try {
      const listening = once(server, "listening");
      server.listen(0, "127.0.0.1");
      await listening;

      const address = server.address();
      apiContext = await request.newContext({
        baseURL: `http://127.0.0.1:${address.port}`,
      });

      await use(apiContext);
    } finally {
      if (apiContext) {
        await apiContext.dispose();
      }

      if (server.listening) {
        await closeServer(server);
      }
    }
  },
});

export { expect } from "@playwright/test";

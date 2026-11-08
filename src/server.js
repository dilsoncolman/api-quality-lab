import { createTasksServer } from "./api.js";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error("PORT must be an integer between 0 and 65535.");
  process.exitCode = 1;
} else {
  const server = createTasksServer();

  server.once("error", (error) => {
    console.error(`Task API could not start: ${error.message}`);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    const address = server.address();
    console.log(`Task API listening at http://${host}:${address.port}`);
  });
}

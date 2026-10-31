import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

function sendJson(response, statusCode, data, error = null) {
  response.writeHead(statusCode, {
    "Content-Type": JSON_CONTENT_TYPE,
  });
  response.end(JSON.stringify({ data, error }));
}

function sendSuccess(response, statusCode, data) {
  sendJson(response, statusCode, data);
}

function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, null, { code, message });
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.code = "INVALID_JSON";
    throw error;
  }
}

function sendTaskNotFound(response) {
  sendError(response, 404, "TASK_NOT_FOUND", "Task not found.");
}

export function createTasksServer() {
  const tasks = new Map();

  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    try {
      if (request.method === "GET" && url.pathname === "/tasks") {
        sendSuccess(response, 200, [...tasks.values()]);
        return;
      }

      if (request.method === "POST" && url.pathname === "/tasks") {
        let body;

        try {
          body = await readJsonBody(request);
        } catch (error) {
          if (error.code === "INVALID_JSON") {
            sendError(response, 400, "INVALID_JSON", error.message);
            return;
          }

          throw error;
        }

        const title = typeof body?.title === "string" ? body.title.trim() : "";

        if (!title) {
          sendError(response, 400, "INVALID_TASK_TITLE", "Task title is required.");
          return;
        }

        const task = {
          id: randomUUID(),
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        tasks.set(task.id, task);
        sendSuccess(response, 201, task);
        return;
      }

      const completeMatch = url.pathname.match(/^\/tasks\/([^/]+)\/complete$/);
      if (request.method === "PATCH" && completeMatch) {
        const task = tasks.get(completeMatch[1]);

        if (!task) {
          sendTaskNotFound(response);
          return;
        }

        task.completed = true;
        sendSuccess(response, 200, task);
        return;
      }

      const taskMatch = url.pathname.match(/^\/tasks\/([^/]+)$/);
      if (request.method === "DELETE" && taskMatch) {
        const task = tasks.get(taskMatch[1]);

        if (!task) {
          sendTaskNotFound(response);
          return;
        }

        tasks.delete(task.id);
        sendSuccess(response, 200, task);
        return;
      }

      sendError(response, 404, "ROUTE_NOT_FOUND", "Route not found.");
    } catch {
      if (response.headersSent) {
        response.destroy();
        return;
      }

      sendError(response, 500, "INTERNAL_ERROR", "An unexpected server error occurred.");
    }
  });
}

import { Buffer } from "node:buffer";
import { expect, test } from "../fixtures/api.fixture.js";

async function expectJsonContentType(response) {
  expect(response.headers()["content-type"]).toContain("application/json");
}

async function expectSuccess(response, statusCode) {
  expect(response.status()).toBe(statusCode);
  await expectJsonContentType(response);

  const body = await response.json();
  expect(body.error).toBeNull();
  return body.data;
}

async function expectError(response, statusCode, code) {
  expect(response.status()).toBe(statusCode);
  await expectJsonContentType(response);

  expect(await response.json()).toEqual({
    data: null,
    error: {
      code,
      message: expect.any(String),
    },
  });
}

test("lists tasks in the standard JSON envelope", async ({ api }) => {
  const response = await api.get("/tasks");
  const tasks = await expectSuccess(response, 200);

  expect(tasks).toEqual([]);
});

test("creates and lists a task with a trimmed title and valid fields", async ({ api }) => {
  const createResponse = await api.post("/tasks", {
    data: { title: "  Review the API contract  " },
  });
  const task = await expectSuccess(createResponse, 201);

  expect(task).toMatchObject({
    id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    title: "Review the API contract",
    completed: false,
  });
  expect(Number.isNaN(Date.parse(task.createdAt))).toBe(false);
  expect(new Date(task.createdAt).toISOString()).toBe(task.createdAt);

  const listResponse = await api.get("/tasks");
  const listedTasks = await expectSuccess(listResponse, 200);
  expect(listedTasks).toContainEqual(task);
});

test("rejects a request without the title field", async ({ api }) => {
  const response = await api.post("/tasks", { data: {} });

  await expectError(response, 400, "INVALID_TASK_TITLE");
});

test("rejects an empty title", async ({ api }) => {
  const response = await api.post("/tasks", { data: { title: "" } });

  await expectError(response, 400, "INVALID_TASK_TITLE");
});

test("rejects a whitespace-only title", async ({ api }) => {
  const response = await api.post("/tasks", { data: { title: "  \t  " } });

  await expectError(response, 400, "INVALID_TASK_TITLE");
});

test("rejects malformed JSON", async ({ api }) => {
  const response = await api.post("/tasks", {
    data: Buffer.from('{ "title": '),
    headers: { "content-type": "application/json" },
  });

  await expectError(response, 400, "INVALID_JSON");
});

test("completes a task created by the same test", async ({ api }) => {
  const createResponse = await api.post("/tasks", {
    data: { title: "Complete the test fixture" },
  });
  const createdTask = await expectSuccess(createResponse, 201);

  const completeResponse = await api.patch(`/tasks/${createdTask.id}/complete`);
  const completedTask = await expectSuccess(completeResponse, 200);

  expect(completedTask).toMatchObject({
    id: createdTask.id,
    title: "Complete the test fixture",
    completed: true,
  });
});

test("deletes a task created by the same test", async ({ api }) => {
  const createResponse = await api.post("/tasks", {
    data: { title: "Delete the test fixture" },
  });
  const createdTask = await expectSuccess(createResponse, 201);

  const deleteResponse = await api.delete(`/tasks/${createdTask.id}`);
  const deletedTask = await expectSuccess(deleteResponse, 200);
  expect(deletedTask).toEqual(createdTask);

  const listResponse = await api.get("/tasks");
  const remainingTasks = await expectSuccess(listResponse, 200);
  expect(remainingTasks).not.toContainEqual(expect.objectContaining({ id: createdTask.id }));
});

test("returns a structured 404 when completing an unknown task", async ({ api }) => {
  const response = await api.patch("/tasks/does-not-exist/complete");

  await expectError(response, 404, "TASK_NOT_FOUND");
});

test("returns a structured 404 when deleting an unknown task", async ({ api }) => {
  const response = await api.delete("/tasks/does-not-exist");

  await expectError(response, 404, "TASK_NOT_FOUND");
});

test("returns a structured 404 for an unsupported route", async ({ api }) => {
  const response = await api.get("/unsupported");

  await expectError(response, 404, "ROUTE_NOT_FOUND");
});

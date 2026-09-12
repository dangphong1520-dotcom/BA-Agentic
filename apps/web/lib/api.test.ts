import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { workspaceDtoSchema } from "@ba/contracts";

vi.mock("server-only", () => ({}));
const mocked = vi.hoisted(() => ({ host: "127.0.0.1:3000" }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: mocked.host }),
}));
import { apiRequest } from "./api";

describe("local server API boundary", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    mocked.host = "127.0.0.1:3000";
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BA_DEV_UI_ENABLED", "true");
    vi.stubEnv("BA_DEV_UI_TOKEN", "test-token-not-a-real-credential");
    vi.stubEnv("BA_API_ORIGIN", "http://127.0.0.1:3001");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fails closed in production without calling the API", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      apiRequest("/workspaces", workspaceDtoSchema.array()),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("requires explicit local UI enablement", async () => {
    vi.stubEnv("BA_DEV_UI_ENABLED", "false");
    await expect(
      apiRequest("/workspaces", workspaceDtoSchema.array()),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects a non-local request host", async () => {
    mocked.host = "untrusted.example";
    await expect(
      apiRequest("/workspaces", workspaceDtoSchema.array()),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("does not send credentials to a remote API origin", async () => {
    vi.stubEnv("BA_API_ORIGIN", "https://untrusted.example");
    await expect(
      apiRequest("/workspaces", workspaceDtoSchema.array()),
    ).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("keeps credentials in the server fetch and returns validated data only", async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    expect(await apiRequest("/workspaces", workspaceDtoSchema.array())).toEqual(
      [],
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/v1/workspaces",
      expect.objectContaining({
        redirect: "error",
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token-not-a-real-credential",
        }),
      }),
    );
  });
  it("surfaces conflicts without exposing raw backend responses", async () => {
    fetchMock.mockResolvedValue(
      new Response("private backend detail", { status: 409 }),
    );
    await expect(
      apiRequest("/workspaces", workspaceDtoSchema.array()),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("rejects invalid API data", async () => {
    fetchMock.mockResolvedValue(Response.json([{ id: "invalid" }]));
    await expect(
      apiRequest("/workspaces", workspaceDtoSchema.array()),
    ).rejects.toMatchObject({ status: 502 });
  });
  it("converts connection errors into a safe retry message", async () => {
    fetchMock.mockRejectedValue(new Error("internal detail"));
    await expect(
      apiRequest("/workspaces", workspaceDtoSchema.array()),
    ).rejects.toMatchObject({ status: 503 });
  });
});

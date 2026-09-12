import "server-only";
import { headers } from "next/headers";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  schema: { parse(value: unknown): T },
  init?: { method: "POST" | "PATCH"; body: unknown },
): Promise<T> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host")?.split(":")[0];
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.BA_DEV_UI_ENABLED !== "true" ||
    !["localhost", "127.0.0.1"].includes(host ?? "") ||
    !process.env.BA_DEV_UI_TOKEN
  ) {
    throw new ApiError(
      401,
      "Phiên làm việc chưa sẵn sàng. Hãy kiểm tra cấu hình phát triển của ứng dụng.",
    );
  }
  const origin = new URL(process.env.BA_API_ORIGIN ?? "http://127.0.0.1:3001");
  if (
    origin.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(origin.hostname) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new ApiError(503, "Địa chỉ dịch vụ chưa được cấu hình đúng.");
  }
  let response: Response;
  try {
    response = await fetch(`${origin.origin}/api/v1${path}`, {
      method: init?.method ?? "GET",
      cache: "no-store",
      redirect: "error",
      headers: {
        Authorization: `Bearer ${process.env.BA_DEV_UI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: init ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ApiError(
      503,
      "Chưa kết nối được dịch vụ. Nội dung đang nhập vẫn được giữ lại; hãy thử lại sau.",
    );
  }
  if (!response.ok) {
    const message =
      response.status === 409
        ? "Dự án đã được thay đổi ở phiên khác. Nội dung bạn đang nhập vẫn còn; hãy mở bản mới nhất để đối chiếu trước khi lưu lại."
        : response.status === 404
          ? "Không tìm thấy workspace hoặc dự án, hoặc bạn không có quyền truy cập."
          : response.status === 401
            ? "Phiên làm việc chưa được xác thực. Hãy kiểm tra cấu hình phát triển của ứng dụng."
            : response.status === 400
              ? "Thông tin chưa hợp lệ. Hãy kiểm tra lại các trường nhập."
              : "Dịch vụ chưa xử lý được yêu cầu. Vui lòng thử lại.";
    throw new ApiError(response.status, message);
  }
  try {
    return schema.parse(await response.json());
  } catch {
    throw new ApiError(502, "Dữ liệu trả về chưa hợp lệ. Vui lòng thử lại.");
  }
}

import type { RequirementDto } from "@ba/contracts";

export const typeLabels = {
  BUSINESS: "Nghiệp vụ",
  FUNCTIONAL: "Chức năng",
  NON_FUNCTIONAL: "Phi chức năng",
};
export const priorityLabels = {
  UNDEFINED: "Chưa xác định",
  MUST: "Bắt buộc",
  SHOULD: "Nên có",
  COULD: "Có thể có",
  WONT: "Chưa thực hiện",
};
export const statusLabels: Record<RequirementDto["status"], string> = {
  DRAFT: "Bản nháp",
  CLARIFICATION_REQUIRED: "Cần làm rõ",
  READY_FOR_REVIEW: "Chờ phê duyệt",
  APPROVED: "Đã phê duyệt",
  BASELINED: "Đã chốt baseline",
};
export const textFields = [
  ["description", "Mô tả yêu cầu"],
  ["businessGoal", "Mục tiêu kinh doanh"],
  ["actor", "Tác nhân"],
  ["preconditions", "Điều kiện trước"],
  ["mainFlow", "Luồng chính"],
  ["exceptionFlow", "Luồng ngoại lệ"],
  ["acceptanceCriteria", "Tiêu chí chấp nhận"],
  ["sourceNote", "Ghi chú nguồn và điểm cần xác minh"],
] as const;

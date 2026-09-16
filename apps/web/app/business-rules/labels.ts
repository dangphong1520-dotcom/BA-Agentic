import type { BusinessRuleDto } from "@ba/contracts";

export const priorityLabels: Record<BusinessRuleDto["priority"], string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Khẩn cấp",
};

export const statusLabels: Record<BusinessRuleDto["status"], string> = {
  DRAFT: "Bản nháp",
  APPROVED: "Đã phê duyệt",
  SUPERSEDED: "Đã được thay thế",
};

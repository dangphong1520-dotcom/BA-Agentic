import type { DecisionDto } from "@ba/contracts";

export const statusLabels: Record<DecisionDto["status"], string> = {
  PROPOSED: "Đề xuất",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Đã từ chối",
  SUPERSEDED: "Đã được thay thế",
  DEPRECATED: "Không còn áp dụng",
};

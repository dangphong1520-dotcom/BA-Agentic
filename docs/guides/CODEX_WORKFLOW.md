# Cách dùng Codex trong dự án BA Agent

## Codex đọc gì và theo thứ tự nào

Khi mở repo, Codex đọc `AGENTS.md` như điểm vào. File đó không mô tả toàn bộ sản
phẩm; nó chỉ chỉ đường tới đúng tri thức cần dùng:

```text
AGENTS.md
  ↓
docs/README.md
  ↓
MVP + workflow liên quan
  ↓
SPEC của thay đổi hiện tại
  ↓
code và tests của module
```

Codex không nên đọc mọi file Markdown cho mỗi task. Quá nhiều ngữ cảnh làm giảm
độ chính xác và dễ trộn kiến trúc đích với phạm vi đang được phép build.

## Cách giao một task tốt

Một yêu cầu hiệu quả có bốn phần:

```text
Mục tiêu: người dùng cần làm được gì?
Bối cảnh: module, màn hình hoặc SPEC nào liên quan?
Ràng buộc: rule nghiệp vụ hoặc điều không được phá vỡ?
Hoàn thành khi: hành vi nào chạy được và kiểm tra nào phải đạt?
```

Ví dụ:

```text
Trong dự án BA Agent, bổ sung bộ lọc Findings theo loại và classification.
Đọc AGENTS.md và SPEC-006. Giữ nguyên project scoping và không biến finding
thành fact. Hoàn thành khi API/UI thống nhất, integration tests và local UI đạt,
sau đó commit, push và chờ CI xanh.
```

Bạn không cần chỉ Codex tạo từng file hoặc copy từng lệnh. Hãy mô tả kết quả
nghiệp vụ; Codex tự inspect, lập phạm vi, sửa code, chạy test và báo bằng chứng.

## Khi nào dùng Plan, task mới và worktree

- Dùng Plan khi ý tưởng còn mơ hồ, có nhiều lựa chọn sản phẩm hoặc thay đổi lớn.
- Giữ cùng task khi công việc vẫn là một kết quả liên tục và cần giữ bối cảnh.
- Tạo task mới khi bắt đầu một kết quả độc lập.
- Dùng worktree khi hai task song song có thể sửa cùng repo; mỗi worktree giữ
  một nhánh thay đổi riêng để tránh ghi đè.
- Chỉ dùng nhiều agent cho các phần độc lập, có đầu ra và ranh giới rõ ràng.

## Vai trò của từng lớp Codex

| Công cụ | Dùng cho |
|---|---|
| `AGENTS.md` | quy tắc bền vững của repo |
| SPEC | hành vi cụ thể cần build |
| Skill | quy trình lặp lại nhiều lần với input/output ổn định |
| MCP/App | lấy dữ liệu thay đổi bên ngoài repo |
| Automation | chạy định kỳ sau khi quy trình thủ công đã ổn định |
| Sites | prototype hoặc lightweight app cần publish nhanh |

Không biến mọi tài liệu thành Skill. Trước tiên chạy quy trình vài lần; khi cùng
một prompt và cách kiểm tra lặp lại ổn định, lúc đó mới đóng gói thành Skill.

## Vòng làm việc chuẩn của dự án

```text
Bạn nêu vấn đề BA
  ↓
Codex đọc context và viết/đối chiếu SPEC
  ↓
Codex build một vertical slice
  ↓
typecheck + tests + lint + build
  ↓
kiểm thử trên giao diện local
  ↓
bạn dùng thử và phản hồi
  ↓
Codex iterate hoặc productionize phần đã được chứng minh
```

## Những câu lệnh bạn có thể dùng hằng ngày

- “Đọc AGENTS.md và tiếp tục SPEC tiếp theo dựa trên validation gần nhất.”
- “Cho tôi xem sản phẩm local và giải thích workflow bằng ngôn ngữ BA.”
- “Review thay đổi hiện tại theo product governance, sửa lỗi rồi chạy CI.”
- “Tính năng này chưa rõ; vào Plan và hỏi tôi các quyết định nghiệp vụ cần thiết.”
- “Tách công việc độc lập này sang worktree mới để không ảnh hưởng task hiện tại.”
- “Sau khi quy trình này ổn định, đề xuất xem có nên tạo Skill hay automation.”

## Quyền truy cập

Chỉ cấp quyền rộng cho repo và công cụ bạn tin cậy. Với thao tác local có thể đảo
ngược, Codex có thể tự thực hiện. Các hành động xuất bản, gửi ra bên ngoài hoặc
thay đổi không thể đảo ngược cần được xem như bước cuối sau khi kết quả đã sẵn
sàng để bạn review.

Tham khảo: [Codex best practices](https://developers.openai.com/guides/best-practices).

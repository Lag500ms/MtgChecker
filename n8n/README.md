# n8n AI Orchestration for MTG Checker

## 1. Khởi chạy n8n qua Docker Compose

Tại thư mục `E:\BE\MtgChecker\MtgChecker`, chạy lệnh sau để kéo image và khởi động n8n container:

```bash
docker compose up -d n8n
```

Kiểm tra trạng thái container:
```bash
docker compose ps
```

---

## 2. Truy cập giao diện n8n

1. Mở trình duyệt và truy cập: `http://localhost:5678`
2. Tạo tài khoản quản trị (Admin Owner) lần đầu tiên (Email & Password).

---

## 3. Nhập Workflow mẫu (Import Workflow)

1. Tại màn hình n8n, chọn **Workflows** -> bấm biểu tượng **`...`** (hoặc `Add Workflow`).
2. Chọn **Import from File...** và chọn tệp:
   `E:\BE\MtgChecker\n8n\mtg_judge_workflow.json`
3. Bạn sẽ thấy luồng xử lý hoàn chỉnh gồm:
   - **Webhook In** (Đón nhận request từ Spring Boot tại `/webhook/mtg-judge`)
   - **Intent Classifier & Guardrail** (Phân loại: Ngoài MTG vs Tra cứu thẻ vs Trọng tài luật)
   - **Router** (Rẽ 3 nhánh độc lập)
   - **Respond to Webhook** (Trả kết quả JSON chuẩn)
4. Bấm **Save** và gạt công tắc góc trên bên phải sang **Active** (Kích hoạt).

---

## 4. Kiểm tra Webhook với cURL hoặc Postman

```bash
curl -X POST http://localhost:5678/webhook/mtg-judge \
  -H "Content-Type: application/json" \
  -H "X-MTG-AI-SECRET: tuilanguoidanongthep" \
  -d '{
    "requestId": "test_001",
    "question": "Urza'\''s Saga gặp Blood Moon thì thế nào?",
    "interaction": {
      "cardA": "Urza'\''s Saga",
      "cardB": "Blood Moon"
    }
  }'
```

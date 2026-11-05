# Cẩm Nang Toàn Diện: Cấu Trúc Dữ Liệu, Thuật Toán, Định Lý CAP & Tối Ưu Database
> **Tài liệu ôn luyện tư duy Thiết Kế Hệ Thống & Phỏng vấn Java Backend Fresher / Junior**  
> *Được biên soạn dựa trên kiến trúc thực tế dự án MtgChecker*

---

## MỤC LỤC
1. [Phần 1: Định Lý CAP & Nghệ Thuật Thiết Kế Hệ Thống Backend](#phần-1-định-lý-cap--nghệ-thuật-thiết-kế-hệ-thống-backend)
2. [Phần 2: Bản Đồ 4 Gia Tộc Cấu Trúc Dữ Liệu Cốt Lõi](#phần-2-bản-đồ-4-gia-tộc-cấu-trúc-dữ-liệu-cốt-lõi)
   - [2.1. Cặp đấu kinh điển: ArrayList vs LinkedList & Bản chất Con Trỏ](#21-cặp-đấu-kinh-điển-arraylist-vs-linkedlist--bản-chất-con-trỏ)
   - [2.2. Gia tộc Băm: HashMap / HashSet & Bộ đôi hashCode() / equals()](#22-gia-tộc-băm-hashmap--hashset--bộ-đôi-hashcode--equals)
   - [2.3. Gia tộc Cây: Tree, TreeMap / TreeSet & B-Tree trong Database](#23-gia-tộc-cây-tree-treemap--treeset--b-tree-trong-database)
   - [2.4. Quy tắc một chiều: Stack (LIFO) vs Queue (FIFO)](#24-quy-tắc-một-chiều-stack-lifo-vs-queue-fifo)
3. [Phần 3: Bảng Ma Trận Đánh Đổi Hiệu Năng (Trade-off Matrix)](#phần-3-bảng-ma-trận-đánh-đổi-hiệu-năng-trade-off-matrix)
4. [Phần 4: Mẫu Trả Lời Phỏng Vấn Chuẩn Senior](#phần-4-mẫu-trả-lời-phỏng-vấn-chuẩn-senior)
5. [Phần 5: Bí Mật Database: Triết Lý Đánh Đổi Đọc - Ghi & 5 Loại Index Kèm Code Thực Tế](#phần-5-bí-mật-database-triết-lý-đánh-đổi-đọc---ghi--5-loại-index-kèm-code-thực-tế)
   - [5.1. Triết lý Đọc vs Ghi & Vì sao Web ít người dùng vẫn chậm như rùa?](#51-triết-lý-đọc-vs-ghi--vì-sao-web-ít-người-dùng-vẫn-chậm-như-rùa)
   - [5.2. Hệ thống 3 tầng phòng ngự (Redis Cache ➔ B-Tree Index ➔ Table)](#52-hệ-thống-3-tầng-phòng-ngự-redis-cache--b-tree-index--table)
   - [5.3. Chi tiết 5 loại Index & Storage (Kèm Code SQL & Java)](#53-chi-tiết-5-loại-index--storage-kèm-code-sql--java)
   - [5.4. Bệnh án thực tế MtgChecker: Cơn ác mộng N+1 kép & Code sửa dứt điểm](#54-bệnh-án-thực-tế-mtgchecker-cơn-ác-mộng-n1-kép--code-sửa-dứt-điểm)
6. [Phần 6: Bản Chất Index: Vị Trí, Vòng Đời & Mẹo Bulk Sync Data](#phần-6-bản-chất-index-vị-trí-vòng-đời--mẹo-bulk-sync-data)
7. [Phần 7: Kiến Trúc Bảo Mật: Access Token vs Refresh Token (Bộ Đôi Hoàn Hảo)](#phần-7-kiến-trúc-bảo-mật-access-token-vs-refresh-token-bộ-đôi-hoàn-hảo)
8. [Phần 8: Xử Lý Đồng Thời (Concurrency): Khóa Bi Quan vs Khóa Lạc Quan](#phần-8-xử-lý-đồng-thời-concurrency-khóa-bi-quan-vs-khóa-lạc-quan)
9. [Phần 9: Bản Chất Giao Dịch (@Transactional) & Tương Tác Với Try-Catch](#phần-9-bản-chất-giao-dịch-transactional--tương-tác-với-try-catch)
10. [Phần 10: Nghệ Thuật Ghi Log: Vì Sao Cấm Tuyệt Đối System.out.println?](#phần-10-nghệ-thuật-ghi-log-vì-sao-cấm-tuyệt-đối-systemoutprintln)

---

# PHẦN 1: ĐỊNH LÝ CAP & NGHỆ THUẬT THIẾT KẾ HỆ THỐNG BACKEND

```text
                             ĐỊNH LÝ CAP
                                  ▲
                                 / \
                                /   \
                     C ────────/─────\──────── A
          (CONSISTENCY)       /       \       (AVAILABILITY)
         Nhất quán dữ liệu   /         \     Luôn sẵn sàng phục vụ
                            /           \
                           /             \
                          └───────────────┘
                                  P
                        (PARTITION TOLERANCE)
                      Chịu đựng được khi đứt mạng
```

### 1. Ý nghĩa 3 chữ cái C - A - P:
* **C — Consistency (Tính Nhất Quán)**: Mọi node/server trong hệ thống đều nhìn thấy **cùng một phiên bản dữ liệu mới nhất** tại cùng một thời điểm. Không bao giờ có chuyện server này trả về số dư cũ, server kia trả về số dư mới.
* **A — Availability (Tính Sẵn Sàng)**: Hệ thống **luôn luôn phản hồi thành công** khi người dùng gửi request, không bao giờ báo lỗi `500 Server Error` hoặc treo quay tròn.
* **P — Partition Tolerance (Khả năng chịu lỗi phân vùng mạng)**: Hệ thống **vẫn tiếp tục sống sót** kể cả khi đường truyền mạng giữa các cụm server bị mất kết nối (đứt cáp, chập chờn).

### 2. Định luật cốt tử: "Chỉ được chọn 2 trong 3 (2/3)"
Trong thế giới thực tế, **mạng Internet chắc chắn sẽ có lúc bị lỗi hoặc đứt cáp $\rightarrow$ Yếu tố P là BẮT BUỘC PHẢI CHẤP NHẬN**.

Vì vậy, khi sự cố mạng xảy ra, kỹ sư phần mềm bắt buộc phải lựa chọn giữa **CP** hoặc **AP**:

| Mô hình | Đánh đổi | Hành vi khi đứt mạng | Lĩnh vực áp dụng | Ví dụ Công nghệ |
| :---: | :---: | :--- | :--- | :--- |
| **CP** | **Hy sinh A** *(Chấp nhận báo lỗi)* | Khóa giao dịch lại, thà báo lỗi bảo trì chứ dứt khoát **không để sai lệch dữ liệu**. | Ngân hàng, Sàn chứng khoán, Quản lý tài khoản, Giao dịch ví. | PostgreSQL, MongoDB, Redis (Single master). |
| **AP** | **Hy sinh C** *(Chấp nhận dữ liệu trễ)* | Ứng dụng **luôn luôn chạy mượt**, chấp nhận dữ liệu có thể bị cũ vài giây/vài phút (*Eventual Consistency*). | Mạng xã hội, Lướt Feed, Xem giá hàng hóa, Đếm View/Like. | Cassandra, DynamoDB, Cache Redis, CDN. |
| **CA** | **Bỏ qua P** | Chỉ tồn tại trên **1 máy chủ vật lý đơn lẻ (Single Node)** không có mạng phân tán. Rút dây mạng ra là mất phân tán. | MySQL / PostgreSQL chạy localhost máy cá nhân. |

---

### 3. Cách chính em áp dụng CAP vào dự án MtgChecker:

* **Tính năng AP (Tra cứu thẻ bài & Cache-Aside)**:
  * Khi người dùng xem giá thẻ bài, hệ thống đọc từ **Redis Cache / PostgreSQL (`cached_cards`)** trả về tức thì (**Availability A**).
  * Kể cả khi mạng quốc tế sang Scryfall API bị sập (**Partition P**), người dùng vẫn xem được dữ liệu thẻ bình thường mà không bị crash app.
  * Đánh đổi: Giá hiển thị có thể trễ vài chục phút so với giá sàn mới nhất (**Hy sinh Consistency C** $\rightarrow$ chấp nhận Nhất quán sau).
* **Tính năng CP (Quản lý User & Phân quyền Dynamic RBAC)**:
  * Khi gán Role mới hoặc đổi quyền hạn tài khoản, hệ thống dùng **`@Transactional`** ghi trực tiếp xuống PostgreSQL. 
  * Nếu Database chập chờn, giao dịch bị Rollback ngay lập tức (**Hy sinh A để giữ C**), tuyệt đối không để xảy ra trường hợp phân quyền "ảo".

---

# PHẦN 2: BẢN ĐỒ 4 GIA TỘC CẤU TRÚC DỮ LIỆU CỐT LÕI

## 2.1. Cặp đấu kinh điển: ArrayList vs LinkedList & Bản chất Con Trỏ

```text
ArrayList:   [Phần tử 0] [Phần tử 1] [Phần tử 2] [Phần tử 3]   <-- Các ô nhớ nằm san sát nhau trên RAM
LinkedList:  [Node A] ──con trỏ next──► [Node B] ──con trỏ next──► [Node C]   <-- Nằm rải rác trên RAM
```

### Bản chất "Con Trỏ" (Pointer / Reference) là gì?
* Trong `LinkedList`, các phần tử nằm tản mát khắp nơi trên RAM. Để tìm thấy nhau, mỗi phần tử (Node) phải cầm trên tay **mảnh giấy ghi địa chỉ ô nhớ của người đứng sau (`next`) và người đứng trước (`prev`)**. Mảnh giấy ghi địa chỉ đó gọi là **Con trỏ**.
* **Hậu quả**: Mỗi Node phải cõng thêm **2 con trỏ (8 bytes + 8 bytes) + vỏ bọc Node (16 bytes) = tốn thêm ~32 bytes RAM rác** cho mỗi phần tử!

### Bảng Đánh Đổi:
* **`ArrayList`**:
  * ✅ **ĐƯỢC**: Truy xuất ngẫu nhiên siêu tốc $O(1)$ (`list.get(500)` là nhảy thẳng tới địa chỉ ô nhớ). Cực kỳ tiết kiệm RAM.
  * ❌ **MẤT**: Chèn hoặc xóa ở đầu/giữa mảng rất chậm $O(n)$ vì phải **"đôn lên hoặc lùi lại"** cả một hàng dài phía sau.
* **`LinkedList`**:
  * ✅ **ĐƯỢC**: Chèn/Xóa ở vị trí hiện tại cực nhanh $O(1)$ (chỉ việc tháo dây buộc vào Node mới, không bắt ai dời ghế).
  * ❌ **MẤT**: Truy xuất ngẫu nhiên cực chậm $O(n)$ (phải đi bộ lần mò theo con trỏ từ đầu đến cuối). Cực kỳ tốn RAM.
* 👉 **Quy tắc thực tế**: $99\%$ trường hợp trong Backend chọn **`ArrayList`**.

---

## 2.2. Gia tộc Băm: HashMap / HashSet & Bộ đôi hashCode() / equals()

```text
Dữ liệu đầu vào: "Black Lotus" ──► Thuật toán hashCode() ──► Mã băm: 2045621
                                                                  │
                                                                  ▼
                                                      Nhảy thẳng tới ngăn tủ số 2045621
                                                      (Tốc độ O(1) - Không cần tìm kiếm!)
```

### Bộ đôi bất khả phân ly: `hashCode()` và `equals()`
1. **`hashCode()` (Số ngăn tủ)**:
   * Biến dữ liệu bên trong Object thành một **con số nguyên `int`**.
   * Dùng để nhảy ngay tới vị trí ngăn tủ trong mảng băm ($O(1)$).
2. **`equals()` (Xác thực chắc chắn)**:
   * Nếu có 2 Object khác nhau nhưng vô tình tính ra cùng 1 mã hash (hiện tượng *Đụng độ mã băm - Hash Collision*), Java sẽ dùng tiếp hàm `equals()` để so sánh ruột xem có thực sự là một hay không.

### Luật Chơi Bất Biến Giữa 2 Hàm (Câu hỏi phỏng vấn số 1):
* **Nếu `a.equals(b) == true`** $\rightarrow$ Bắt buộc `a.hashCode() == b.hashCode()`.
* **Nếu `a.hashCode() != b.hashCode()`** $\rightarrow$ Chắc chắn 100% `a.equals(b) == false`.
* **Nếu `a.hashCode() == b.hashCode()`** $\rightarrow$ Chưa chắc bằng nhau (phải gọi `equals()` kiểm tra lại).

---

## 2.3. Gia tộc Cây: Tree, TreeMap / TreeSet & B-Tree trong Database

### 1. `TreeMap` / `TreeSet` (Dùng Cây Đỏ-Đen / Red-Black Tree)
* **Bản chất**: Mỗi khi thêm phần tử, cây tự động so sánh: nhỏ hơn rẽ sang TRÁI, lớn hơn rẽ sang PHẢI, và tự xoay cây để cân bằng.
* ✅ **ĐƯỢC**: **Luôn luôn tự động sắp xếp thứ tự 100%** (từ bé đến lớn hoặc A-Z). Rất mạnh khi truy vấn theo dải/khoảng (*Range Query*).
* ❌ **MẤT**: Tốc độ thêm/xóa/tìm chậm hơn HashMap một chút ($O(\log n)$ so với $O(1)$ của HashMap).

### 2. B-Tree (Vũ khí tối thượng của Database PostgreSQL / MySQL Index)
* Vì sao Database hàng chục triệu dòng lại tìm kiếm chỉ mất 2 mili-giây?
* Vì các cột được đánh **Index** thực chất được tổ chức dưới dạng **Cây B-Tree**. Mỗi lần tìm kiếm, Database chặt đôi dữ liệu vứt đi một nửa $\rightarrow$ Với 1 triệu dòng, chỉ cần so sánh tối đa 20 lần là ra kết quả!

---

## 2.4. Quy tắc một chiều: Stack (LIFO) vs Queue (FIFO)

```text
            STACK (Ngăn xếp)                              QUEUE (Hàng đợi)
       (Ống đựng bóng - 1 ĐẦU MỞ)                   (Hàng xếp mua vé - 2 ĐẦU THÔNG)

         VÀO ──► [ Quả bóng 3 ] ──► RA                  VÀO                            RA
                 [ Quả bóng 2 ]                     [Người 3] ──► [Người 2] ──► [Người 1] ──►
                 [ Quả bóng 1 ]
                 └────────────┘
        (Vào Sau cùng ──► Ra Đầu tiên)               (Vào Trước nhất ──► Ra Trước nhất)
                  (LIFO)                                          (FIFO)
```

* **`Stack` (Last In, First Out)**:
  * Ứng dụng: Lưu vết lịch sử để quay ngược thời gian (Nút Undo Ctrl+Z, nút Back trình duyệt, Call Stack trong JVM).
  * Hạn chế: Muốn lấy đáy phải bốc sạch các tầng phía trên.
* **`Queue` (First In, First Out)**:
  * Ứng dụng: Xương sống điều phối tải của hệ thống Backend (Hàng đợi in, Message Queue với **Kafka / RabbitMQ**, gửi email hàng loạt).
  * Hạn chế: Công bằng tuyệt đối, không được phép chen ngang vào giữa hàng.

---

# PHẦN 3: BẢNG MA TRẬN ĐÁNH ĐỔI HIỆU NĂNG (TRADE-OFF MATRIX)

| Cấu trúc dữ liệu | Truy cập ngẫu nhiên | Thêm / Xóa | Tốn RAM | Trật tự sắp xếp | Kịch bản sử dụng thực tế |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`ArrayList`** | ⚡ $O(1)$ | 🐢 $O(n)$ | 🟢 Rất ít | Giữ thứ tự thêm vào | Hiển thị danh sách cuộn màn hình, lấy phần tử theo index. |
| **`LinkedList`** | 🐢 $O(n)$ | ⚡ $O(1)$ | 🔴 Rất tốn | Giữ thứ tự thêm vào | Thêm/xóa liên tục ở đầu hoặc 2 đầu (ít dùng ngoài đời). |
| **`HashMap`** | ⚡ $O(1)$ | ⚡ $O(1)$ | 🟡 Tốn vừa | ❌ Lộn xộn | Tra cứu siêu tốc bằng Key (ID, Mã CCCD, Token Session). |
| **`TreeMap`** | 🟡 $O(\log n)$ | 🟡 $O(\log n)$ | 🟡 Tốn vừa | 📐 Tự sắp xếp 100% | Bảng xếp hạng Leaderboard, tìm dữ liệu theo khoảng giá. |
| **`HashSet`** | ⚡ $O(1)$ | ⚡ $O(1)$ | 🟡 Tốn vừa | ❌ Lộn xộn | **Lọc trùng lặp**, kiểm tra tồn tại quyền hạn (Permissions). |
| **`TreeSet`** | 🟡 $O(\log n)$ | 🟡 $O(\log n)$ | 🟡 Tốn vừa | 📐 Tự sắp xếp 100% | Lọc trùng lặp NHƯNG muốn kết quả tự sắp xếp thứ tự. |
| **`Stack`** | Chỉ xem đỉnh $O(1)$ | $O(1)$ | 🟢 Ít | Đảo ngược | Lịch sử thao tác (Undo/Redo), kiểm tra dấu ngoặc hợp lệ. |
| **`Queue`** | Chỉ xem đầu $O(1)$ | $O(1)$ | 🟢 Ít | Đúng thứ tự đến | Hàng đợi tin nhắn xử lý bất đồng bộ (Kafka/RabbitMQ). |

---

# PHẦN 4: MẪU TRẢ LỜI PHỎNG VẤN CHUẨN SENIOR

### Câu 1: "Em hiểu định lý CAP như thế nào và áp dụng vào dự án MtgChecker ra sao?"
> *"Dạ, định lý CAP chỉ ra rằng trong hệ thống phân tán khi mạng gặp sự cố (Partition Tolerance - P), ta buộc phải chọn giữa Tính Nhất Quán (Consistency - C) hoặc Tính Sẵn Sàng (Availability - A).*  
> *Trong dự án MtgChecker, em áp dụng linh hoạt cả hai:*  
> *1. Với tính năng tra cứu thẻ bài, em thiết kế theo mô hình **AP** bằng cách dùng Cache-Aside với Redis. Em ưu tiên hệ thống luôn phản hồi mượt mà kể cả khi Scryfall API bên thứ ba gặp sự cố mạng, chấp nhận dữ liệu giá bài nhất quán sau (Eventual Consistency).*  
> *2. Với tính năng quản lý tài khoản và phân quyền Dynamic RBAC, em thiết kế theo mô hình **CP** kết hợp `@Transactional` để đảm bảo dữ liệu luôn chính xác 100%, nếu có lỗi thì lập tức rollback chứ không để xảy ra sai lệch quyền hạn."*

### Câu 2: "Tại sao ArrayList thường được dùng nhiều hơn LinkedList dù LinkedList chèn xóa $O(1)$?"
> *"Dạ, vì trong thực tế phần cứng máy tính, `ArrayList` lưu trữ các phần tử trên các dải ô nhớ liên tục nên tận dụng cực kỳ tốt bộ nhớ đệm CPU Cache (CPU Cache Locality), giúp tốc độ đọc $O(1)$ siêu nhanh và tiết kiệm RAM.*  
> *Trong khi đó, `LinkedList` mỗi phần tử phải tốn thêm bộ nhớ lưu 2 con trỏ `next` và `prev` cùng vỏ bọc Node, gây lãng phí bộ nhớ và phân mảnh RAM. Hơn nữa muốn tìm một vị trí bất kỳ để chèn trong `LinkedList`, ta vẫn phải tốn $O(n)$ đi bộ để tìm ra vị trí đó trước khi chèn, nên trên thực tế `LinkedList` thường chậm hơn `ArrayList` trong hầu hết các kịch bản."*

### Câu 3: "Vì sao 2 object equals với nhau thì hashCode bắt buộc phải bằng nhau?"
> *"Dạ, vì các cấu trúc dữ liệu như `HashMap` và `HashSet` hoạt động dựa trên 2 bước:*  
> *Bước 1: Tính `hashCode()` để tìm đúng vị trí ngăn tủ (Bucket).*  
> *Bước 2: Dùng `equals()` để kiểm tra độ trùng lặp bên trong ngăn tủ đó.*  
> *Nếu 2 đối tượng equals bằng true mà hashCode lại khác nhau, chúng sẽ rơi vào 2 ngăn tủ hoàn toàn khác nhau. Khi đó, `HashSet` sẽ không thể nhận diện được sự trùng lặp và sẽ nhét cả 2 đối tượng vào, phá vỡ hoàn toàn nguyên lý chống trùng lặp của Set."*

---

# PHẦN 5: BÍ MẬT DATABASE: TRIẾT LÝ ĐÁNH ĐỔI ĐỌC - GHI & 5 LOẠI INDEX KÈM CODE THỰC TẾ

## 5.1. Triết lý Đọc vs Ghi & Vì sao Web ít người dùng vẫn chậm như rùa?

Quy luật cốt lõi của Database:
> **Muốn ĐỌC (`SELECT`) siêu tốc $\rightarrow$ Bắt buộc phải trả giá bằng việc GHI (`INSERT/UPDATE/DELETE`) bị chậm lại và TỐN THÊM DUNG LƯỢNG Ổ CỨNG.**

### Tại sao một trang web dù chỉ có 1 người truy cập vẫn có thể mất 5 - 10 giây để tải?
1. **Chi phí truyền tín hiệu mạng (Network Round-trips)**:
   * Web Server (Spring Boot) và Database Server nằm trên 2 máy tính vật lý khác nhau.
   * Mỗi câu lệnh SQL gửi qua dây mạng tốn $\sim 5\text{ms}$.
   * Nếu code bị lỗi **N+1 Query** bắn 200 câu lệnh lắt nhắt: $200 \times 5\text{ms} = 1.000\text{ms}$ (**Mất trắng 1 giây** chỉ để dây mạng truyền tín hiệu, chưa tính thời gian xử lý)!
2. **Quét toàn bộ bảng (Full Table Scan)**:
   * Bảng có 1 triệu dòng mà không có Index $\rightarrow$ Database phải đọc từ dòng 1 đến dòng 1.000.000 từ đĩa cứng $\rightarrow$ Nghẽn I/O ổ đĩa, web bị treo!

---

## 5.2. Hệ thống 3 tầng phòng ngự (Redis Cache ➔ B-Tree Index ➔ Table)

Để giải quyết bài toán trên, các hệ thống lớn dùng mô hình 3 tầng phòng thủ:

```text
[ Client Request ]
        │
        ▼
┌───────────────────────────┐
│   TẦNG 1: REDIS CACHE     │ ──(Trúng Cache)──► Trả kết quả ngay (0.001s, đọc từ RAM)
│ (Chấp nhận tốn thêm RAM)  │
└─────────────┬─────────────┘
              │ (Trượt Cache)
              ▼
┌───────────────────────────┐
│   TẦNG 2: B-TREE INDEX    │ ──► Nhảy cóc O(log N) tìm đúng ID sau 3 lần lật đĩa
│(Chấp nhận tốn Ổ cứng SSD) │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│   TẦNG 3: BẢNG DỮ LIỆU    │ ──► Đọc bản ghi và nạp ngược lại vào Redis Cache!
└───────────────────────────┘
```

---

## 5.3. Chi tiết 5 loại Index & Storage (Kèm Code SQL & Java)

### 1. B-Tree Index (Mặc định trong RDBMS: PostgreSQL, MySQL)
* **Nguyên lý**: Cây đa nhánh tự cân bằng, sắp xếp thứ tự theo bảng chữ cái A-Z hoặc số tăng dần.
* **Tốt nhất cho**: So sánh bằng (`=`), so sánh khoảng (`>`, `<`, `BETWEEN`), tìm tiền tố (`LIKE 'Black%'`).
* **Bị vô hiệu khi**: Tìm hậu tố (`LIKE '%Lotus'`).

```sql
-- Cú pháp SQL thuần (PostgreSQL):
CREATE INDEX idx_cached_cards_name ON cached_cards (name);
CREATE INDEX idx_cached_cards_set_collector ON cached_cards (set_code, collector_number);
```

```java
// Cú pháp trong Spring Boot JPA Entity (đang có trong CachedCard.java):
@Entity
@Table(
    name = "cached_cards",
    indexes = {
        @Index(name = "idx_cached_cards_name", columnList = "name"),
        @Index(name = "idx_cached_cards_set_collector", columnList = "set_code, collector_number")
    }
)
public class CachedCard { ... }
```

---

### 2. Hash Index (Chỉ mục Băm)
* **Nguyên lý**: Dùng thuật toán hàm băm `hashCode()`.
* **Tốt nhất cho**: So sánh chính xác $100\%$ (`=`), tốc độ đạt $O(1)$. Cực kỳ tối ưu cho các chuỗi dài ngẫu nhiên như **Token Hash, API Key**.
* **Bị vô hiệu khi**: Không hỗ trợ `ORDER BY`, `>`, `<`, `BETWEEN`.

```sql
-- Cú pháp SQL thuần (PostgreSQL):
-- Dùng cho cột Token bí mật hoặc Mã xác thực không bao giờ cần so sánh lớn/nhỏ
CREATE INDEX idx_refresh_token_hash ON refresh_tokens USING HASH (token_hash);
```

---

### 3. GIN Index (Generalized Inverted Index - Chỉ mục đảo)
* **Nguyên lý**: Tách nhỏ từng từ trong câu văn hoặc từng key trong JSON và đánh chỉ mục ngược.
* **Tốt nhất cho**: **Full-Text Search** (Tìm kiếm bài viết, mô tả luật thẻ bài), Cột kiểu mảng `Array` hoặc cột **`JSONB`** trong PostgreSQL!

```sql
-- Cú pháp SQL thuần (PostgreSQL):
-- 1. Tìm kiếm Full-Text Search trong luật Oracle Text của thẻ bài MTG:
CREATE INDEX idx_cards_oracle_text_gin ON cached_cards USING gin(to_tsvector('english', oracle_text));

-- Câu query tìm kiếm chữ 'flying' ở bất kỳ đâu trong luật:
SELECT * FROM cached_cards 
WHERE to_tsvector('english', oracle_text) @@ to_tsquery('flying');

-- 2. Tìm kiếm trong cột JSONB (ví dụ: cột legalities chứa các thể thức MTG):
CREATE INDEX idx_cards_legalities_gin ON cached_cards USING gin (legalities);
```

---

### 4. GiST / R-Tree (Spatial Index - Chỉ mục không gian)
* **Nguyên lý**: Cây hình học đa chiều (Bounding Boxes), phân chia các vùng tọa độ.
* **Tốt nhất cho**: Bản đồ định vị GPS, tọa độ 2D/3D (Grab, Google Maps, tìm quán ăn gần nhất).

```sql
-- Cú pháp SQL thuần (PostgreSQL kết hợp PostGIS):
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE stores (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100),
    location GEOGRAPHY(Point, 4326)
);

CREATE INDEX idx_stores_location_gist ON stores USING GIST (location);

-- Tìm các cửa hàng bán thẻ bài trong bán kính 5000 mét:
SELECT * FROM stores 
WHERE ST_DWithin(location, ST_MakePoint(106.660172, 10.762622)::geography, 5000);
```

---

### 5. LSM-Tree (Log-Structured Merge-Tree - Trường phái NoSQL Write-Heavy)
* **Nguyên lý**: Đối lập hoàn toàn với B-Tree. Không tìm vị trí trên đĩa để sửa, mà **ghi nối đuôi liên tục vào RAM (MemTable) và file nhật ký (WAL)** $\rightarrow$ Ghi cực nhanh $O(1)$!
* **Tốt nhất cho**: Hệ thống nhận hàng triệu Log/giây, tin nhắn chat, cảm biến IoT.
* **Đại diện**: Apache Cassandra, ScyllaDB, RocksDB, Google Bigtable.

---

## 5.4. Bệnh án thực tế MtgChecker: Cơn ác mộng N+1 kép & Code sửa dứt điểm

### 1. Thủ phạm trong dự án MtgChecker:
* Tại [`Account.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/accounts/entity/Account.java#L49): `@ManyToMany(fetch = FetchType.EAGER) private Set<Role> roles;`
* Tại [`Role.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/accounts/entity/Role.java#L48): `@ElementCollection(fetch = FetchType.EAGER) private Set<String> permissions;`
* Khi gọi `accountRepository.findAll()` $\rightarrow$ Hibernate bắn 1 câu query Account, kéo theo N câu query Role, kéo theo N câu query Permissions $\rightarrow$ **N+1 kép làm nghẽn DB!**

### 2. Code khắc phục chuẩn chuyên gia (Giải pháp tham khảo):

#### Cách 1: Dùng `JOIN FETCH` trong Repository
```java
package com.mtgchecker.accounts.repository;

import com.mtgchecker.accounts.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AccountRepository extends JpaRepository<Account, String> {

    // ✅ Gom toàn bộ Account và Role vào DUY NHẤT 1 CÂU QUERY SQL CÓ JOIN:
    @Query("SELECT DISTINCT a FROM Account a LEFT JOIN FETCH a.roles")
    List<Account> findAllWithRoles();
}
```

#### Cách 2: Dùng `@EntityGraph` của Spring Data JPA (Khuyên dùng)
```java
package com.mtgchecker.accounts.repository;

import com.mtgchecker.accounts.entity.Account;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccountRepository extends JpaRepository<Account, String> {

    // ✅ Báo cho Hibernate tự sinh LEFT JOIN nạp roles trong cùng 1 query:
    @EntityGraph(attributePaths = {"roles"})
    List<Account> findAll();

    // Nạp đa tầng cả roles và permissions trong 1 câu:
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<Account> findByEmailIgnoreCase(String email);
}
```

#### Cách 3: Chuyển sang `FetchType.LAZY` (Best Practice của JPA)
```java
// Trong Account.java:
// Đổi EAGER thành LAZY để không bị tự động load ngầm khi không cần thiết
@ManyToMany(fetch = FetchType.LAZY)
private Set<Role> roles = new HashSet<>();
```

---

# PHẦN 6: BẢN CHẤT INDEX: VỊ TRÍ, VÒNG ĐỜI & MẸO BULK SYNC DATA

### 1. Index nằm ở đâu? Tồn tại bao lâu? Khi nào cập nhật?
* **Ở đâu?**: Nằm vĩnh viễn trên **Ổ CỨNG** (ví dụ volume `mtgchecker_pgdata` trong Docker). Phần mục lục hay dùng được nạp lên **RAM (Buffer Pool)** để CPU đọc tức thì.
* **Tồn tại bao lâu?**: **VĨNH VIỄN**, tắt máy hay restart Docker không mất. Chỉ mất khi chạy lệnh `DROP INDEX`.
* **Khi nào cập nhật?**: **Cập nhật NGAY LẬP TỨC (Real-time)** trong cùng giao dịch với mỗi lệnh `INSERT`, `UPDATE`, `DELETE`.
  * Chính vì vậy, bảng càng nhiều Index thì thao tác Ghi càng bị chậm (vì phải cập nhật cả bảng lẫn sắp xếp lại các cây Index).

### 2. Mẹo tối ưu nạp dữ liệu hàng loạt (Bulk Import Optimization):
Trong dự án MtgChecker khi sync hàng chục ngàn lá bài từ Bulk Data:
```java
// Dùng JdbcTemplate để tắt Index trước khi nạp và bật lại sau khi xong:
public void syncBulkData() {
    jdbcTemplate.execute("DROP INDEX IF EXISTS idx_cached_cards_name");
    try {
        // Nạp 100.000 lá bài với batch 500 (chạy siêu nhanh vì không phải cập nhật Index)
        cachedCardRepository.saveAll(batch);
    } finally {
        // Bắt buộc đặt trong finally để đảm bảo Index luôn được tạo lại dù có lỗi xảy ra!
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cached_cards_name ON cached_cards(name)");
    }
}
```

---

# PHẦN 7: KIẾN TRÚC BẢO MẬT: ACCESS TOKEN VS REFRESH TOKEN (BỘ ĐÔI HOÀN HẢO)

### 1. Tại sao không thể dùng 1 Token duy nhất?
* Nếu cho sống lâu (1 năm) $\rightarrow$ Bị trộm token là hacker chiếm tài khoản cả năm (**Lỗ hổng bảo mật chết người**).
* Nếu cho sống ngắn (15 phút) $\rightarrow$ Cứ 15 phút khách bị văng ra bắt đăng nhập lại (**Trải nghiệm người dùng kinh hoàng**).

### 2. Cơ chế phối hợp của Bộ Đôi:
* **Access Token (Vé vào cổng - Sống ngắn 15 - 30 phút)**: Gửi kèm mọi request API (`Authorization: Bearer <token>`). Không lưu trong Database (Stateless). Bị trộm thì 15 phút sau tự hủy.
* **Refresh Token (Thẻ căn cước trong két - Sống dài 30 - 90 ngày)**: Được lưu trong Database (`refresh_tokens`). Khi Access Token hết hạn (lỗi 401), Mobile App âm thầm gửi Refresh Token lên để xin cấp Access Token mới trong 0.1s mà người dùng không hề hay biết!

### 3. Tiêu chí chọn hạn sống của Refresh Token (Ví dụ: 3 Tháng cho MtgChecker):
* **Mức độ nhạy cảm**: Không giữ tiền tỉ, là app tiện ích/giải trí cho cộng đồng MTG $\rightarrow$ Ưu tiên UX.
* **Nền tảng Mobile**: Người dùng điện thoại ghét đăng nhập lại. Token được bảo vệ an toàn trong SecureStore/Keychain.
* **Cơ chế Thu hồi (Revoke)**: Đã có cột `is_revoked` trong DB. Bất cứ khi nào user bấm Logout hay đổi mật khẩu, server gán `revoked = true` $\rightarrow$ Khóa ngay lập tức kể cả khi token còn hạn 3 tháng!

---

# PHẦN 8: XỬ LÝ ĐỒNG THỜI (CONCURRENCY): KHÓA BI QUAN VS KHÓA LẠC QUAN

```text
       ANH CHÀNG BI QUAN (Pessimistic)                ANH CHÀNG LẠC QUAN (Optimistic)
       "Tôi không tin ai cả! Chắc chắn               "Đời tươi đẹp, hiếm khi ai tranh!
        sẽ có đứa vào cướp của tôi!"                  Cứ đọc tự do, lúc ghi mới check!"
                   │                                                │
                   ▼                                                ▼
         Khóa chặt dữ liệu lại                         Dùng số phiên bản (@Version)
         Ai đến sau: ĐỨNG CHỜ!                         Ai đến sau: BÁO LỖI VĂNG RA!
```

### 1. Khóa Bi Quan (Pessimistic Lock) — Phép khóa Then Cài Cửa:
* **Nguyên lý**: Gài chốt dòng dữ liệu ngay từ lúc đọc bằng `SELECT ... FOR UPDATE`. Người đến sau phải **đứng xếp hàng chờ**.
* **Code JPA**: `@Lock(LockModeType.PESSIMISTIC_WRITE)`
* **Khi nào dùng?**: Giao dịch tiền bạc cực kỳ nhạy cảm, ít người tranh chấp cùng lúc.

### 2. Khóa Lạc Quan (Optimistic Lock) — Dán Tem Số Phiên Bản:
* **Nguyên lý**: Không khóa cửa, ai cũng được đọc. Trên dữ liệu dán số `@Version`.
  * Người đến trước: Cập nhật thành công và đổi `version = version + 1`.
  * Người đến sau: Tìm số version cũ không thấy $\rightarrow$ Bị văng lỗi `OptimisticLockException` và giao dịch bị hủy.
* **Code JPA**: Chỉ cần thêm `@Version private Long version;` vào Entity.
* **Khi nào dùng?**: Hệ thống chịu tải cao, nhiều người đọc, ít xung đột ghi.

---

# PHẦN 9: BẢN CHẤT GIAO DỊCH (@TRANSACTIONAL) & TƯƠNG TÁC VỚI TRY-CATCH

### 1. Bản chất: "All or Nothing" (Được cả hoặc không có gì)
* Gom nhiều câu lệnh SQL thành 1 khối duy nhất.
* Mọi câu lệnh thành công $\rightarrow$ **COMMIT** (Chốt sổ).
* Bất kỳ câu lệnh nào bị nổ lỗi $\rightarrow$ **ROLLBACK** (Quay ngược thời gian, hoàn trả dữ liệu ban đầu).

### 2. Cạm bẫy: Khi `try-catch` "nuốt lỗi" làm tê liệt `@Transactional`
* Nếu dùng `try-catch` nuốt chửng lỗi mà không ném tiếp ra ngoài $\rightarrow$ JVM coi như hàm kết thúc bình thường $\rightarrow$ **`@Transactional` vẫn COMMIT dù bước sau bị lỗi!**
* **3 trường hợp dùng `try-catch` chuẩn mực**:
  1. **Có Kế hoạch B**: Gọi Scryfall lỗi $\rightarrow$ catch để đọc giá cũ trong Database.
  2. **Thao tác phụ**: Giao dịch chính thành công, gửi email cảm ơn bị lỗi $\rightarrow$ catch ghi log, không làm gián đoạn đơn hàng.
  3. **Đổi thông báo lỗi đẹp**: catch lỗi SQL xấu xí $\rightarrow$ ném ra `BadRequestException` để vừa có thông báo đẹp, vừa giúp `@Transactional` biết đường Rollback.

---

# PHẦN 10: NGHỆ THUẬT GHI LOG: VÌ SAO CẤM TUYỆT ĐỐI `System.out.println`?

Trong môi trường Production thực tế, `System.out.println` bị cấm vì **4 tội lớn**:
1. **Khóa luồng (Thread Blocking)**: Ruột của nó có từ khóa `synchronized`. 1.000 luồng chạy qua phải xếp hàng chờ nhau để in chữ $\rightarrow$ App bị đơ nghẽn.
2. **Không có Cấp Độ Log**: Không thể bật/tắt linh hoạt các mức `DEBUG`, `INFO`, `WARN`, `ERROR` qua file config.
3. **Mất trắng khi tắt máy**: Chỉ in ra Terminal trước mắt, không tự lưu vào file, không tự nén `.gz` theo ngày để điều tra sự cố.
4. **Thiếu ngữ cảnh**: Không có ngày giờ mili-giây, không biết luồng nào, class nào bị lỗi.

👉 **Chuẩn mực công nghiệp**: Luôn dùng **`@Slf4j`** của Lombok để ghi log bất đồng bộ, có metadata đầy đủ và tự động xoay vòng file log an toàn.

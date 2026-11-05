# BỘ ĐỀ 50 CÂU TRẮC NGHIỆM THỰC CHIẾN BACKEND (JAVA, SPRING BOOT, POSTGRESQL, DOCKER & SYSTEM DESIGN)
> **Dự án mục tiêu:** `MtgChecker`  
> **Phạm vi kiến thức:** Java Core, Lombok, Spring AOP/Proxy, JPA (N+1/EntityGraph), Concurrency (Optimistic/Pessimistic), PostgreSQL (GIN/B-Tree), Security (JWT/Token Versioning/Filter Chain), Rate Limiting (Bucket4j), Redis Caching (TTL/LRU), Docker (Multi-stage), Design Patterns và JPA vs JDBC.

---

## 📌 HƯỚNG DẪN LÀM BÀI:
* Bộ đề gồm **50 câu hỏi trắc nghiệm** 4 lựa chọn (A, B, C, D).
* Em hãy đọc kỹ từng câu, ghi ra đáp án của mình (ví dụ: `1.A, 2.B, 3.C...` hoặc làm theo từng đợt 10 câu một).
* Sau khi em trả lời xong, thầy sẽ chấm điểm chi tiết và giải thích tường minh từng câu để em khắc sâu kiến thức nhé!

---

### PHẦN 1: JAVA CORE, OOP & LOMBOK (CÂU 1 - 7)

**Câu 1:** Trong Java, sự khác biệt bản chất giữa toán tử `==` và phương thức `.equals()` khi áp dụng cho hai đối tượng (Object) là gì?
A. `==` so sánh nội dung logic bên trong đối tượng, `.equals()` so sánh địa chỉ ô nhớ.  
B. `==` so sánh địa chỉ ô nhớ (tham chiếu), `.equals()` so sánh nội dung logic do class định nghĩa.  
C. Cả hai đều luôn so sánh địa chỉ ô nhớ và không có sự khác biệt nào.  
D. `==` chỉ dùng cho số nguyên `int`, không thể dùng để so sánh hai Object.

**Câu 2:** Tại sao trong Spring Data JPA / Hibernate, các kỹ sư khuyến cáo **KHÔNG NÊN** dùng annotation `@Data` của Lombok trên các `@Entity`?
A. Vì `@Data` không sinh ra getter và setter cho các thuộc tính `private`.  
B. Vì `@Data` làm tăng thời gian khởi động ứng dụng Spring Boot lên gấp 10 lần.  
C. Vì `@Data` tự động sinh `toString()` và `hashCode()` trên mọi trường, dễ gây lỗi `StackOverflowError` trong quan hệ hai chiều và phá vỡ cơ chế Lazy Loading.  
D. Vì Hibernate không thể ánh xạ các Entity có chứa annotation của Lombok.

**Câu 3:** Chuẩn thiết kế Dependency Injection (DI) được khuyến khích nhất trong Spring Boot hiện đại khi kết hợp với Lombok là gì?
A. Dùng `@Autowired` trực tiếp trên các trường (Field Injection).  
B. Khai báo các dependency là `private final` và dùng `@RequiredArgsConstructor` (Constructor Injection).  
C. Viết Setter cho từng dependency và gắn `@Autowired` lên từng Setter (Setter Injection).  
D. Dùng từ khóa `new` trực tiếp trong constructor của Service.

**Câu 4:** Khi ghi đè (override) phương thức `equals()`, quy tắc bắt buộc về "Hợp đồng equals và hashCode" (Contract) trong Java là gì?
A. Nếu hai đối tượng bằng nhau theo `equals()`, giá trị `hashCode()` của chúng bắt buộc phải bằng nhau.  
B. Nếu hai đối tượng có `hashCode()` bằng nhau, chúng bắt buộc phải bằng nhau theo `equals()`.  
C. Hai đối tượng khác nhau bắt buộc phải có `hashCode()` khác nhau.  
D. Không có bất kỳ mối liên hệ ràng buộc nào giữa `equals()` và `hashCode()`.

**Câu 5:** Hậu quả nghiêm trọng nhất nếu Entity dùng `@EqualsAndHashCode` phụ thuộc vào trường khóa chính `@Id` khi lưu vào `HashSet` là gì?
A. Entity bị tự động xóa khỏi Database.  
B. Khi Entity được `persist()`, ID chuyển từ `null` sang có giá trị, làm thay đổi mã băm và khiến `HashSet` không thể tìm thấy hoặc xóa đối tượng đó nữa.  
C. Trình biên dịch Java báo lỗi compilation ngay lập tức.  
D. Hibernate tự động chuyển toàn bộ thuộc tính thành `EAGER`.

**Câu 6:** String trong Java có tính chất bất biến (Immutable). Khi cần nối chuỗi hàng ngàn lần trong một phương thức đơn luồng, lập trình viên nên dùng lớp nào để tối ưu bộ nhớ?
A. `String` thông thường với toán tử `+`.  
B. `StringBuffer` (đồng bộ luồng).  
C. `StringBuilder`.  
D. `ArrayList<Character>`.

**Câu 7:** Biến "Instance" trong Java thực chất là gì?
A. Là một file mã nguồn có đuôi `.java` nằm trên ổ đĩa cứng.  
B. Là một đối tượng cụ thể (Object) được cấp phát và đang chiếm vùng nhớ thật trên bộ nhớ RAM.  
C. Là một phương thức tĩnh `public static void main`.  
D. Là cấu hình interface của Spring Boot.

---

### PHẦN 2: SPRING AOP, PROXY PATTERN & TRANSACTION (CÂU 8 - 14)

**Câu 8:** Annotation `@Transactional` trong Spring Boot hoạt động dựa trên Design Pattern cốt lõi nào?
A. Singleton Pattern.  
B. Proxy Pattern (thông qua Spring AOP).  
C. Factory Pattern.  
D. Observer Pattern.

**Câu 9:** Giả sử trong class `OrderServiceImpl`, phương thức `methodA()` (không có `@Transactional`) gọi nội bộ tới `this.methodB()` (có `@Transactional`). Chuyện gì sẽ xảy ra khi `methodA()` được Controller gọi?
A. Transaction trên `methodB()` vẫn mở và rollback bình thường khi có lỗi.  
B. Transaction trên `methodB()` bị vô hiệu hóa vì lời gọi qua `this` diễn ra trực tiếp trong đối tượng thật, không đi qua Spring Proxy.  
C. Ứng dụng ném ngoại lệ `IllegalStateException` lúc khởi động.  
D. Spring Boot tự động tạo một Transaction mới cho `methodA()`.

**Câu 10:** Trong một phương thức có `@Transactional`, nếu lập trình viên bọc toàn bộ code bằng khối `try-catch` và chỉ ghi log lỗi ở nhánh `catch` mà không `throw` lại Exception, chuyện gì sẽ xảy ra khi Database gặp sự cố?
A. Spring tự động phát hiện lỗi và rollback transaction.  
B. Transaction vẫn được COMMIT thành công vì Proxy không nhận được bất kỳ tín hiệu Exception nào văng ra ngoài.  
C. Server bị treo vĩnh viễn (Deadlock).  
D. Database tự động đóng kết nối và xóa toàn bộ dữ liệu.

**Câu 11:** Theo cơ chế mặc định của Spring Boot, `@Transactional` chỉ tự động rollback khi gặp loại Exception nào?
A. Toàn bộ mọi loại Exception bao gồm cả Checked và Unchecked Exception.  
B. Chỉ `RuntimeException` và `Error` (Unchecked Exception).  
C. Chỉ `IOException` và `SQLException`.  
D. Chỉ khi gặp lỗi `NullPointerException`.

**Câu 12:** Để ép Spring Boot rollback transaction cho TẤT CẢ các loại Exception (kể cả Checked Exception), cú pháp khai báo chuẩn là gì?
A. `@Transactional(readOnly = false)`  
B. `@Transactional(rollbackFor = Exception.class)`  
C. `@Transactional(timeout = 30)`  
D. `@Transactional(propagation = Propagation.NEVER)`

**Câu 13:** Tại sao các kỹ sư khuyến cáo KHÔNG NÊN dùng `System.out.println` để ghi log trong môi trường Production?
A. Vì `System.out.println` làm mất màu chữ trên console.  
B. Vì `System.out.println` thực thi đồng bộ (blocking I/O) có khóa `synchronized`, làm nghẽn luồng xử lý và không hỗ trợ log level hay log rotation.  
C. Vì `System.out.println` tự động ngắt kết nối Database.  
D. Vì Java 21 đã khai tử hoàn toàn lệnh này.

**Câu 14:** Khi sử dụng `@Slf4j`, cú pháp ghi log nào dưới đây giúp tối ưu CPU nhất bằng cách tránh việc nối chuỗi khi log level bị tắt?
A. `log.debug("User id: " + id + ", name: " + name);`  
B. `log.debug(String.format("User id: %s, name: %s", id, name));`  
C. `log.debug("User id: {}, name: {}", id, name);`  
D. `log.debug(new StringBuilder("User id: ").append(id).toString());`

---

### PHẦN 3: SPRING DATA JPA, N+1 QUERY & CONCURRENCY LOCKING (CÂU 15 - 22)

**Câu 15:** Vấn nạn N+1 Query trong Spring Data JPA là hiện tượng gì?
A. Hệ thống thực hiện 1 câu query lấy N bản ghi, sau đó phát sinh thêm N câu query phụ để lấy dữ liệu liên kết của từng bản ghi đó.  
B. Hệ thống bị lỗi cú pháp SQL tại dòng thứ N+1.  
C. Database chỉ cho phép tối đa N+1 người truy cập cùng một lúc.  
D. Thời gian phản hồi của câu query bị nhân lên N+1 lần.

**Câu 16:** Ưu điểm vượt trội của `@EntityGraph` so với việc viết `JOIN FETCH` trong JPQL là gì?
A. `@EntityGraph` giúp câu query chạy nhanh hơn 100 lần so với JDBC.  
B. `@EntityGraph` tách rời việc định nghĩa đồ thị eager fetch khỏi câu truy vấn, giúp tái sử dụng các phương thức mặc định của `JpaRepository` mà không cần viết JPQL thủ công.  
C. `@EntityGraph` không bao giờ gây ra hiện tượng tích đề-các (Cartesian Product).  
D. `@EntityGraph` chỉ hoạt động được trên cơ sở dữ liệu NoSQL.

**Câu 17:** Thuộc tính `attributePaths` trong `@EntityGraph` nhận giá trị là gì?
A. Tên bảng và tên cột trong Database.  
B. Tên thuộc tính (field name) được khai báo trong Entity Java.  
C. Đường dẫn URL của REST API.  
D. Tên của file Repository.

**Câu 18:** Nhược điểm nguy hiểm nhất khi lạm dụng `@EntityGraph` trên phương thức có phân trang `Pageable` cho quan hệ một - nhiều (`@OneToMany`) là gì?
A. Database từ chối kết nối.  
B. Hibernate phải tải toàn bộ hàng ngàn/triệu dòng dữ liệu lên RAM rồi tự cắt trang trong bộ nhớ (In-memory pagination), dễ gây tràn bộ nhớ (`OutOfMemoryError`).  
C. Không thể sắp xếp dữ liệu theo ngày tạo.  
D. Câu query bị chuyển thành native SQL.

**Câu 19:** Giải pháp toàn cục (Global) tối ưu nhất để hạn chế N+1 query khi phân trang hoặc có nhiều quan hệ collection là gì?
A. Chuyển toàn bộ các quan hệ thành `FetchType.EAGER`.  
B. Cấu hình `spring.jpa.properties.hibernate.default_batch_fetch_size: 50` trong `application.yml`.  
C. Tắt hoàn toàn bộ nhớ cache của Hibernate.  
D. Không dùng quan hệ `@OneToMany` trong Entity.

**Câu 20:** Khi 50 người dùng cùng lúc bấm mua 1 lá bài hiếm duy nhất còn lại trong kho, hiện tượng tranh chấp dữ liệu này được gọi là gì?
A. Deadlock.  
B. Race Condition (dẫn đến bán quá số lượng - Overselling).  
C. LazyInitializationException.  
D. Memory Leak.

**Câu 21:** Cơ chế hoạt động của Khóa Lạc Quan (Optimistic Locking) với annotation `@Version` là gì?
A. Khóa cứng bản ghi trong Database ngay khi đọc bằng `SELECT FOR UPDATE`.  
B. Không khóa Database, kiểm tra số hiệu phiên bản (`version`) lúc Update; nếu version trong DB đã bị người khác tăng lên thì ném `OptimisticLockException`.  
C. Bắt tất cả người dùng phải xếp hàng đợi nhau lần lượt.  
D. Tự động hoàn tiền cho người dùng mà không cần kiểm tra.

**Câu 22:** Khi xử lý thanh toán tài chính hoặc trừ hàng tồn kho cực hiếm (Flash sale) có tỉ lệ tranh chấp cực cao, giải pháp khóa nào là an toàn và phù hợp nhất?
A. Optimistic Locking (Khóa lạc quan).  
B. Pessimistic Locking (Khóa bi quan với `PESSIMISTIC_WRITE` / `SELECT FOR UPDATE`).  
C. Không cần khóa, dựa vào độ trễ của mạng.  
D. Tăng thời gian timeout của Transaction lên 10 phút.

---

### PHẦN 4: POSTGRESQL & INDEXING CHUYÊN SÂU (CÂU 23 - 28)

**Câu 23:** Cấu trúc chỉ mục mặc định (Default Index) trong PostgreSQL tối ưu cho tìm kiếm chính xác (`=`), tìm kiếm khoảng (`<`, `>`, `BETWEEN`) và sắp xếp (`ORDER BY`) là gì?
A. Hash Index.  
B. GIN Index (Generalized Inverted Index).  
C. B-Tree Index.  
D. GiST Index.

**Câu 24:** Tại sao Hash Index trong PostgreSQL KHÔNG PHÙ HỢP cho việc tìm kiếm lá bài theo khoảng giá (`price BETWEEN 10 AND 50`)?
A. Vì Hash Index tốn quá nhiều dung lượng ổ cứng.  
B. Vì hàm băm (Hash function) phân bổ dữ liệu ngẫu nhiên, không bảo toàn thứ tự sắp xếp của dữ liệu.  
C. Vì Hash Index chỉ hỗ trợ kiểu dữ liệu chuỗi ký tự.  
D. Vì PostgreSQL đã khai tử Hash Index từ phiên bản 10.

**Câu 25:** Để tìm kiếm siêu tốc bên trong cột `JSONB` của PostgreSQL (ví dụ tìm lá bài có `{"keywords": ["Flying"]}`), loại Index nào là "vũ khí tối thượng"?
A. B-Tree Index.  
B. GIN Index (Generalized Inverted Index).  
C. Brin Index.  
D. Hash Index.

**Câu 26:** Trong PostgreSQL, để tìm kiếm chuỗi mờ ở giữa từ khóa (`%query%` trong `searchByNameLike`) ăn được chỉ mục, ta cần kích hoạt extension nào kết hợp với GIN Index?
A. `uuid-ossp`  
B. `pg_trgm` (Trigram)  
C. `postgis`  
D. `hstore`

**Câu 27:** Quy tắc "Leftmost Prefix" (Tiền tố ngoài cùng bên trái) trong Composite Index `(set_code, rarity, card_name)` quy định điều gì?
A. Câu query chỉ dùng được Index nếu điều kiện `WHERE` có chứa cột ngoài cùng bên trái (`set_code`).  
B. Câu query bắt buộc phải sắp xếp theo thứ tự ngược lại từ phải sang trái.  
C. Bất kỳ cột nào xuất hiện trong `WHERE` cũng đều ăn được Index độc lập.  
D. Chỉ mục chỉ hoạt động cho người thuận tay trái.

**Câu 28:** Trong tác vụ nạp dữ liệu lớn (Bulk Import) hàng trăm ngàn lá bài từ Scryfall, tại sao hệ thống cần Drop Index trước khi nạp và Recreate Index sau khi nạp xong?
A. Để Database không bị khóa bảng (Table Lock).  
B. Để loại bỏ chi phí tính toán cân bằng lại cây Index cho từng dòng chèn vào, giúp tốc độ nạp nhanh gấp 3 - 5 lần.  
C. Vì PostgreSQL bắt buộc phải xóa Index mới cho phép chạy lệnh Insert.  
D. Để xóa sạch dữ liệu cũ trong bảng.

---

### PHẦN 5: BẢO MẬT SPRING SECURITY & JWT (CÂU 29 - 35)

**Câu 29:** Một chuỗi JWT gồm đúng 3 phần ngăn cách bởi dấu chấm (`.`). Thứ tự chính xác của 3 phần đó là gì?
A. Signature . Payload . Header  
B. Header . Payload . Signature  
C. Header . Claims . Metadata  
D. Payload . SecretKey . Signature

**Câu 30:** Phần Payload của JWT có được mã hóa bí mật (Encryption) không? Lập trình viên có được nhét mật khẩu người dùng vào Payload không?
A. Có mã hóa bí mật, có thể nhét mật khẩu thoải mái.  
B. Không được mã hóa (chỉ encode Base64Url công khai hai chiều), tuyệt đối CẤM nhét mật khẩu hay dữ liệu nhạy cảm vào Payload.  
C. Chỉ được mã hóa khi chạy trên môi trường HTTPS.  
D. Tùy thuộc vào việc người dùng dùng trình duyệt Chrome hay Safari.

**Câu 31:** Tại sao hệ thống cần sử dụng cặp bài trùng Access Token (TTL ngắn 15 phút) và Refresh Token (TTL dài 7 ngày) thay vì dùng 1 token duy nhất sống 30 ngày?
A. Để ép người dùng phải nhập lại mật khẩu liên tục.  
B. Để giảm thiểu rủi ro khi Access Token bị lộ (hacker chỉ khai thác được tối đa 15 phút) và hỗ trợ cơ chế thu hồi/cấp mới token mà không bắt người dùng đăng nhập lại.  
C. Vì chuẩn JWT không cho phép một token sống quá 1 ngày.  
D. Để tăng dung lượng lưu trữ trên server.

**Câu 32:** Cơ chế "Token Versioning" giải quyết xuất sắc vấn đề gì trong kiến trúc JWT Stateless?
A. Tự động sửa lỗi chính tả trong email người dùng.  
B. Giúp thu hồi token cũ ngay lập tức (khi Admin đổi quyền, đổi mật khẩu hoặc người dùng logout) mà không cần chờ token hết hạn tự nhiên.  
C. Giúp nén kích thước chuỗi JWT ngắn đi một nửa.  
D. Tự động mã hóa mật khẩu trong Database.

**Câu 33:** Trong Spring Security Filter Chain, nếu một request có Token không hợp lệ hoặc đã hết hạn, Filter cần làm gì?
A. Vẫn gọi `filterChain.doFilter(request, response)` để chuyển sang Controller xử lý.  
B. Bắn mã lỗi `401 Unauthorized`, dừng luồng bằng lệnh `return` và TUYỆT ĐỐI KHÔNG gọi `filterChain.doFilter(request, response)`.  
C. Tự động chuyển hướng request sang trang chủ Google.  
D. Khởi động lại server Spring Boot.

**Câu 34:** Tại sao trong `SecurityConfig` của ứng dụng dùng JWT REST API, ta cần cấu hình `sessionCreationPolicy(SessionCreationPolicy.STATELESS)`?
A. Để Spring Security không tạo và không lưu trữ `HttpSession` trong bộ nhớ server, đảm bảo tính chất phi trạng thái của REST API.  
B. Để tắt hoàn toàn tính năng đăng nhập của ứng dụng.  
C. Để cho phép mọi request đều không cần kiểm tra quyền hạn.  
D. Để ép người dùng phải bật cookie trên trình duyệt.

**Câu 35:** Class `CustomUserDetails` đóng vai trò là Design Pattern nào khi kết nối Entity `Account` riêng của dự án với interface `UserDetails` của Spring Security?
A. Singleton Pattern.  
B. Adapter Pattern.  
C. Builder Pattern.  
D. Decorator Pattern.

---

### PHẦN 6: RATE LIMITING & REDIS CACHING (CÂU 36 - 42)

**Câu 36:** Thuật toán Rate Limiting được triển khai trong thư viện Bucket4j của dự án `MtgChecker` là thuật toán gì?
A. Leaky Bucket (Xô rò rỉ).  
B. Token Bucket (Chiếc xô Token với cơ chế bơm xu liên tục).  
C. Fixed Window Counter (Bộ đếm cửa sổ cố định).  
D. Sliding Window Log (Ghi nhật ký cửa sổ trượt).

**Câu 37:** Khi một Client gửi request vượt quá hạn mức cho phép của RateLimitFilter, mã trạng thái HTTP chuẩn quốc tế và Header kèm theo trả về là gì?
A. HTTP 400 Bad Request kèm header `X-Error`.  
B. HTTP 403 Forbidden kèm header `Location`.  
C. HTTP 429 Too Many Requests kèm header `Retry-After`.  
D. HTTP 500 Internal Server Error kèm header `Server`.

**Câu 38:** Nhược điểm lớn nhất khi lưu các xô Bucket4j trong `ConcurrentHashMap` trên RAM của Java khi scale hệ thống chạy 3 server là gì?
A. Tốc độ kiểm tra bị chậm đi 10 lần.  
B. Hạn mức bị phân mảnh độc lập trên từng server (người dùng có thể gọi gấp 3 lần quy định) và nguy cơ rò rỉ RAM do lưu giữ vĩnh viễn các IP rác.  
C. Java bắt buộc phải khởi động lại mỗi giờ.  
D. Không hỗ trợ giao thức HTTPS.

**Câu 39:** Khái niệm "TTL" (Time-To-Live) trong Redis có ý nghĩa thực tế là gì?
A. Tốc độ truyền tải dữ liệu qua cáp quang.  
B. Thời gian sống (hạn sử dụng) của một Key trong bộ nhớ, quá thời gian này Redis sẽ tự động tiêu hủy Key đó.  
C. Số lần tối đa một Key được phép đọc.  
D. Dung lượng RAM tối đa mà một Key được chiếm dụng.

**Câu 40:** Cơ chế "Sliding Expiration" khi kết hợp Rate Limit với Redis hoạt động như thế nào?
A. Cứ mỗi lần người dùng gửi 1 request hợp lệ, hệ thống lại reset (vặn lại) đồng hồ đếm ngược TTL về mốc ban đầu (ví dụ 5 phút).  
B. Cứ sau 5 phút hệ thống xóa toàn bộ Database một lần.  
C. Người dùng bị trừ gấp đôi số xu sau mỗi phút.  
D. Tự động trượt các request sang ngày hôm sau.

**Câu 41:** Chính sách thu hồi bộ nhớ `allkeys-lru` cấu hình trong Docker của Redis có tác dụng gì khi hacker spam hàng triệu IP khiến RAM chạm trần 256MB?
A. Redis bị sập và ném lỗi OutOfMemoryError.  
B. Redis tự động loại bỏ các Key cũ nhất, ít được truy cập nhất (Least Recently Used) để nhường chỗ cho dữ liệu mới, giúp Redis không bao giờ bị crash.  
C. Redis tự động xóa toàn bộ các lá bài trong Database.  
D. Redis từ chối tất cả mọi kết nối mạng.

**Câu 42:** Khi người dùng tìm kiếm từ khóa `sp` và sau đó tìm từ khóa `p`, tại sao Redis không tận dụng kết quả của `p` cho `sp` mà lưu thành 2 Key riêng biệt?
A. Vì Redis không thể lưu được chữ cái đơn lẻ.  
B. Vì Redis là kho lưu trữ Key-Value (trả nguyên khối kết quả trong 0.1ms), và tập kết quả Top 20 của chữ `p` hoàn toàn không đảm bảo chứa đủ các lá bài bắt đầu bằng `sp`.  
C. Vì cấu hình Redis không cho phép các key có độ dài khác nhau.  
D. Vì bảng chữ cái tiếng Anh không hỗ trợ ghép chữ.

---

### PHẦN 7: DOCKER & VẬN HÀNH THỰC CHIẾN (CÂU 43 - 46)

**Câu 43:** Kỹ thuật "Multi-stage Build" trong `Dockerfile.multistage` của dự án giúp giảm dung lượng image từ ~800MB xuống ~180MB bằng cách nào?
A. Tách riêng Stage 1 dùng JDK+Maven để biên dịch, Stage 2 Runtime chỉ dùng JRE gọn nhẹ và copy duy nhất 1 file `.jar` sang.  
B. Nén toàn bộ file mã nguồn thành file `.zip`.  
C. Xóa bỏ hoàn toàn cơ sở dữ liệu PostgreSQL.  
D. Chỉ cho phép ứng dụng chạy trên hệ điều hành Windows.

**Câu 44:** Trong file `docker-compose.yml`, tại sao Spring Boot kết nối PostgreSQL bằng URL `jdbc:postgresql://db:5432/...` mà không dùng `localhost:5432`?
A. Vì `localhost` chỉ trỏ vào chính container Spring Boot; trong mạng Docker Bridge, Docker cung cấp DNS nội bộ tự động phân giải tên service `db` thành IP của container Postgres.  
B. Vì từ khóa `localhost` bị cấm trong chuẩn Java 21.  
C. Vì cổng 5432 trên máy host bị hỏng.  
D. Để bảo mật không cho người ngoài nhìn thấy cổng kết nối.

**Câu 45:** Cấu hình `depends_on` kết hợp `condition: service_healthy` có ưu điểm gì vượt trội so với `depends_on: [db]` thông thường?
A. Giúp tải image nhanh hơn gấp đôi.  
B. Ép Spring Boot phải đợi đến khi PostgreSQL thực sự sẵn sàng nhận kết nối (thông qua lệnh `pg_isready`), tránh lỗi sập app lúc khởi động.  
C. Tự động tạo bảng Database nếu chưa có.  
D. Giúp tiết kiệm 50% CPU của máy chủ host.

**Câu 46:** Tham số `-XX:MaxRAMPercentage=75.0` trong cấu hình chạy Java container mang lại lợi ích gì?
A. Giới hạn tốc độ mạng của ứng dụng ở mức 75%.  
B. Giúp JVM tự động co giãn bộ nhớ Heap theo đúng 75% dung lượng RAM thực tế được cấp phát cho Container, tránh bị Linux giết tiến trình vì lỗi `OOMKilled`.  
C. Bắt buộc CPU chạy ở mức 75% công suất.  
D. Tự động xóa 25% dữ liệu rác trong database.

---

### PHẦN 8: KIẾN TRÚC TỔNG THỂ: JPA VS JDBC (CÂU 47 - 50)

**Câu 47:** Về mặt tốc độ thực thi thuần túy (Raw Performance), tại sao JDBC luôn nhanh hơn Spring Data JPA (Hibernate)?
A. Vì JDBC chạy trực tiếp trên card đồ họa GPU.  
B. Vì JDBC không phải chịu các chi phí ẩn (overhead) của Hibernate như Reflection, Dirty Checking và First-Level Cache.  
C. Vì JPA bắt buộc phải kết nối qua mạng Internet.  
D. Vì JDBC không cần dùng kết nối Database.

**Câu 48:** Tại sao hơn 85% các dự án doanh nghiệp hiện nay vẫn ưu tiên sử dụng Spring Data JPA cho các nghiệp vụ thông thường?
A. Vì lập trình viên không ai biết viết SQL.  
B. Vì JPA mang lại năng suất lập trình cực cao, code sạch sẽ, tự động sinh hàm CRUD và an toàn kiểu dữ liệu (Type-safety) khi refactor mã nguồn.  
C. Vì các dịch vụ đám mây AWS/GCP chỉ hỗ trợ JPA.  
D. Vì JPA hoàn toàn miễn phí còn JDBC phải trả bản quyền.

**Câu 49:** Trong dự án `MtgChecker`, tại sao chức năng nạp 300.000 lá bài từ Bulk Data và thao tác DDL Index lại được giao cho `JdbcTemplate` thay vì JPA?
A. Vì JPA không hỗ trợ các lệnh DDL (`DROP INDEX`, `CREATE EXTENSION`) và việc lưu hàng chục vạn Entity qua JPA sẽ gây tràn RAM và làm chậm hệ thống nghiêm trọng.  
B. Vì `JdbcTemplate` là công nghệ mới hơn JPA.  
C. Vì Scryfall API bắt buộc phải dùng JDBC.  
D. Để tránh phải viết Unit Test.

**Câu 50:** Mô hình "Kiến trúc Lai (Hybrid Persistence)" tối ưu nhất cho một hệ thống Backend chuyên nghiệp là gì?
A. Chỉ dùng duy nhất một công nghệ từ đầu đến cuối dự án.  
B. Kết hợp linh hoạt: Dùng JPA cho 85% nghiệp vụ CRUD/Auth/Domain để phát triển nhanh và dễ bảo trì; dùng JDBC cho 15% tác vụ nặng (Bulk Import, Thống kê phức tạp, DDL) để ép xung hiệu năng tối đa.  
C. Bỏ hết cơ sở dữ liệu quan hệ và chuyển toàn bộ sang lưu file text trên ổ cứng.  
D. Mỗi bảng trong Database phải dùng một framework khác nhau.

---

🎯 **HẾT 50 CÂU!**  
Em hãy làm bài thật tập trung, ghi lại đáp án của mình (ví dụ: `1-B, 2-C, 3-B...`) rồi gửi cho thầy để thầy chấm điểm và giải đáp cho em nhé! Chúc em làm bài thật tốt!

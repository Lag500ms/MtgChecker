# Cẩm Nang Toàn Diện Về Lombok & Spring Boot Best Practices
> **Dành cho dự án MtgChecker & Ôn luyện phỏng vấn Java Backend Fresher / Junior**

---

## 1. Bản chất của Lombok: Nó hoạt động lúc nào?

* **Lombok hoạt động 100% ở COMPILE-TIME (Thời gian biên dịch)** thông qua cơ chế *Annotation Processing (JSR 269)*.
* Khi bạn gõ lệnh `mvn compile`, Lombok đọc các annotation (`@Getter`, `@RequiredArgsConstructor`...) và **tự động viết thêm mã bytecode tương ứng vào file `.class`** trước khi file `.class` được đóng gói.
* **Ở RUNTIME**: Ứng dụng chạy với tốc độ tối đa, không tốn bất kỳ tài nguyên CPU nào vì các hàm `getter`, `constructor` đã có sẵn trong file `.class`.

---

## 2. Bản đồ "Khi nào dùng Annotation nào?"

```text
                  CÁC TẦNG TRONG DỰ ÁN SPRING BOOT
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ TẦNG XỬ LÝ / THỢ LÀM VIỆC ]                     [ TẦNG DỮ LIỆU / HÀNG HÓA ]
• Controller                                      • JPA Entity (@Entity)
• Service (@Service)                              • DTO Request / Response
• Component (@Component)                          • Configuration Properties
         │                                                 │
         ▼                                                 ▼
👉 @RequiredArgsConstructor                       👉 @Getter, @Setter
👉 @Slf4j                                         👉 @NoArgsConstructor
                                                  👉 @AllArgsConstructor
                                                  👉 @Builder + @Builder.Default
```

---

### Nhóm 1: Tầng Service, Controller, Component (Tiêm Bean / DI)

#### 1. `@RequiredArgsConstructor` (Chân ái cho Dependency Injection)
* **Mục đích**: Sinh ra Constructor chỉ nhận các biến được khai báo với từ khóa **`final`**.
* **Khi nào dùng?**: Dùng trên mọi `@Service`, `@RestController`, `@Component` cần tiêm (inject) các phụ thuộc từ Spring Container.
* **Ví dụ trong dự án**: [`CardServiceImpl.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/cards/service/impl/CardServiceImpl.java)
  ```java
  @Service
  @RequiredArgsConstructor
  public class CardServiceImpl implements ICardService {
      private final ScryfallClient scryfallClient;
      private final CachedCardRepository cachedCardRepository;
      private final ObjectMapper objectMapper;
      // Không cần viết constructor tay! Spring 4.3+ tự động tiêm 3 bean này vào.
  }
  ```

#### 2. `@Slf4j` (Ghi Log chuẩn công nghiệp)
* **Mục đích**: Tự động sinh biến logger `private static final org.slf4j.Logger log = ...`.
* **Khi nào dùng?**: Bất kỳ Class nào cần ghi log (`log.info(...)`, `log.warn(...)`, `log.error(...)`).
* **Ví dụ trong dự án**: [`GlobalExceptionHandler.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/exceptions/GlobalExceptionHandler.java), [`JwtAuthenticationFilter.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/configs/security/JwtAuthenticationFilter.java).

---

### Nhóm 2: Tầng Dữ Liệu (JPA Entity & DTO)

#### 1. `@Getter` & `@Setter`
* **Mục đích**: Tự động sinh các hàm `getXxx()` và `setXxx()`.
* **Khi nào dùng?**: 
  * Gắn trên đầu Class để sinh getter/setter cho toàn bộ thuộc tính.
  * Hoặc gắn trên từng biến cụ thể nếu muốn hạn chế (ví dụ: chỉ `@Getter` cho trường `id` để cấm sửa đổi).

#### 2. `@NoArgsConstructor`
* **Mục đích**: Sinh constructor rỗng (0 tham số): `public Card() {}`.
* **Khi nào dùng?**:
  * **BẮT BUỘC phải có trên mọi JPA `@Entity`** (Hibernate yêu cầu constructor rỗng để có thể instantiate đối tượng trước khi đổ dữ liệu từ SQL vào qua Reflection).
  * Cần thiết cho Jackson khi parse JSON từ Client gửi lên.

#### 3. `@AllArgsConstructor`
* **Mục đích**: Sinh constructor nhận đầy đủ tất cả các thuộc tính của Class.
* **Khi nào dùng?**: Đi kèm với `@Builder` trên các Entity và DTO.

#### 4. `@Builder` & `@Builder.Default`
* **Mục đích**: Áp dụng Design Pattern **Builder** để khởi tạo object uyển chuyển, dễ đọc, không phụ thuộc thứ tự tham số.
* **Lưu ý sống còn**: Những thuộc tính không được truyền trong Builder sẽ mang giá trị mặc định (`null`, `0`, `false`). Nếu muốn giữ giá trị khởi tạo ban đầu, bắt buộc phải dùng **`@Builder.Default`**.
* **Ví dụ trong dự án**: [`Account.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/accounts/entity/Account.java)
  ```java
  @Entity
  @Table(name = "accounts")
  @Getter
  @Setter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class Account {
      @Id
      @GeneratedValue(strategy = GenerationType.UUID)
      private String id;

      private String email;

      @Builder.Default
      private Set<Role> roles = new HashSet<>(); // Có @Builder.Default để không bị biến thành null!

      @Builder.Default
      private boolean active = true;
  }
  ```

---

## 3. Ba Cạm Bẫy Lớn Khi Dùng Lombok (Câu hỏi phỏng vấn hay gặp)

### ⚠️ Bẫy 1: TẠI SAO KHÔNG NÊN DÙNG `@Data` TRÊN JPA ENTITY?
Rất nhiều bạn tiện tay gắn `@Data` lên Class `@Entity`. **Đây là một Anti-pattern nguy hiểm!**
* **Nguyên nhân**: `@Data` tự động sinh ra `@ToString`, `@EqualsAndHashCode`. 
* **Hậu quả**: Khi Entity có quan hệ hai chiều (`@ManyToMany`, `@OneToMany`), hàm `toString()` hoặc `hashCode()` sẽ gọi chéo nhau liên tục tạo thành **vòng lặp vô tận $\rightarrow$ Văng lỗi `StackOverflowError` làm sập server!**
* **Ngoài ra**: Nó còn vô tình kích hoạt các quan hệ `Lazy Loading` tải dữ liệu thừa từ DB lên, làm chậm hệ thống.
* 👉 **Giải pháp chuẩn**: Trên JPA Entity, **tách riêng**: `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`. Không dùng `@Data` bừa bãi!

### ⚠️ Bẫy 2: `@AllArgsConstructor` vs `@RequiredArgsConstructor` trong Spring Service
* Nếu dùng `@AllArgsConstructor` trên Service, nếu class có một biến cấu hình nội bộ (ví dụ: `private int timeout = 5000;`), Lombok sẽ nhét biến `timeout` này vào constructor.
* Spring không tìm thấy Bean nào kiểu `int` để tiêm vào $\rightarrow$ **Sập ứng dụng lúc khởi động!**
* 👉 **Giải pháp chuẩn**: Luôn dùng **`@RequiredArgsConstructor`** cho Service/Controller/Component.

### ⚠️ Bẫy 3: Quên `@Builder.Default` làm mất giá trị mặc định
```java
// ❌ SAI:
@Builder
public class Order {
    private String status = "PENDING"; // Khi Order.builder().build() thì status sẽ bị null!
}

// ✅ ĐÚNG:
@Builder
public class Order {
    @Builder.Default
    private String status = "PENDING"; // Luôn giữ giá trị "PENDING" nếu không gán mới
}
```

---

## 4. Lombok `@Value` vs Java 21 `record` (Hiện Đại vs Cổ Điển)

Dự án `MtgChecker` sử dụng Java 21, vì vậy em sẽ thấy xuất hiện cả **`record`**:
* **Lombok `@Value`**: Tạo ra một Class bất biến (Immutable), mọi trường đều là `private final`, chỉ có getter, không có setter.
* **Java 21 `record`**: Là tính năng chính thức của ngôn ngữ Java (từ Java 14/16+).
* 👉 **Xu hướng hiện đại**: Với các DTO chỉ dùng để truyền dữ liệu một chiều (như [`ScryfallCard.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/cards/service/impl/ScryfallCard.java), [`ScanCardResultResponse.java`](file:///e:/BE/MtgChecker/MtgChecker/src/main/java/com/mtgchecker/cards/dto/response/ScanCardResultResponse.java)), **ưu tiên dùng Java `record`** thay cho class Lombok thông thường vì cú pháp ngắn hơn và là chuẩn gốc của Java.

---

## 5. Bảng Tổng Hợp Nhanh Tra Cứu

| Loại Class | Bộ Annotation Khuyên Dùng | Mục Đích |
| :--- | :--- | :--- |
| **Service / Controller** | `@RequiredArgsConstructor`, `@Slf4j` | Tiêm Bean an toàn (Constructor Injection) & Ghi Log. |
| **JPA Entity** | `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` | Tương thích Hibernate, tránh lỗi vòng lặp của `@Data`. |
| **DTO Request / Response** | Java 21 `record` HOẶC `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` | Dễ dàng tuần tự hóa (Serialize/Deserialize JSON) với Jackson. |
| **Utility / Helper Class** | `@UtilityClass` (Lombok) HOẶC `@Component` + `@Slf4j` | Tự động tạo private constructor, biến toàn bộ hàm thành static. |

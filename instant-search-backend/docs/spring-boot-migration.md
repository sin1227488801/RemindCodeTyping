# Spring Boot移行ロードマップ

## 概要

このドキュメントは、instant-search-backendをFastAPI/PythonからSpring Boot/Javaに移行するための包括的なロードマップを提供します。移行は段階的に実行され、API互換性を維持しながら、Javaエコシステムの利点を活用できるように設計されています。

## 移行の背景と目的

### 現在の技術スタック
- **フレームワーク**: FastAPI (Python)
- **データベース**: SQLite → PostgreSQL
- **ORM**: SQLAlchemy
- **依存性注入**: FastAPI Depends
- **テスト**: pytest
- **ビルド**: Docker + pip

### 移行後の技術スタック
- **フレームワーク**: Spring Boot (Java)
- **データベース**: PostgreSQL
- **ORM**: Spring Data JPA (Hibernate)
- **依存性注入**: Spring IoC Container
- **テスト**: JUnit 5 + TestContainers
- **ビルド**: Maven/Gradle + Docker

### 移行の利点
1. **エンタープライズ対応**: Spring Bootの豊富なエコシステム
2. **パフォーマンス**: JVMの最適化とスケーラビリティ
3. **保守性**: 静的型付けによる安全性向上
4. **運用**: Spring Actuatorによる監視機能
5. **チーム**: Javaエンジニアの豊富な人材プール

## 移行戦略概要

### フェーズ1: 基盤準備（2-3週間）
1. Spring Bootプロジェクト構造の設計
2. ドメインモデルの移植
3. データベース接続とJPA設定

### フェーズ2: コア機能移植（3-4週間）
1. リポジトリ層の実装
2. サービス層の移植
3. 検索機能の実装

### フェーズ3: API層移植（2-3週間）
1. REST Controllerの実装
2. 認証・認可の移植
3. エラーハンドリングの統一

### フェーズ4: 運用機能（1-2週間）
1. ログ・監視機能の実装
2. テストスイートの移植
3. デプロイメント設定

### フェーズ5: 本番移行（1週間）
1. 段階的切り替え
2. 監視とパフォーマンス調整
3. 最終検証

## 詳細移行計画

### 1. プロジェクト構造設計

#### 1.1 Maven/Gradleプロジェクト構造

```
instant-search-backend-java/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── instantsearch/
│   │   │           ├── InstantSearchApplication.java
│   │   │           ├── config/
│   │   │           │   ├── DatabaseConfig.java
│   │   │           │   ├── SecurityConfig.java
│   │   │           │   └── SearchConfig.java
│   │   │           ├── domain/
│   │   │           │   ├── model/
│   │   │           │   ├── repository/
│   │   │           │   ├── service/
│   │   │           │   └── exception/
│   │   │           ├── infrastructure/
│   │   │           │   ├── persistence/
│   │   │           │   ├── search/
│   │   │           │   └── external/
│   │   │           └── presentation/
│   │   │               ├── controller/
│   │   │               ├── dto/
│   │   │               └── exception/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   └── test/
│       ├── java/
│       └── resources/
├── docker/
├── docs/
├── pom.xml (or build.gradle)
└── README.md
```

#### 1.2 依存関係設定 (Maven)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.instantsearch</groupId>
    <artifactId>instant-search-backend</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>17</java.version>
        <testcontainers.version>1.19.0</testcontainers.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        
        <!-- Utilities -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>1.5.5.Final</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

### 2. ドメインモデル移植

#### 2.1 Python → Java エンティティマッピング

**Python Pydantic Model:**
```python
class User(BaseModel):
    id: UUID
    name: str
    email: str
    created_at: datetime
    updated_at: datetime
```

**Java JPA Entity:**
```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "uuid2")
    @Column(columnDefinition = "UUID")
    private UUID id;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(nullable = false, unique = true, length = 255)
    private String email;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // 関連エンティティ
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<StudyBook> studyBooks = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TypingLog> typingLogs = new ArrayList<>();
}
```

#### 2.2 完全なエンティティ定義

```java
// StudyBook Entity
@Entity
@Table(name = "study_books")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyBook {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "uuid2")
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @OneToMany(mappedBy = "studyBook", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Question> questions = new ArrayList<>();
}

// Question Entity
@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "uuid2")
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_book_id", nullable = false)
    private StudyBook studyBook;
    
    @Column(nullable = false, length = 50)
    private String language;
    
    @Column(nullable = false, length = 100)
    private String category;
    
    @Column(nullable = false, length = 50)
    private String difficulty;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TypingLog> typingLogs = new ArrayList<>();
}

// TypingLog Entity
@Entity
@Table(name = "typing_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingLog {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "uuid2")
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;
    
    @Column(nullable = false)
    private Integer wpm;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracy;
    
    @Column(name = "took_ms", nullable = false)
    private Integer tookMs;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}

// LearningEvent Entity
@Entity
@Table(name = "learning_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningEvent {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "uuid2")
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "app_id", nullable = false, length = 100)
    private String appId;
    
    @Column(nullable = false, length = 100)
    private String action;
    
    @Column(name = "object_id")
    private String objectId;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal score;
    
    @Column(name = "duration_ms")
    private Integer durationMs;
    
    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;
}
```

### 3. リポジトリ層移植

#### 3.1 Python Repository → Spring Data JPA

**Python Repository Interface:**
```python
class UserRepository(ABC):
    @abstractmethod
    async def create(self, user: User) -> User
    
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]
```

**Java Spring Data JPA Repository:**
```java
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailCustom(@Param("email") String email);
    
    boolean existsByEmail(String email);
    
    @Modifying
    @Query("UPDATE User u SET u.updatedAt = :now WHERE u.id = :id")
    void updateTimestamp(@Param("id") UUID id, @Param("now") OffsetDateTime now);
}

@Repository
public interface StudyBookRepository extends JpaRepository<StudyBook, UUID> {
    
    List<StudyBook> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    Optional<StudyBook> findByIdAndUserId(UUID id, UUID userId);
    
    @Query("SELECT sb FROM StudyBook sb WHERE sb.user.id = :userId AND sb.title LIKE %:title%")
    List<StudyBook> findByUserIdAndTitleContaining(@Param("userId") UUID userId, @Param("title") String title);
    
    long countByUserId(UUID userId);
}

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    
    List<Question> findByStudyBookIdOrderByCreatedAtDesc(UUID studyBookId);
    
    @Query(value = "SELECT * FROM questions q JOIN study_books sb ON q.study_book_id = sb.id " +
                   "WHERE sb.user_id = :userId ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Question> findRandomByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT q FROM Question q JOIN q.studyBook sb WHERE sb.user.id = :userId AND q.studyBook.id = :studyBookId ORDER BY FUNCTION('RANDOM')")
    Optional<Question> findRandomByStudyBookIdAndUserId(@Param("studyBookId") UUID studyBookId, @Param("userId") UUID userId);
    
    long countByStudyBookId(UUID studyBookId);
}
```

#### 3.2 カスタムリポジトリ実装

```java
// 検索機能用カスタムリポジトリ
public interface QuestionRepositoryCustom {
    List<SearchResult> searchQuestions(String query, UUID userId, int limit);
}

@Repository
public class QuestionRepositoryImpl implements QuestionRepositoryCustom {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public List<SearchResult> searchQuestions(String query, UUID userId, int limit) {
        String sql = """
            SELECT DISTINCT
                q.id,
                q.question,
                q.answer,
                CASE 
                    WHEN q.search_vector @@ plainto_tsquery('english', :query) THEN
                        ts_headline('english', q.question || ' ' || q.answer, plainto_tsquery('english', :query))
                    ELSE
                        q.question || ' ' || q.answer
                END as highlight,
                COALESCE(
                    ts_rank(q.search_vector, plainto_tsquery('english', :query)),
                    similarity(q.question || ' ' || q.answer, :query) * 0.5
                ) as score
            FROM questions q
            JOIN study_books sb ON q.study_book_id = sb.id
            WHERE sb.user_id = :userId
              AND (q.search_vector @@ plainto_tsquery('english', :query)
                   OR (q.question || ' ' || q.answer) % :query)
            ORDER BY score DESC
            LIMIT :limit
            """;
        
        Query nativeQuery = entityManager.createNativeQuery(sql);
        nativeQuery.setParameter("query", query);
        nativeQuery.setParameter("userId", userId);
        nativeQuery.setParameter("limit", limit);
        
        @SuppressWarnings("unchecked")
        List<Object[]> results = nativeQuery.getResultList();
        
        return results.stream()
                .map(row -> SearchResult.builder()
                        .questionId(UUID.fromString((String) row[0]))
                        .question((String) row[1])
                        .answer((String) row[2])
                        .highlight((String) row[3])
                        .score(((Number) row[4]).doubleValue())
                        .build())
                .collect(Collectors.toList());
    }
}
```

### 4. サービス層移植

#### 4.1 Python Service → Java Service

**Python Service:**
```python
class StudyBookService:
    def __init__(self, repository: StudyBookRepository):
        self.repository = repository
    
    async def create_study_book(self, user_id: UUID, title: str, description: str) -> StudyBook:
        study_book = StudyBook(
            id=uuid4(),
            user_id=user_id,
            title=title,
            description=description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return await self.repository.create(study_book)
```

**Java Service:**
```java
@Service
@Transactional
@Slf4j
public class StudyBookService {
    
    private final StudyBookRepository studyBookRepository;
    private final UserRepository userRepository;
    private final StudyBookMapper studyBookMapper;
    
    public StudyBookService(StudyBookRepository studyBookRepository, 
                           UserRepository userRepository,
                           StudyBookMapper studyBookMapper) {
        this.studyBookRepository = studyBookRepository;
        this.userRepository = userRepository;
        this.studyBookMapper = studyBookMapper;
    }
    
    public StudyBookResponseDto createStudyBook(UUID userId, CreateStudyBookRequestDto request) {
        log.info("Creating study book for user: {}, title: {}", userId, request.getTitle());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        
        StudyBook studyBook = StudyBook.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();
        
        StudyBook savedStudyBook = studyBookRepository.save(studyBook);
        
        log.info("Created study book with id: {}", savedStudyBook.getId());
        return studyBookMapper.toResponseDto(savedStudyBook);
    }
    
    @Transactional(readOnly = true)
    public List<StudyBookResponseDto> getStudyBooksByUserId(UUID userId) {
        log.debug("Fetching study books for user: {}", userId);
        
        List<StudyBook> studyBooks = studyBookRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return studyBooks.stream()
                .map(studyBookMapper::toResponseDto)
                .collect(Collectors.toList());
    }
    
    public StudyBookResponseDto updateStudyBook(UUID userId, UUID studyBookId, UpdateStudyBookRequestDto request) {
        log.info("Updating study book: {} for user: {}", studyBookId, userId);
        
        StudyBook studyBook = studyBookRepository.findByIdAndUserId(studyBookId, userId)
                .orElseThrow(() -> new StudyBookNotFoundException("Study book not found: " + studyBookId));
        
        studyBook.setTitle(request.getTitle());
        studyBook.setDescription(request.getDescription());
        
        StudyBook updatedStudyBook = studyBookRepository.save(studyBook);
        
        log.info("Updated study book: {}", studyBookId);
        return studyBookMapper.toResponseDto(updatedStudyBook);
    }
    
    public void deleteStudyBook(UUID userId, UUID studyBookId) {
        log.info("Deleting study book: {} for user: {}", studyBookId, userId);
        
        StudyBook studyBook = studyBookRepository.findByIdAndUserId(studyBookId, userId)
                .orElseThrow(() -> new StudyBookNotFoundException("Study book not found: " + studyBookId));
        
        studyBookRepository.delete(studyBook);
        
        log.info("Deleted study book: {}", studyBookId);
    }
}
```

#### 4.2 検索サービスの実装

```java
@Service
@Transactional(readOnly = true)
@Slf4j
public class SearchService {
    
    private final QuestionRepository questionRepository;
    private final SearchResultMapper searchResultMapper;
    
    public SearchService(QuestionRepository questionRepository, SearchResultMapper searchResultMapper) {
        this.questionRepository = questionRepository;
        this.searchResultMapper = searchResultMapper;
    }
    
    public List<SearchResultResponseDto> searchQuestions(String query, UUID userId, int limit) {
        log.info("Searching questions for user: {}, query: '{}', limit: {}", userId, query, limit);
        
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        List<SearchResult> results = questionRepository.searchQuestions(query.trim(), userId, limit);
        
        log.debug("Found {} search results for query: '{}'", results.size(), query);
        
        return results.stream()
                .map(searchResultMapper::toResponseDto)
                .collect(Collectors.toList());
    }
    
    @Async
    public CompletableFuture<Void> rebuildSearchIndex() {
        log.info("Starting search index rebuild");
        
        try {
            // PostgreSQLの場合、tsvectorカラムは自動生成されるため
            // インデックスの再構築のみ実行
            questionRepository.rebuildSearchIndex();
            
            log.info("Search index rebuild completed successfully");
        } catch (Exception e) {
            log.error("Failed to rebuild search index", e);
            throw new SearchIndexException("Failed to rebuild search index", e);
        }
        
        return CompletableFuture.completedFuture(null);
    }
}
```

### 5. REST Controller移植

#### 5.1 Python FastAPI → Java Spring Boot Controller

**Python FastAPI:**
```python
@router.post("/study-books", response_model=StudyBookResponse)
async def create_study_book(
    request: CreateStudyBookRequest,
    current_user_id: UUID = Depends(get_current_user_id)
):
    return await study_book_service.create_study_book(current_user_id, request.title, request.description)
```

**Java Spring Boot Controller:**
```java
@RestController
@RequestMapping("/api/v1/study-books")
@Validated
@Slf4j
public class StudyBookController {
    
    private final StudyBookService studyBookService;
    
    public StudyBookController(StudyBookService studyBookService) {
        this.studyBookService = studyBookService;
    }
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<StudyBookResponseDto> createStudyBook(
            @Valid @RequestBody CreateStudyBookRequestDto request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        log.info("Creating study book for user: {}", currentUser.getUserId());
        
        StudyBookResponseDto response = studyBookService.createStudyBook(currentUser.getUserId(), request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .header("Location", "/api/v1/study-books/" + response.getId())
                .body(response);
    }
    
    @GetMapping
    public ResponseEntity<List<StudyBookResponseDto>> getStudyBooks(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        log.debug("Fetching study books for user: {}", currentUser.getUserId());
        
        List<StudyBookResponseDto> studyBooks = studyBookService.getStudyBooksByUserId(currentUser.getUserId());
        
        return ResponseEntity.ok(studyBooks);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudyBookResponseDto> getStudyBook(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        StudyBookResponseDto studyBook = studyBookService.getStudyBookById(id, currentUser.getUserId());
        
        return ResponseEntity.ok(studyBook);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<StudyBookResponseDto> updateStudyBook(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStudyBookRequestDto request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        StudyBookResponseDto updatedStudyBook = studyBookService.updateStudyBook(
                currentUser.getUserId(), id, request);
        
        return ResponseEntity.ok(updatedStudyBook);
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteStudyBook(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        
        studyBookService.deleteStudyBook(currentUser.getUserId(), id);
        
        return ResponseEntity.noContent().build();
    }
}
```

#### 5.2 DTO定義

```java
// Request DTOs
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStudyBookRequestDto {
    
    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStudyBookRequestDto {
    
    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
}

// Response DTOs
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyBookResponseDto {
    
    private UUID id;
    private String title;
    private String description;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Long questionCount;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultResponseDto {
    
    private UUID questionId;
    private String question;
    private String answer;
    private String highlight;
    private Double score;
}
```

### 6. 認証・認可移植

#### 6.1 Spring Security設定

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers("/api/v1/users/signup").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(mockAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    @Profile("dev")
    public MockAuthenticationFilter mockAuthenticationFilter() {
        return new MockAuthenticationFilter();
    }
    
    @Bean
    @Profile("!dev")
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }
}

// Mock認証フィルター（開発用）
@Component
@Profile("dev")
public class MockAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String userIdHeader = request.getHeader("X-User-Id");
        
        if (userIdHeader != null) {
            try {
                UUID userId = UUID.fromString(userIdHeader);
                UserPrincipal principal = new UserPrincipal(userId, "mock-user", "mock@example.com");
                
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                        principal, null, Collections.emptyList());
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (IllegalArgumentException e) {
                // Invalid UUID format
                response.setStatus(HttpStatus.BAD_REQUEST.value());
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
```

#### 6.2 ユーザープリンシパル

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPrincipal implements UserDetails {
    
    private UUID userId;
    private String name;
    private String email;
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }
    
    @Override
    public String getPassword() {
        return null; // Mock認証では不要
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return true;
    }
}
```

### 7. エラーハンドリング移植

#### 7.1 例外クラス定義

```java
// Base exception
public abstract class DomainException extends RuntimeException {
    protected DomainException(String message) {
        super(message);
    }
    
    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

// Specific exceptions
public class UserNotFoundException extends DomainException {
    public UserNotFoundException(String message) {
        super(message);
    }
}

public class StudyBookNotFoundException extends DomainException {
    public StudyBookNotFoundException(String message) {
        super(message);
    }
}

public class UnauthorizedAccessException extends DomainException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}

public class ValidationException extends DomainException {
    public ValidationException(String message) {
        super(message);
    }
}

public class SearchIndexException extends DomainException {
    public SearchIndexException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

#### 7.2 グローバル例外ハンドラー

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleUserNotFound(UserNotFoundException ex, HttpServletRequest request) {
        return createErrorResponse(ex, HttpStatus.NOT_FOUND, request);
    }
    
    @ExceptionHandler(StudyBookNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleStudyBookNotFound(StudyBookNotFoundException ex, HttpServletRequest request) {
        return createErrorResponse(ex, HttpStatus.NOT_FOUND, request);
    }
    
    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ErrorResponseDto> handleUnauthorizedAccess(UnauthorizedAccessException ex, HttpServletRequest request) {
        return createErrorResponse(ex, HttpStatus.FORBIDDEN, request);
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponseDto> handleValidation(ValidationException ex, HttpServletRequest request) {
        return createErrorResponse(ex, HttpStatus.BAD_REQUEST, request);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        return createErrorResponse(new ValidationException(message), HttpStatus.BAD_REQUEST, request);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error occurred", ex);
        return createErrorResponse(ex, HttpStatus.INTERNAL_SERVER_ERROR, request);
    }
    
    private ResponseEntity<ErrorResponseDto> createErrorResponse(Exception ex, HttpStatus status, HttpServletRequest request) {
        String traceId = getTraceId(request);
        
        ErrorResponseDto errorResponse = ErrorResponseDto.builder()
                .error(ex.getClass().getSimpleName())
                .message(ex.getMessage())
                .traceId(traceId)
                .timestamp(OffsetDateTime.now())
                .path(request.getRequestURI())
                .build();
        
        log.error("Error occurred: {} - {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    private String getTraceId(HttpServletRequest request) {
        return (String) request.getAttribute("traceId");
    }
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponseDto {
    private String error;
    private String message;
    private String traceId;
    private OffsetDateTime timestamp;
    private String path;
}
```

### 8. ログ・監視機能移植

#### 8.1 構造化ログ設定

```yaml
# application.yml
logging:
  level:
    com.instantsearch: INFO
    org.springframework.web: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%X{traceId}] [%X{userId}] %logger{36} - %msg%n"
  
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
```

#### 8.2 ログ設定とトレーシング

```java
@Component
public class LoggingFilter implements Filter {
    
    private static final String TRACE_ID_HEADER = "X-Trace-ID";
    private static final String USER_ID_HEADER = "X-User-ID";
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // トレースIDの生成または取得
        String traceId = Optional.ofNullable(httpRequest.getHeader(TRACE_ID_HEADER))
                .orElse(UUID.randomUUID().toString());
        
        // ユーザーIDの取得
        String userId = httpRequest.getHeader(USER_ID_HEADER);
        
        // MDCに設定
        MDC.put("traceId", traceId);
        if (userId != null) {
            MDC.put("userId", userId);
        }
        MDC.put("appId", "instant-search-backend");
        MDC.put("version", getClass().getPackage().getImplementationVersion());
        
        // リクエスト属性に設定
        httpRequest.setAttribute("traceId", traceId);
        
        // レスポンスヘッダーに追加
        httpResponse.setHeader(TRACE_ID_HEADER, traceId);
        
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

#### 8.3 ヘルスチェック実装

```java
@RestController
@RequestMapping("/actuator")
public class HealthController {
    
    private final DataSource dataSource;
    private final QuestionRepository questionRepository;
    
    public HealthController(DataSource dataSource, QuestionRepository questionRepository) {
        this.dataSource = dataSource;
        this.questionRepository = questionRepository;
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("version", getClass().getPackage().getImplementationVersion());
        health.put("timestamp", OffsetDateTime.now());
        
        Map<String, Object> checks = new HashMap<>();
        
        // データベース接続チェック
        try (Connection connection = dataSource.getConnection()) {
            connection.createStatement().execute("SELECT 1");
            checks.put("database", Map.of("status", "ok"));
        } catch (Exception e) {
            health.put("status", "unhealthy");
            checks.put("database", Map.of("status", "error", "message", e.getMessage()));
        }
        
        // 検索機能チェック
        try {
            questionRepository.count(); // 簡単な検索テスト
            checks.put("search", Map.of("status", "ok"));
        } catch (Exception e) {
            health.put("status", "degraded");
            checks.put("search", Map.of("status", "error", "message", e.getMessage()));
        }
        
        health.put("checks", checks);
        
        HttpStatus status = "healthy".equals(health.get("status")) ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(health);
    }
}
```

### 9. テスト移植

#### 9.1 JUnit 5 + TestContainers

```java
@SpringBootTest
@Testcontainers
@TestMethodOrder(OrderAnnotation.class)
class StudyBookServiceIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private StudyBookService studyBookService;
    
    @Autowired
    private UserRepository userRepository;
    
    private User testUser;
    
    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .name("Test User")
                .email("test@example.com")
                .build();
        testUser = userRepository.save(testUser);
    }
    
    @Test
    @Order(1)
    void createStudyBook_ShouldReturnCreatedStudyBook() {
        // Given
        CreateStudyBookRequestDto request = CreateStudyBookRequestDto.builder()
                .title("Test Study Book")
                .description("Test Description")
                .build();
        
        // When
        StudyBookResponseDto result = studyBookService.createStudyBook(testUser.getId(), request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Test Study Book");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getCreatedAt()).isNotNull();
        assertThat(result.getUpdatedAt()).isNotNull();
    }
    
    @Test
    void createStudyBook_WithNonExistentUser_ShouldThrowException() {
        // Given
        UUID nonExistentUserId = UUID.randomUUID();
        CreateStudyBookRequestDto request = CreateStudyBookRequestDto.builder()
                .title("Test Study Book")
                .build();
        
        // When & Then
        assertThatThrownBy(() -> studyBookService.createStudyBook(nonExistentUserId, request))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User not found");
    }
}
```

#### 9.2 Web層テスト

```java
@WebMvcTest(StudyBookController.class)
class StudyBookControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private StudyBookService studyBookService;
    
    @Test
    void createStudyBook_ShouldReturnCreated() throws Exception {
        // Given
        CreateStudyBookRequestDto request = CreateStudyBookRequestDto.builder()
                .title("Test Study Book")
                .description("Test Description")
                .build();
        
        StudyBookResponseDto response = StudyBookResponseDto.builder()
                .id(UUID.randomUUID())
                .title("Test Study Book")
                .description("Test Description")
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
        
        when(studyBookService.createStudyBook(any(UUID.class), any(CreateStudyBookRequestDto.class)))
                .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/v1/study-books")
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Test Study Book"))
                .andExpect(jsonPath("$.description").value("Test Description"));
    }
    
    @Test
    void createStudyBook_WithInvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Given
        CreateStudyBookRequestDto request = CreateStudyBookRequestDto.builder()
                .title("") // Invalid: empty title
                .build();
        
        // When & Then
        mockMvc.perform(post("/api/v1/study-books")
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
```

### 10. デプロイメント設定

#### 10.1 Dockerfile

```dockerfile
# Multi-stage build
FROM openjdk:17-jdk-slim AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Maven wrapper
COPY .mvn .mvn
COPY mvnw .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

FROM openjdk:17-jre-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy JAR file
COPY --from=builder /app/target/instant-search-backend-*.jar app.jar

# Change ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 10.2 Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/instant_search
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=password
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=instant_search
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 11. 移行実行計画

#### 11.1 移行タイムライン

| フェーズ | 期間 | 主要タスク | 成果物 |
|---------|------|----------|--------|
| 準備 | 2-3週間 | プロジェクト設定、ドメインモデル移植 | 基本プロジェクト構造 |
| コア機能 | 3-4週間 | リポジトリ、サービス、検索機能実装 | ビジネスロジック完成 |
| API層 | 2-3週間 | Controller、認証、エラーハンドリング | REST API完成 |
| 運用機能 | 1-2週間 | ログ、監視、テスト、デプロイ設定 | 本番対応完了 |
| 本番移行 | 1週間 | 段階的切り替え、監視、最終検証 | 移行完了 |

#### 11.2 リスク管理

**技術的リスク:**
- JPA/Hibernateの学習コスト
- PostgreSQL検索機能の性能差
- Spring Securityの設定複雑性

**対策:**
- 段階的な実装とテスト
- 性能ベンチマークの実施
- 既存APIとの互換性テスト

**運用リスク:**
- データ移行時の整合性問題
- 本番環境での予期しない問題
- ロールバック時の複雑性

**対策:**
- 十分なテスト環境での検証
- 段階的なトラフィック切り替え
- 詳細なロールバック手順の準備

### 12. 成功指標

#### 12.1 技術指標
- **API互換性**: 既存フロントエンドが無変更で動作
- **性能**: レスポンス時間が現在の120%以内
- **可用性**: 99.9%以上のアップタイム
- **テストカバレッジ**: 80%以上

#### 12.2 運用指標
- **デプロイ時間**: 30分以内
- **ログ品質**: 構造化ログの完全実装
- **監視**: 全エンドポイントの監視設定
- **ドキュメント**: API仕様書の完全性

## まとめ

このロードマップに従うことで、FastAPI/PythonからSpring Boot/Javaへの移行を段階的かつ安全に実行できます。各フェーズでの検証とテストを徹底し、既存システムとの互換性を維持しながら、Javaエコシステムの利点を最大限に活用できるシステムを構築します。
# PetGO — Contexto do Projeto

## O que é

Sistema de gestão para petshop (PetGO) com agendamento de serviços, cadastro de clientes/pets e painel administrativo. Projeto acadêmico (BSI 2026 – Experiência Criativa).

## Stack

- **Backend**: Java 17+ / Spring Boot 4.0.3 / Spring Security / JWT (JJWT 0.11.5)
- **Banco**: MySQL (produção) / H2 in-memory (testes)
- **ORM**: Spring Data JPA + Hibernate
- **Autenticação**: JWT stateless — roles: 1=Admin, 2=Cliente, 3=Funcionário
- **Frontend**: HTML + Bulma CSS + Vanilla JS (em `src/main/resources/static/`)
- **Build**: Maven (sem `mvnw` — usar Maven do IntelliJ ou instalado)
- **Testes**: JUnit 5 + Mockito + MockMvc (standalone) + H2

## Estrutura de pacotes (`src/main/java/backend/`)

```
controller/    → REST controllers (UsuarioController, PetController,
                 AgendamentoController, ServicoController, AdminController)
model/         → Entidades JPA (Usuario, Pet, Agendamento, Servico)
dto/           → DTOs de request/response (separados por entidade)
repository/    → Interfaces JpaRepository com queries customizadas
security/      → JwtUtil, JwtFilter, SecurityConfig
DataLoader.java → Popula o banco com seed data na inicialização (só em produção)
```

## Como rodar os testes

### Via Maven (linha de comando)

Requer Java 21 — usar o JBR do IntelliJ:

```powershell
$mvn = "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.2\plugins\maven\lib\maven3\bin\mvn.cmd"
$env:JAVA_HOME = "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.2\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
Set-Location "C:\Users\vinig\OneDrive\Documentos\GitHub\Petshop"
& $mvn test
```

### Via IntelliJ

Botão direito em `src/test/java` → **Run All Tests**

## Arquitetura de testes

### Tipos e onde ficam

```
src/test/java/backend/
├── security/
│   ├── JwtUtilTest.java          → Unitário puro (sem Spring)
│   └── SecurityRoutesTest.java   → SpringBootTest + springSecurity() — testa rotas expostas
├── controller/
│   ├── UsuarioControllerTest.java
│   ├── PetControllerTest.java
│   ├── AgendamentoControllerTest.java
│   ├── ServicoControllerTest.java
│   └── AdminControllerTest.java  → MockMvc standalone + Mockito
└── repository/
    └── UsuarioRepositoryTest.java → SpringBootTest + H2 + @MockitoBean
src/test/resources/
└── application-test.properties   → Config H2 para testes
```

### Padrão para testes de controller (Spring Boot 4.x)

**NÃO usar** `@WebMvcTest`, `@MockBean`, `SecurityAutoConfiguration` — foram removidos no Spring Boot 4.

**Usar**:

```java
@ExtendWith(MockitoExtension.class)
class XControllerTest {

    @Mock XRepository xRepository;
    // outros @Mock para cada dependência do controller

    @InjectMocks XController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void nomeDoTeste() throws Exception {
        // arrange: when(xRepository.metodo(...)).thenReturn(...)
        // act + assert:
        mockMvc.perform(get("/api/x/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.campo").value("valor"));
    }
}
```

**Imports essenciais:**
```java
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
```

### Padrão para testes de repositório (Spring Boot 4.x)

**NÃO usar** `@DataJpaTest` — foi removido no Spring Boot 4.

**Usar** `@SpringBootTest` + `@MockitoBean DataLoader` para evitar seed data:

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class XRepositoryTest {

    @MockitoBean          // org.springframework.test.context.bean.override.mockito.MockitoBean
    private DataLoader dataLoader;

    @Autowired
    private XRepository repository;

    @Test
    void nomeDoTeste() {
        // cria dados → chama método do repo → asserta resultado
    }
}
```

`@Transactional` faz rollback automático após cada teste, mantendo os testes isolados.

### Padrão para testes de segurança de rotas (Spring Boot 4.x)

Usa o contexto completo do Spring com o filtro de segurança aplicado. Requer `spring-security-test` no `pom.xml`.

```java
@SpringBootTest
@ActiveProfiles("test")
class SecurityRoutesTest {

    @MockitoBean
    private DataLoader dataLoader;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtUtil jwtUtil;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())   // aplica o JwtFilter real
                .build();

        // Gera tokens reais para cada role
        adminToken       = "Bearer " + jwtUtil.generateToken(1, "admin@test.com",   1, "");
        clienteToken     = "Bearer " + jwtUtil.generateToken(2, "cliente@test.com", 2, "");
        funcionarioToken = "Bearer " + jwtUtil.generateToken(3, "func@test.com",    3, "Atendente");
    }

    @Test
    void rotaSensivel_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rotaSensivel_comToken_retorna200() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }
}
```

**Imports essenciais:**
```java
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
```

**Diferença em relação aos testes de controller:**
- `standaloneSetup` → ignora `SecurityConfig` e `JwtFilter` (testa só a lógica do controller)
- `webAppContextSetup + springSecurity()` → passa pelo filtro JWT real (testa se a rota está protegida)

### Padrão para testes unitários (sem Spring)

```java
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret",
            "minhaChaveSecretaSuperSeguraParaTestesDoPetGO2024!!");
    }

    @Test
    void nomeDoTeste() {
        // instancia diretamente, chama método, asserta
    }
}
```

## Frontend — index.html

### Estrutura da página

```
<body>
  <div id="hero-bg">          → fundo #E5DCFA, full-width, cobre navbar + seção hero
    <div class="container">   → constrains a navbar
      <nav class="navbar">
    </div>
    <section id="home">       → seção hero (padding-bottom: 0 para fundo terminar na base da imagem)
  </div>

  <main>
    <section>                 → testimoniais
    <section id="servicos">   → ícones de serviços
    <section id="sobre">      → quem somos
  </main>

  <footer id="contatos">
</body>
```

**Nota:** O `<body>` não tem `has-background-light` — o fundo geral é controlado pelo `style.css` (`background-color: #F5F2FE`).

### Imagens e ícones (todos hospedados no Cloudflare R2)

| Elemento | URL |
|---|---|
| Cachorro (hero) | `pub-.../imagem-dogindex.png` |
| Ícone Banho | `pub-.../icone-banho.png` |
| Ícone Tosa | `pub-.../icone-tosa.png` |
| Ícone Corte de unha | `pub-.../icone-corteunha.png` |
| Ícone Desembolo | `pub-.../icone-desembolo.png` |
| Ícone Hidratação | `pub-.../icone-hidratacao.png` |
| Quem somos | `pub-.../imagem-quemsomos.png` |
| Logo | `pub-.../logo-vertical.png` |

Base URL: `https://pub-ff62bf51a3fa432ab455c83ccd93e3a1.r2.dev/`

### Paleta de cores (style.css)

| Uso | Cor |
|---|---|
| Fundo geral (`body`) | `#F5F2FE` |
| Box hero (`#hero-bg`) | `#E5DCFA` |
| Fundo ícones de serviço | `#E5DCFA` (hover: `#C1A6FF`) |
| Primary (Bulma var) | `hsl(259deg, 93%, 63%)` |

### Configurações de dev (application.properties)

Templates e estáticos servidos direto do `src/` sem precisar de rebuild:
```properties
spring.web.resources.static-locations=file:src/main/resources/static/,classpath:/static/
spring.thymeleaf.prefix=file:src/main/resources/templates/
spring.thymeleaf.cache=false
```

---

## Como criar uma nova funcionalidade (workflow)

### 1. Criar o endpoint no controller

Adicione o método no controller correspondente em `src/main/java/backend/controller/`.

Exemplo — novo endpoint em `ServicoController`:
```java
@PutMapping("/{id}")
public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
    return repository.findById(id).map(s -> {
        if (body.containsKey("nome")) s.setNome((String) body.get("nome"));
        repository.save(s);
        return ResponseEntity.ok(Map.of("mensagem", "Serviço atualizado."));
    }).orElse(ResponseEntity.notFound().build());
}
```

### 2. Adicionar query customizada no repository (se necessário)

Em `src/main/java/backend/repository/XRepository.java`:
```java
Optional<X> findByNome(String nome);
List<X> findByStatus(String status);
```

### 3. Escrever o teste do controller

Em `src/test/java/backend/controller/XControllerTest.java`, adicione um método:

```java
@Test
void atualizarDeveRetornar200QuandoExiste() throws Exception {
    Servico s = new Servico();
    s.setId(1);
    s.setNome("Banho");
    when(servicoRepository.findById(1)).thenReturn(Optional.of(s));
    when(servicoRepository.save(any())).thenReturn(s);

    mockMvc.perform(put("/api/servicos/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nome\":\"Banho Completo\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mensagem").value("Serviço atualizado."));
}

@Test
void atualizarDeveRetornar404QuandoNaoExiste() throws Exception {
    when(servicoRepository.findById(99)).thenReturn(Optional.empty());

    mockMvc.perform(put("/api/servicos/99")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nome\":\"Qualquer\"}"))
        .andExpect(status().isNotFound());
}
```

### 4. Escrever o teste de repositório (se criou query customizada)

Em `UsuarioRepositoryTest.java` (ou criar `XRepositoryTest.java`):
```java
@Test
void findByNomeDeveRetornarServicoQuandoExiste() {
    Servico s = new Servico();
    s.setNome("Banho");
    repository.save(s);

    Optional<Servico> resultado = repository.findByNome("Banho");
    assertTrue(resultado.isPresent());
}
```

### 5. Rodar os testes

```powershell
& $mvn test
# ou no IntelliJ: Ctrl+Shift+F10 na classe de teste
```

## Decisões técnicas importantes

### Java e Maven
- Projeto requer Java 17+. Só há Java 8 e 26 instalados globalmente.
- **Java 26 não é compatível com Lombok via Maven** (anotações não processam).
- **Solução**: usar o JBR (Java 21) bundled no IntelliJ para rodar testes via Maven.
- No IntelliJ IDE, os testes rodam normalmente pois o IDE lida com Lombok diretamente.

### Spring Boot 4.x — breaking changes nos testes
- `@WebMvcTest` → **removido**. Substituir por `MockMvcBuilders.standaloneSetup()`.
- `@MockBean` (spring-boot-test) → **removido**. Usar `@Mock` (Mockito) para controllers ou `@MockitoBean` (spring-test) para `@SpringBootTest`.
- `@DataJpaTest` → **removido**. Substituir por `@SpringBootTest + @ActiveProfiles("test")`.
- `SecurityAutoConfiguration` → **não existe mais** em `spring-boot-autoconfigure`. A `SecurityConfig` do projeto é a configuração de segurança.

### Segurança (JWT)
- Rotas públicas (sem token): `POST /api/usuarios/login`, `POST /api/usuarios/cadastrar`, `GET /api/servicos`, `GET /api/agendamentos/disponibilidade`, `GET /api/usuarios/*/imagem`, `GET /api/pets/*/imagem`.
- Todas as outras rotas `/api/**` exigem `Authorization: Bearer <token>`.
- O role é extraído do claim JWT, não do Spring Security context.
- **`SecurityConfig` usa `HttpMethod` explícito nas rotas públicas** para não expor `POST`/`DELETE` acidentalmente. Ex.: `GET /api/servicos` é público, mas `POST /api/servicos` exige autenticação.
- **`authenticationEntryPoint`** retorna **401** para requisições sem token (padrão Spring Security seria 403). 403 fica reservado para token válido sem permissão de role.
- Dependência `spring-security-test` adicionada ao `pom.xml` (scope test) para `SecurityMockMvcConfigurers.springSecurity()`.

### DataLoader
- Popula o banco com 1 admin, 4 funcionários, 15 clientes, 20 pets e 30+ agendamentos na inicialização.
- Nos testes de repositório, é substituído por um mock via `@MockitoBean DataLoader` para evitar conflitos de dados.

## Resumo dos testes existentes (97 no total)

| Classe | Qtd | Cobre |
|---|---|---|
| `JwtUtilTest` | 8 | geração, validação, extração de claims do JWT |
| `SecurityRoutesTest` | 28 | rotas públicas acessíveis sem token; rotas sensíveis bloqueadas (401); rotas com token válido retornam 200 |
| `UsuarioControllerTest` | 18 | cadastro, login, busca, update, delete, role de funcionário |
| `PetControllerTest` | 12 | CRUD de pets, imagem, agendamento ativo bloqueia exclusão |
| `AgendamentoControllerTest` | 12 | criação com validações, cancelamento, disponibilidade |
| `ServicoControllerTest` | 8 | listar, criar, validar nome, deletar |
| `AdminControllerTest` | 2 | stats do dashboard |
| `UsuarioRepositoryTest` | 9 | findByEmail, findByCpf, findByIdRole, unicidade de campos |

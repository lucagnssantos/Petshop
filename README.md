# PetGO — Sistema de Gerenciamento de Petshop

Projeto acadêmico desenvolvido para a disciplina de Experiência Criativa do curso de BSI (2026).  
Sistema web completo para gerenciamento de um petshop, com agendamentos, clientes, pets, funcionários e serviços.

## Integrantes

- Fabio Spiller
- Lucas Gabriel Nunes dos Santos
- Vinicius Wamser

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Back-end | Spring Boot 4.x, Java 21 |
| Persistência | Spring Data JPA, Hibernate, MySQL |
| Autenticação | Spring Security + JWT (jjwt 0.11.5) |
| Front-end | Thymeleaf, Bulma CSS, JavaScript vanilla |
| Armazenamento de imagens | Cloudflare R2 |
| Testes back-end | JUnit 5, Spring Boot Test, H2 (banco em memória) |
| Testes front-end | Jest |
| Build | Maven |

## Estrutura do projeto

```
src/
├── main/
│   ├── java/backend/
│   │   ├── config/           # LocaleConfig (i18n), OpenApiConfig (Swagger)
│   │   ├── controller/       # Endpoints REST e rotas de página
│   │   ├── dto/              # Objetos de request e response da API
│   │   ├── model/            # Entidades JPA (Usuario, Pet, Agendamento, Servico)
│   │   ├── repository/       # Interfaces Spring Data JPA
│   │   ├── security/         # JWT, filtro de autenticação, SecurityConfig
│   │   ├── service/          # R2StorageService (upload de imagens)
│   │   ├── DataLoader.java   # Popula o banco com dados de exemplo no startup
│   │   └── PetGoApplication.java
│   └── resources/
│       ├── templates/        # Páginas HTML (Thymeleaf)
│       ├── static/           # scripts.js, utils.js, style.css
│       ├── messages.properties        # Textos em português
│       ├── messages_en.properties     # Textos em inglês
│       └── application.properties    # Configurações da aplicação
└── test/
    ├── java/backend/
    │   ├── controller/       # Testes de integração dos controllers
    │   ├── repository/       # Testes de repositório
    │   └── security/         # Testes de JWT e rotas protegidas
    ├── javascript/           # Testes Jest (utils.js)
    └── resources/
        └── application-test.properties  # Configuração do banco H2 para testes
```

## Pré-requisitos

- Java 21
- Maven (embutido no IntelliJ via JBR, ou instalado separadamente)
- MySQL rodando em `localhost:3306`

## Como rodar

1. Clone o repositório
2. Crie um banco MySQL chamado `petshop3` (ou deixe o sistema criar automaticamente)
3. Ajuste usuário e senha do banco em `src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=sua_senha
   ```
4. Execute a aplicação pelo IntelliJ ou via terminal:
   ```bash
   ./mvnw spring-boot:run
   ```
5. Acesse `http://localhost:8080`

> O `DataLoader` popula o banco automaticamente a cada inicialização com usuários, pets, serviços e agendamentos de exemplo.

## Credenciais de exemplo

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@petgo.com | Admin@123 |
| Veterinário | carlos.vet@petgo.com | Func@123 |
| Esteticista | fernanda.est@petgo.com | Func@123 |
| Atendente | juliana.at@petgo.com | Func@123 |
| Cliente | ana.paula@email.com | Cliente@123 |

## Como rodar os testes

**Testes back-end (JUnit):**
```bash
./mvnw test
```

**Testes front-end (Jest):**
```bash
npm test
```

## Funcionalidades

- Cadastro e login de clientes com autenticação JWT
- Perfil do cliente com edição de dados e foto
- Cadastro e gerenciamento de pets
- Agendamento de serviços (banho, tosa, consulta, vacinação etc.)
- Painel administrativo com abas: Dashboard, Agendamentos, Clientes, Funcionários, Pets, Serviços e Insights
- Painel do funcionário com agenda do dia e gerenciamento de atendimentos
- Suporte a dois idiomas: Português e Inglês
- Modo claro / escuro
- Upload de fotos para clientes, funcionários e pets (Cloudflare R2)

## Documentação

- `Specs.md` — especificações do projeto
- Swagger UI disponível em `http://localhost:8080/swagger-ui.html` com a aplicação rodando

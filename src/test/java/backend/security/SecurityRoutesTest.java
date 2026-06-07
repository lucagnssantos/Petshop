package backend.security;

import backend.DataLoader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
    private String adminToken;
    private String clienteToken;
    private String funcionarioToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        adminToken       = "Bearer " + jwtUtil.generateToken(1, "admin@test.com",       1, "");
        clienteToken     = "Bearer " + jwtUtil.generateToken(2, "cliente@test.com",     2, "");
        funcionarioToken = "Bearer " + jwtUtil.generateToken(3, "func@test.com",        3, "Atendente");
    }

    // =========================================================
    // ROTAS PÚBLICAS — acessíveis sem token
    // =========================================================

    @Test
    void listarServicos_semToken_retorna200() throws Exception {
        mockMvc.perform(get("/api/servicos"))
                .andExpect(status().isOk());
    }

    @Test
    void disponibilidade_semToken_retorna200() throws Exception {
        mockMvc.perform(get("/api/agendamentos/disponibilidade")
                        .param("data", "2026-12-01"))
                .andExpect(status().isOk());
    }

    // =========================================================
    // ROTAS SENSÍVEIS — sem token devem retornar 401
    // =========================================================

    @Test
    void adminStats_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listarUsuarios_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listarFuncionarios_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/usuarios/funcionarios"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listarClientes_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/usuarios/clientes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void buscarUsuarioPorId_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/usuarios/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void atualizarUsuario_semToken_retorna401() throws Exception {
        mockMvc.perform(put("/api/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deletarUsuario_semToken_retorna401() throws Exception {
        mockMvc.perform(delete("/api/usuarios/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadastrarFuncionario_semToken_retorna401() throws Exception {
        mockMvc.perform(post("/api/usuarios/funcionario/cadastrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listarTodosPets_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/pets"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void buscarPetsDoUsuario_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/pets/usuario/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void buscarPetPorId_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/pets/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void criarPet_semToken_retorna401() throws Exception {
        mockMvc.perform(post("/api/pets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deletarPet_semToken_retorna401() throws Exception {
        mockMvc.perform(delete("/api/pets/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listarTodosAgendamentos_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/agendamentos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void buscarAgendamentosDoUsuario_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/agendamentos/usuario/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void buscarAgendamentosDoFuncionario_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/agendamentos/funcionario/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void criarAgendamento_semToken_retorna401() throws Exception {
        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void criarServico_semToken_retorna401() throws Exception {
        mockMvc.perform(post("/api/servicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deletarServico_semToken_retorna401() throws Exception {
        mockMvc.perform(delete("/api/servicos/1"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================
    // COM TOKEN VÁLIDO — autenticação aceita, não retorna 401
    // =========================================================

    @Test
    void adminStats_comTokenAdmin_retorna200() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    // =========================================================
    // CONTROLE DE ROLE — apenas admin pode acessar /admin/stats
    // =========================================================

    @Test
    void adminStats_comTokenCliente_retorna403() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", clienteToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminStats_comTokenFuncionario_retorna403() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", funcionarioToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void listarUsuarios_comTokenAdmin_retorna200() throws Exception {
        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void listarTodosPets_comTokenAdmin_retorna200() throws Exception {
        mockMvc.perform(get("/api/pets")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void listarTodosAgendamentos_comTokenAdmin_retorna200() throws Exception {
        mockMvc.perform(get("/api/agendamentos")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void buscarAgendamentosDoFuncionario_comTokenFuncionario_retorna200() throws Exception {
        mockMvc.perform(get("/api/agendamentos/funcionario/1")
                        .header("Authorization", funcionarioToken))
                .andExpect(status().isOk());
    }

    @Test
    void buscarPetsDoUsuario_comTokenCliente_retorna200() throws Exception {
        mockMvc.perform(get("/api/pets/usuario/1")
                        .header("Authorization", clienteToken))
                .andExpect(status().isOk());
    }

    @Test
    void buscarAgendamentosDoUsuario_comTokenCliente_retorna200() throws Exception {
        mockMvc.perform(get("/api/agendamentos/usuario/1")
                        .header("Authorization", clienteToken))
                .andExpect(status().isOk());
    }
}

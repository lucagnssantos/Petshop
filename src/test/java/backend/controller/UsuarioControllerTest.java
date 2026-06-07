package backend.controller;

import backend.dto.UsuarioRequestDTO;
import backend.model.Pet;
import backend.model.Usuario;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.UsuarioRepository;
import backend.security.JwtUtil;
import backend.service.R2StorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UsuarioControllerTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private AgendamentoRepository agendamentoRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private R2StorageService r2StorageService;

    @InjectMocks
    private UsuarioController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    // ─── /cadastrar ───────────────────────────────────────────────────────────

    @Test
    void cadastrarDeveRetornar200QuandoDadosValidos() throws Exception {
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        // CPF não é enviado no DTO, então findByCpf não é chamado

        Usuario salvo = new Usuario();
        salvo.setId(1);
        when(usuarioRepository.save(any())).thenReturn(salvo);

        UsuarioRequestDTO dto = new UsuarioRequestDTO();
        dto.setNome("Maria");
        dto.setEmail("maria@email.com");
        dto.setSenha("senha123");

        mockMvc.perform(post("/api/usuarios/cadastrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Usuário cadastrado com sucesso!"));
    }

    @Test
    void cadastrarDeveRetornar400QuandoEmailJaExiste() throws Exception {
        when(usuarioRepository.findByEmail("maria@email.com")).thenReturn(Optional.of(new Usuario()));

        UsuarioRequestDTO dto = new UsuarioRequestDTO();
        dto.setEmail("maria@email.com");
        dto.setSenha("senha123");

        mockMvc.perform(post("/api/usuarios/cadastrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("E-mail já cadastrado!"));
    }

    @Test
    void cadastrarDeveRetornar400QuandoCpfJaExiste() throws Exception {
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(usuarioRepository.findByCpf("123.456.789-00")).thenReturn(Optional.of(new Usuario()));

        UsuarioRequestDTO dto = new UsuarioRequestDTO();
        dto.setEmail("novo@email.com");
        dto.setCpf("123.456.789-00");
        dto.setSenha("senha123");

        mockMvc.perform(post("/api/usuarios/cadastrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("CPF já cadastrado!"));
    }

    // ─── /login ───────────────────────────────────────────────────────────────

    @Test
    void loginDeveRetornar200ComCredenciaisValidas() throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        Usuario user = new Usuario();
        user.setId(1);
        user.setEmail("maria@email.com");
        user.setSenha(encoder.encode("senha123"));
        user.setNome("Maria");
        user.setIdRole(2);

        when(usuarioRepository.findByEmail("maria@email.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any(), any(), any(), any())).thenReturn("fake-jwt-token");

        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"maria@email.com\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("fake-jwt-token"))
                .andExpect(jsonPath("$.nome").value("Maria"));
    }

    @Test
    void loginDeveRetornar401ComEmailNaoEncontrado() throws Exception {
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"naoexiste@email.com\",\"senha\":\"qualquer\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Email não encontrado"));
    }

    @Test
    void loginDeveRetornar401ComSenhaIncorreta() throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        Usuario user = new Usuario();
        user.setEmail("maria@email.com");
        user.setSenha(encoder.encode("senhaCorreta"));

        when(usuarioRepository.findByEmail("maria@email.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"maria@email.com\",\"senha\":\"senhaErrada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Senha incorreta"));
    }

    @Test
    void loginDeveRetornar400SemEmailOuSenha() throws Exception {
        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Email e senha são obrigatórios"));
    }

    // ─── GET /{id} ────────────────────────────────────────────────────────────

    @Test
    void buscarPorIdDeveRetornar200QuandoExiste() throws Exception {
        Usuario user = new Usuario();
        user.setId(1);
        user.setNome("João");
        user.setEmail("joao@email.com");
        user.setIdRole(2);

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/usuarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("João"));
    }

    @Test
    void buscarPorIdDeveRetornar404QuandoNaoExiste() throws Exception {
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/usuarios/999"))
                .andExpect(status().isNotFound());
    }

    // ─── DELETE /{id} ─────────────────────────────────────────────────────────

    @Test
    void deletarDeveRetornar200QuandoClienteSemPets() throws Exception {
        Usuario user = new Usuario();
        user.setId(1);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(user));
        when(petRepository.findByUsuarioId(1)).thenReturn(List.of());

        mockMvc.perform(delete("/api/usuarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Cliente removido com sucesso!"));
    }

    @Test
    void deletarDeveRetornar404QuandoNaoExiste() throws Exception {
        when(usuarioRepository.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/usuarios/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletarDeveCascatearParaPetsEAgendamentosMesmoComAgendamentoAtivo() throws Exception {
        Pet pet = new Pet();
        pet.setId(10);
        pet.setNome("Rex");

        Usuario user = new Usuario();
        user.setId(1);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(user));
        when(petRepository.findByUsuarioId(1)).thenReturn(List.of(pet));

        mockMvc.perform(delete("/api/usuarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Cliente removido com sucesso!"));

        verify(agendamentoRepository).deleteByPetId(10);
        verify(petRepository).deleteById(10);
        verify(usuarioRepository).deleteById(1);
    }

    // ─── GET /funcionarios ────────────────────────────────────────────────────

    @Test
    void listarFuncionariosDeveRetornarLista() throws Exception {
        Usuario func = new Usuario();
        func.setId(2);
        func.setNome("Ana");
        func.setIdRole(3);
        func.setCargo("Esteticista");

        when(usuarioRepository.findByIdRole(3)).thenReturn(List.of(func));

        mockMvc.perform(get("/api/usuarios/funcionarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Ana"));
    }

    // ─── PUT /{id} ────────────────────────────────────────────────────────────

    @Test
    void atualizarDeveRetornar200QuandoExiste() throws Exception {
        Usuario user = new Usuario();
        user.setId(1);
        user.setNome("Nome Antigo");

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(user));
        when(usuarioRepository.save(any())).thenReturn(user);

        mockMvc.perform(put("/api/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Nome Novo\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Usuário atualizado com sucesso!"));
    }

    @Test
    void atualizarDeveRetornar404QuandoNaoExiste() throws Exception {
        when(usuarioRepository.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/usuarios/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Novo\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void atualizarDeveRetornar400QuandoEmailJaPertenceAOutroUsuario() throws Exception {
        Usuario user = new Usuario();
        user.setId(1);
        user.setEmail("antigo@email.com");

        Usuario outro = new Usuario();
        outro.setId(2);
        outro.setEmail("novo@email.com");

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(user));
        when(usuarioRepository.findByEmail("novo@email.com")).thenReturn(Optional.of(outro));

        mockMvc.perform(put("/api/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"novo@email.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("E-mail já cadastrado!"));
    }

    @Test
    void atualizarDevePermitirManterOProprioEmail() throws Exception {
        Usuario user = new Usuario();
        user.setId(1);
        user.setEmail("mesmo@email.com");

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(user));
        when(usuarioRepository.findByEmail("mesmo@email.com")).thenReturn(Optional.of(user));
        when(usuarioRepository.save(any())).thenReturn(user);

        mockMvc.perform(put("/api/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"mesmo@email.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Usuário atualizado com sucesso!"));
    }

    // ─── /funcionario/cadastrar ───────────────────────────────────────────────

    @Test
    void cadastrarFuncionarioDeveRetornar403SemToken() throws Exception {
        mockMvc.perform(post("/api/usuarios/funcionario/cadastrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"carlos@email.com\",\"senha\":\"123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void cadastrarFuncionarioDeveRetornar200ComTokenAdmin() throws Exception {
        Claims claims = mock(Claims.class);
        when(claims.get("role", Integer.class)).thenReturn(1);
        when(jwtUtil.extractClaims(anyString())).thenReturn(claims);
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        // CPF não é enviado no JSON, então findByCpf não é chamado

        Usuario salvo = new Usuario();
        salvo.setId(5);
        when(usuarioRepository.save(any())).thenReturn(salvo);

        mockMvc.perform(post("/api/usuarios/funcionario/cadastrar")
                        .header("Authorization", "Bearer token-admin-valido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Carlos\",\"email\":\"carlos@email.com\",\"senha\":\"123\",\"cargo\":\"Esteticista\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Funcionário cadastrado com sucesso!"));
    }

    @Test
    void cadastrarFuncionarioDeveRetornar403ComTokenNaoAdmin() throws Exception {
        Claims claims = mock(Claims.class);
        when(claims.get("role", Integer.class)).thenReturn(2);
        when(jwtUtil.extractClaims(anyString())).thenReturn(claims);

        mockMvc.perform(post("/api/usuarios/funcionario/cadastrar")
                        .header("Authorization", "Bearer token-cliente")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"u@u.com\",\"senha\":\"123\"}"))
                .andExpect(status().isForbidden());
    }
}

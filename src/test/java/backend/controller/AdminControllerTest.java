package backend.controller;

import backend.model.Usuario;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.UsuarioRepository;
import backend.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private AgendamentoRepository agendamentoRepository;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AdminController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private void mockTokenComRole(Integer role) {
        Claims claims = mock(Claims.class);
        when(claims.get("role", Integer.class)).thenReturn(role);
        when(jwtUtil.extractClaims(anyString())).thenReturn(claims);
    }

    @Test
    void statsDeveRetornar403SemToken() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").value("Acesso negado."));
    }

    @Test
    void statsDeveRetornar403ComTokenDeCliente() throws Exception {
        mockTokenComRole(2);

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer token-cliente"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").value("Acesso negado."));
    }

    @Test
    void statsDeveRetornar403ComTokenDeFuncionario() throws Exception {
        mockTokenComRole(3);

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer token-funcionario"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").value("Acesso negado."));
    }

    @Test
    void statsDeveRetornarTodosOsCampos() throws Exception {
        mockTokenComRole(1);
        when(usuarioRepository.findByIdRole(2)).thenReturn(List.of(new Usuario(), new Usuario(), new Usuario()));
        when(petRepository.count()).thenReturn(8L);
        when(agendamentoRepository.count()).thenReturn(25L);
        when(agendamentoRepository.countByData(anyString())).thenReturn(3L);

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer token-admin-valido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsuarios").value(3))
                .andExpect(jsonPath("$.totalPets").value(8))
                .andExpect(jsonPath("$.totalAgendamentos").value(25))
                .andExpect(jsonPath("$.agendamentosHoje").value(3));
    }

    @Test
    void statsDeveRetornarZerosQuandoSemDados() throws Exception {
        mockTokenComRole(1);
        when(usuarioRepository.findByIdRole(2)).thenReturn(List.of());
        when(petRepository.count()).thenReturn(0L);
        when(agendamentoRepository.count()).thenReturn(0L);
        when(agendamentoRepository.countByData(anyString())).thenReturn(0L);

        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer token-admin-valido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsuarios").value(0))
                .andExpect(jsonPath("$.totalPets").value(0))
                .andExpect(jsonPath("$.totalAgendamentos").value(0))
                .andExpect(jsonPath("$.agendamentosHoje").value(0));
    }
}

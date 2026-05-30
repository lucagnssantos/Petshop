package backend.controller;

import backend.model.Servico;
import backend.repository.ServicoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ServicoControllerTest {

    @Mock
    private ServicoRepository servicoRepository;

    @InjectMocks
    private ServicoController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private Servico criarServico(Integer id, String nome, Integer duracao, boolean isVet) {
        Servico s = new Servico();
        s.setId(id);
        s.setNome(nome);
        s.setDuracao(duracao);
        s.setIsVet(isVet);
        return s;
    }

    // ─── GET / ────────────────────────────────────────────────────────────────

    @Test
    void listarDeveRetornarTodosOsServicos() throws Exception {
        when(servicoRepository.findAll()).thenReturn(List.of(
                criarServico(1, "Banho", 60, false),
                criarServico(2, "Tosa", 60, false),
                criarServico(3, "Consulta", 30, true)
        ));

        mockMvc.perform(get("/api/servicos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].nome").value("Banho"))
                .andExpect(jsonPath("$[2].nome").value("Consulta"))
                .andExpect(jsonPath("$[2].isVet").value(true));
    }

    @Test
    void listarDeveRetornarListaVaziaQuandoSemServicos() throws Exception {
        when(servicoRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/servicos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── POST / ───────────────────────────────────────────────────────────────

    @Test
    void criarDeveRetornar200ComNomeValido() throws Exception {
        when(servicoRepository.save(any())).thenReturn(criarServico(4, "Hidratação", 30, false));

        mockMvc.perform(post("/api/servicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nome", "Hidratação", "duracao", 30, "isVet", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Hidratação"))
                .andExpect(jsonPath("$.duracao").value(30));
    }

    @Test
    void criarDeveRetornar400SemNome() throws Exception {
        mockMvc.perform(post("/api/servicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("duracao", 30))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Nome é obrigatório."));
    }

    @Test
    void criarDeveRetornar400ComNomeVazio() throws Exception {
        mockMvc.perform(post("/api/servicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nome", "   ", "duracao", 30))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Nome é obrigatório."));
    }

    @Test
    void criarServicoVeterinarioDeveSetarIsVetTrue() throws Exception {
        when(servicoRepository.save(any())).thenReturn(criarServico(5, "Vacinação", 20, true));

        mockMvc.perform(post("/api/servicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nome", "Vacinação", "duracao", 20, "isVet", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isVet").value(true));
    }

    // ─── DELETE /{id} ─────────────────────────────────────────────────────────

    @Test
    void deletarDeveRetornar200QuandoExiste() throws Exception {
        when(servicoRepository.existsById(1)).thenReturn(true);

        mockMvc.perform(delete("/api/servicos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Serviço removido."));
    }

    @Test
    void deletarDeveRetornar404QuandoNaoExiste() throws Exception {
        when(servicoRepository.existsById(99)).thenReturn(false);

        mockMvc.perform(delete("/api/servicos/99"))
                .andExpect(status().isNotFound());
    }
}

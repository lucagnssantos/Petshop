package backend.controller;

import backend.dto.AgendamentoRequestDTO;
import backend.model.Agendamento;
import backend.model.Pet;
import backend.model.Servico;
import backend.model.Usuario;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.ServicoRepository;
import backend.repository.UsuarioRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AgendamentoControllerTest {

    @Mock
    private AgendamentoRepository agendamentoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PetRepository petRepository;

    @Mock
    private ServicoRepository servicoRepository;

    @InjectMocks
    private AgendamentoController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private Servico criarServico(String nome, Integer duracao, boolean isVet) {
        Servico s = new Servico();
        s.setNome(nome);
        s.setDuracao(duracao);
        s.setIsVet(isVet);
        return s;
    }

    // ─── POST / ───────────────────────────────────────────────────────────────

    @Test
    void criarDeveRetornar400ComDataNoPassado() throws Exception {
        String ontem = LocalDate.now().minusDays(1).toString();

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setData(ontem);
        dto.setHora("10:00");
        dto.setServico("Banho");
        dto.setPetId(1);
        dto.setUsuarioId(1);

        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Não é possível agendar em datas passadas."));
    }

    @Test
    void criarDeveRetornar400ComHorarioForaDoIntervaloPermitido() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setData(amanha);
        dto.setHora("18:00");
        dto.setServico("Banho");
        dto.setPetId(1);
        dto.setUsuarioId(1);

        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Horário fora do intervalo permitido (08:00 às 17:00)."));
    }

    @Test
    void criarDeveRetornar400ComHorarioAntesDoIntervaloPermitido() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setData(amanha);
        dto.setHora("07:00");
        dto.setServico("Banho");
        dto.setPetId(1);
        dto.setUsuarioId(1);

        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Horário fora do intervalo permitido (08:00 às 17:00)."));
    }

    @Test
    void criarDeveRetornar400ComMisturaVetENormal() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setData(amanha);
        dto.setHora("10:00");
        dto.setServico("Banho,Consulta");
        dto.setPetId(1);
        dto.setUsuarioId(1);

        when(servicoRepository.findByNome("Banho")).thenReturn(Optional.of(criarServico("Banho", 60, false)));
        when(servicoRepository.findByNome("Consulta")).thenReturn(Optional.of(criarServico("Consulta", 30, true)));

        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(
                        "Não é possível misturar serviços veterinários com outros serviços."));
    }

    @Test
    void criarDeveRetornar400ComPetJaAgendadoNoMesmoHorario() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setData(amanha);
        dto.setHora("10:00");
        dto.setServico("Banho");
        dto.setPetId(1);
        dto.setUsuarioId(1);

        when(servicoRepository.findByNome("Banho")).thenReturn(Optional.of(criarServico("Banho", 60, false)));

        Agendamento existente = new Agendamento();
        existente.setData(amanha);
        existente.setHora("10:00");
        existente.setStatus("Agendado");
        when(agendamentoRepository.findByPetId(1)).thenReturn(List.of(existente));

        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Este pet já possui um agendamento neste horário."));
    }

    @Test
    void criarDeveRetornar400SemProfissionalDisponivel() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setData(amanha);
        dto.setHora("10:00");
        dto.setServico("Banho");
        dto.setPetId(1);
        dto.setUsuarioId(1);

        when(servicoRepository.findByNome("Banho")).thenReturn(Optional.of(criarServico("Banho", 60, false)));
        when(agendamentoRepository.findByPetId(1)).thenReturn(List.of());
        when(usuarioRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Nenhum profissional disponível para este horário."));
    }

    @Test
    void criarDeveRetornar200ComDadosValidos() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setData(amanha);
        dto.setHora("10:00");
        dto.setServico("Banho");
        dto.setPetId(1);
        dto.setUsuarioId(1);

        Servico banho = criarServico("Banho", 60, false);
        when(servicoRepository.findByNome("Banho")).thenReturn(Optional.of(banho));
        when(agendamentoRepository.findByPetId(1)).thenReturn(List.of());

        Usuario esteticista = new Usuario();
        esteticista.setId(10);
        esteticista.setCargo("Esteticista");
        when(usuarioRepository.findAll()).thenReturn(List.of(esteticista));
        when(agendamentoRepository.findByFuncionarioId(10)).thenReturn(List.of());

        Agendamento salvo = new Agendamento();
        salvo.setId(1);
        salvo.setUsuarioId(1);
        salvo.setPetId(1);
        salvo.setServico("Banho");
        salvo.setData(amanha);
        salvo.setHora("10:00");
        salvo.setStatus("Agendado");
        salvo.setDuracaoMinutos(60);
        salvo.setFuncionarioId(10);
        when(agendamentoRepository.save(any())).thenReturn(salvo);

        Usuario usuario = new Usuario();
        usuario.setNome("Maria");
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));

        Pet pet = new Pet();
        pet.setNome("Rex");
        when(petRepository.findById(1)).thenReturn(Optional.of(pet));

        mockMvc.perform(post("/api/agendamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Agendado"))
                .andExpect(jsonPath("$.servico").value("Banho"))
                .andExpect(jsonPath("$.funcionarioId").value(10));
    }

    // ─── GET /usuario/{usuarioId} ─────────────────────────────────────────────

    @Test
    void listarPorUsuarioDeveRetornarListaVazia() throws Exception {
        when(agendamentoRepository.findByUsuarioId(1)).thenReturn(List.of());

        mockMvc.perform(get("/api/agendamentos/usuario/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── PUT /{id} ────────────────────────────────────────────────────────────

    @Test
    void atualizarDeveRetornar400AoCancelarSemMotivo() throws Exception {
        Agendamento ag = new Agendamento();
        ag.setId(1);
        ag.setStatus("Agendado");
        when(agendamentoRepository.findById(1)).thenReturn(Optional.of(ag));

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setStatus("Cancelado");

        mockMvc.perform(put("/api/agendamentos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Informe o motivo do cancelamento."));
    }

    @Test
    void atualizarDeveRetornar200AoCancelarComMotivo() throws Exception {
        Agendamento ag = new Agendamento();
        ag.setId(1);
        ag.setStatus("Agendado");
        when(agendamentoRepository.findById(1)).thenReturn(Optional.of(ag));
        when(agendamentoRepository.save(any())).thenReturn(ag);

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setStatus("Cancelado");
        dto.setMotivo("Cliente não compareceu");

        mockMvc.perform(put("/api/agendamentos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Agendamento atualizado."));
    }

    @Test
    void atualizarDeveRetornar400QuandoAgendamentoJaCancelado() throws Exception {
        Agendamento ag = new Agendamento();
        ag.setId(1);
        ag.setStatus("Cancelado");
        when(agendamentoRepository.findById(1)).thenReturn(Optional.of(ag));

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO();
        dto.setStatus("Agendado");

        mockMvc.perform(put("/api/agendamentos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Não é possível alterar um agendamento já cancelado."));
    }

    @Test
    void atualizarDeveRetornar404QuandoNaoExiste() throws Exception {
        when(agendamentoRepository.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/agendamentos/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"Cancelado\",\"motivo\":\"Teste\"}"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /disponibilidade ─────────────────────────────────────────────────

    @Test
    void disponibilidadeDeveRetornarSlotsComProfissionalLivre() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        Usuario esteticista = new Usuario();
        esteticista.setId(10);
        esteticista.setCargo("Esteticista");
        when(usuarioRepository.findAll()).thenReturn(List.of(esteticista));
        when(agendamentoRepository.findByData(amanha)).thenReturn(List.of());

        mockMvc.perform(get("/api/agendamentos/disponibilidade")
                        .param("data", amanha)
                        .param("tipo", "normal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots").exists())
                .andExpect(jsonPath("$.slots['08:00']").value(1));
    }

    @Test
    void disponibilidadeDeveRetornarZeroQuandoTodosOcupados() throws Exception {
        String amanha = LocalDate.now().plusDays(1).toString();

        Usuario vet = new Usuario();
        vet.setId(20);
        vet.setCargo("Veterinário");
        when(usuarioRepository.findAll()).thenReturn(List.of(vet));

        Agendamento ag = new Agendamento();
        ag.setFuncionarioId(20);
        ag.setData(amanha);
        ag.setHora("09:00");
        ag.setStatus("Agendado");
        ag.setDuracaoMinutos(60);
        when(agendamentoRepository.findByData(amanha)).thenReturn(List.of(ag));

        mockMvc.perform(get("/api/agendamentos/disponibilidade")
                        .param("data", amanha)
                        .param("tipo", "vet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots['09:00']").value(0));
    }
}

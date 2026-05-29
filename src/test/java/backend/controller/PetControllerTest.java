package backend.controller;

import backend.dto.PetRequestDTO;
import backend.model.Pet;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PetControllerTest {

    @Mock
    private PetRepository petRepository;

    @Mock
    private AgendamentoRepository agendamentoRepository;

    @InjectMocks
    private PetController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private Pet criarPet(Integer id, String nome, Integer usuarioId) {
        Pet pet = new Pet();
        pet.setId(id);
        pet.setNome(nome);
        pet.setRaca("Labrador");
        pet.setPorte("Grande");
        pet.setSexo("M");
        pet.setIdade("3 anos");
        pet.setUsuarioId(usuarioId);
        return pet;
    }

    // ─── GET /{id} ────────────────────────────────────────────────────────────

    @Test
    void buscarPorIdDeveRetornar200QuandoExiste() throws Exception {
        when(petRepository.findById(1)).thenReturn(Optional.of(criarPet(1, "Rex", 10)));

        mockMvc.perform(get("/api/pets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Rex"))
                .andExpect(jsonPath("$.raca").value("Labrador"));
    }

    @Test
    void buscarPorIdDeveRetornar404QuandoNaoExiste() throws Exception {
        when(petRepository.findById(999)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/pets/999"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /usuario/{usuarioId} ─────────────────────────────────────────────

    @Test
    void listarPorUsuarioDeveRetornarListaDeVarios() throws Exception {
        List<Pet> pets = List.of(criarPet(1, "Rex", 5), criarPet(2, "Mel", 5));
        when(petRepository.findByUsuarioId(5)).thenReturn(pets);

        mockMvc.perform(get("/api/pets/usuario/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nome").value("Rex"))
                .andExpect(jsonPath("$[1].nome").value("Mel"));
    }

    @Test
    void listarPorUsuarioDeveRetornarListaVaziaQuandoSemPets() throws Exception {
        when(petRepository.findByUsuarioId(99)).thenReturn(List.of());

        mockMvc.perform(get("/api/pets/usuario/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── POST / ───────────────────────────────────────────────────────────────

    @Test
    void cadastrarDeveRetornar200ComDadosValidos() throws Exception {
        Pet salvo = criarPet(1, "Bolinha", 3);
        when(petRepository.save(any())).thenReturn(salvo);

        PetRequestDTO dto = new PetRequestDTO();
        dto.setNome("Bolinha");
        dto.setRaca("Poodle");
        dto.setPorte("Pequeno");
        dto.setSexo("F");
        dto.setIdade("15/06/2022");
        dto.setUsuarioId(3);

        mockMvc.perform(post("/api/pets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Bolinha"));
    }

    // ─── PUT /{id} ────────────────────────────────────────────────────────────

    @Test
    void atualizarDeveRetornar200QuandoExiste() throws Exception {
        Pet pet = criarPet(1, "Rex", 5);
        when(petRepository.findById(1)).thenReturn(Optional.of(pet));
        when(petRepository.save(any())).thenReturn(pet);

        mockMvc.perform(put("/api/pets/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Rex Atualizado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Pet atualizado com sucesso!"));
    }

    @Test
    void atualizarDeveRetornar404QuandoNaoExiste() throws Exception {
        when(petRepository.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/pets/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Novo\"}"))
                .andExpect(status().isNotFound());
    }

    // ─── DELETE /{id} ─────────────────────────────────────────────────────────

    @Test
    void deletarDeveRetornar200QuandoPetSemAgendamentos() throws Exception {
        when(petRepository.existsById(1)).thenReturn(true);
        when(agendamentoRepository.existsByPetIdAndStatus(1, "Agendado")).thenReturn(false);

        mockMvc.perform(delete("/api/pets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").value("Pet removido com sucesso!"));
    }

    @Test
    void deletarDeveRetornar400QuandoPetTemAgendamentoAtivo() throws Exception {
        when(petRepository.existsById(1)).thenReturn(true);
        when(agendamentoRepository.existsByPetIdAndStatus(1, "Agendado")).thenReturn(true);

        mockMvc.perform(delete("/api/pets/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(
                        "Não é possível remover o pet pois ele possui agendamentos ativos."));
    }

    @Test
    void deletarDeveRetornar404QuandoPetNaoExiste() throws Exception {
        when(petRepository.existsById(99)).thenReturn(false);

        mockMvc.perform(delete("/api/pets/99"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /{id}/imagem ─────────────────────────────────────────────────────

    @Test
    void servirImagemDeveRetornar404QuandoPetSemImagem() throws Exception {
        Pet pet = criarPet(1, "Rex", 5);
        pet.setImagem(null);
        when(petRepository.findById(1)).thenReturn(Optional.of(pet));

        mockMvc.perform(get("/api/pets/1/imagem"))
                .andExpect(status().isNotFound());
    }

    @Test
    void servirImagemDeveRetornar200QuandoPetTemImagem() throws Exception {
        Pet pet = criarPet(1, "Rex", 5);
        pet.setImagem(new byte[]{1, 2, 3});
        when(petRepository.findById(1)).thenReturn(Optional.of(pet));

        mockMvc.perform(get("/api/pets/1/imagem"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/jpeg"));
    }
}

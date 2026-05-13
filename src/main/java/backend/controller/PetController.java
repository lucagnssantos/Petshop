package backend.controller;

import backend.dto.PetRequestDTO;
import backend.dto.PetResponseDTO;
import backend.model.Pet;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    @Autowired
    private PetRepository repository;

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    private String calcularIdade(String dataNascimento) {

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        LocalDate nascimento = LocalDate.parse(dataNascimento, formatter);

        LocalDate hoje = LocalDate.now();

        Period periodo = Period.between(nascimento, hoje);

        int anos = periodo.getYears();
        int meses = periodo.getMonths();

        if (anos == 0) {

            if (meses <= 1) {
                return meses + " mês";
            }

            return meses + " meses";
        }

        // 1 ano
        if (anos == 1) {
            return "1 ano";
        }

        // Mais de 1 ano
        return anos + " anos";
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetResponseDTO> buscarPorId(@PathVariable Integer id) {
        return repository.findById(id)
                .map(p -> ResponseEntity.ok(PetResponseDTO.from(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<PetResponseDTO> listarPorUsuario(@PathVariable Integer usuarioId) {
        return repository.findByUsuarioId(usuarioId).stream().map(PetResponseDTO::from).toList();
    }

    @GetMapping
    public List<PetResponseDTO> listarTodos() {
        return repository.findAll().stream().map(PetResponseDTO::from).toList();
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody PetRequestDTO dto) {
        Pet pet = new Pet();
        pet.setNome(dto.getNome());
        pet.setRaca(dto.getRaca());
        pet.setPorte(dto.getPorte());
        pet.setSexo(dto.getSexo());
        pet.setIdade(calcularIdade(dto.getIdade()));
        pet.setObservacao(dto.getObservacao());
        pet.setUsuarioId(dto.getUsuarioId());
        Pet salvo = repository.save(pet);
        return ResponseEntity.ok(PetResponseDTO.from(salvo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody PetRequestDTO dto) {
        return repository.findById(id).map(p -> {
            if (dto.getNome() != null) p.setNome(dto.getNome());
            if (dto.getRaca() != null) p.setRaca(dto.getRaca());
            if (dto.getPorte() != null) p.setPorte(dto.getPorte());
            if (dto.getSexo() != null) p.setSexo(dto.getSexo());
            if (dto.getIdade() != null) p.setIdade(calcularIdade(dto.getIdade()));
            if (dto.getObservacao() != null) p.setObservacao(dto.getObservacao());
            repository.save(p);
            return ResponseEntity.ok(Map.of("mensagem", "Pet atualizado com sucesso!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Integer id) {
        if (!repository.existsById(id))
            return ResponseEntity.notFound().build();
        if (agendamentoRepository.existsByPetIdAndStatus(id, "Agendado"))
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Não é possível remover o pet pois ele possui agendamentos ativos."));
        agendamentoRepository.deleteByPetId(id);
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Pet removido com sucesso!"));
    }

    @PostMapping(value = "/{id}/imagem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImagem(@PathVariable Integer id,
                                           @RequestParam("imagem") MultipartFile file) throws IOException {
        Optional<Pet> opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Pet pet = opt.get();
        pet.setImagem(file.getBytes());
        repository.save(pet);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/imagem")
    public ResponseEntity<byte[]> servirImagem(@PathVariable Integer id) {
        Optional<Pet> opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.<byte[]>notFound().build();
        byte[] imagem = opt.get().getImagem();
        if (imagem == null || imagem.length == 0) return ResponseEntity.<byte[]>notFound().build();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(imagem, headers, HttpStatus.OK);
    }
}

package backend.controller;

import backend.model.Pet;
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

@RestController
@RequestMapping("/api/pets")
@CrossOrigin(origins = "*")
public class PetController {

    @Autowired
    private PetRepository repository;

    @GetMapping("/usuario/{usuarioId}")
    public List<Pet> listarPorUsuario(@PathVariable Integer usuarioId) {
        return repository.findByUsuarioId(usuarioId);
    }

    @GetMapping
    public List<Pet> listarTodos() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Pet pet) {
        Pet salvo = repository.save(pet);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody Pet dados) {
        return repository.findById(id).map(p -> {
            if (dados.getNome() != null) p.setNome(dados.getNome());
            if (dados.getRaca() != null) p.setRaca(dados.getRaca());
            if (dados.getPorte() != null) p.setPorte(dados.getPorte());
            if (dados.getSexo() != null) p.setSexo(dados.getSexo());
            if (dados.getIdade() != null) p.setIdade(dados.getIdade());
            if (dados.getObservacao() != null) p.setObservacao(dados.getObservacao());
            repository.save(p);
            return ResponseEntity.ok(Map.of("mensagem", "Pet atualizado com sucesso!"));
        }).orElse(ResponseEntity.notFound().build());
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
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        byte[] imagem = opt.get().getImagem();
        if (imagem == null || imagem.length == 0) return ResponseEntity.notFound().build();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(imagem, headers, HttpStatus.OK);
    }
}

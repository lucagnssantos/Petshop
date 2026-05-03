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

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Pet pet) {
        Pet salvo = repository.save(pet);
        return ResponseEntity.ok(salvo);
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

package backend.controller;

import backend.model.Pet;
import backend.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}

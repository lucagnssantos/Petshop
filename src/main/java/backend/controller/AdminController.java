package backend.controller;

import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        String hoje = LocalDate.now().toString(); // formato YYYY-MM-DD (igual ao input date HTML)
        return Map.of(
            "totalUsuarios",      usuarioRepository.findByIdRole(2).size(),
            "totalPets",          petRepository.count(),
            "totalAgendamentos",  agendamentoRepository.count(),
            "agendamentosHoje",   agendamentoRepository.countByData(hoje)
        );
    }
}

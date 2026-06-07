package backend.controller;

import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.UsuarioRepository;
import backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/stats")
    public ResponseEntity<?> stats(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer "))
            return ResponseEntity.status(403).body(Map.of("mensagem", "Acesso negado."));
        Integer role = jwtUtil.extractClaims(header.substring(7)).get("role", Integer.class);
        if (!Integer.valueOf(1).equals(role))
            return ResponseEntity.status(403).body(Map.of("mensagem", "Acesso negado."));

        String hoje = LocalDate.now().toString();
        return ResponseEntity.ok(Map.of(
            "totalUsuarios",      usuarioRepository.findByIdRole(2).size(),
            "totalPets",          petRepository.count(),
            "totalAgendamentos",  agendamentoRepository.count(),
            "agendamentosHoje",   agendamentoRepository.countByData(hoje)
        ));
    }
}

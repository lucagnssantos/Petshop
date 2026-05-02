package backend.controller;

import backend.model.Agendamento;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agendamentos")
@CrossOrigin(origins = "*")
public class AgendamentoController {

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PetRepository petRepository;

    private Map<String, Object> enriquecer(Agendamento ag) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", ag.getId());
        map.put("servico", ag.getServico());
        map.put("data", ag.getData());
        map.put("hora", ag.getHora());
        map.put("status", ag.getStatus() != null ? ag.getStatus() : "Agendado");
        map.put("observacao", ag.getObservacao() != null ? ag.getObservacao() : "");
        map.put("usuarioId", ag.getUsuarioId());
        map.put("petId", ag.getPetId());

        if (ag.getUsuarioId() != null) {
            usuarioRepository.findById(ag.getUsuarioId())
                .ifPresent(u -> map.put("usuarioNome", u.getNome()));
        }
        if (ag.getPetId() != null) {
            petRepository.findById(ag.getPetId())
                .ifPresent(p -> map.put("petNome", p.getNome()));
        }

        return map;
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Agendamento agendamento) {
        if (agendamento.getStatus() == null) agendamento.setStatus("Agendado");
        Agendamento salvo = agendamentoRepository.save(agendamento);
        return ResponseEntity.ok(enriquecer(salvo));
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<Map<String, Object>> listarPorUsuario(@PathVariable Integer usuarioId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        agendamentoRepository.findByUsuarioId(usuarioId).forEach(ag -> lista.add(enriquecer(ag)));
        return lista;
    }

    // Retorna todos os agendamentos para qualquer funcionário (sem sistema de atribuição ainda)
    @GetMapping("/funcionario/{funcionarioId}")
    public List<Map<String, Object>> listarPorFuncionario(@PathVariable Integer funcionarioId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        agendamentoRepository.findAll().forEach(ag -> lista.add(enriquecer(ag)));
        return lista;
    }

    @GetMapping
    public List<Map<String, Object>> listarTodos() {
        List<Map<String, Object>> lista = new ArrayList<>();
        agendamentoRepository.findAll().forEach(ag -> lista.add(enriquecer(ag)));
        return lista;
    }
}

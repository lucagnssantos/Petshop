package backend.controller;

import backend.model.Servico;
import backend.repository.ServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    @Autowired
    private ServicoRepository repository;

    @GetMapping
    public List<Servico> listar() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        String nome = (String) body.get("nome");
        if (nome == null || nome.isBlank())
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Nome é obrigatório."));
        Servico s = new Servico();
        s.setNome(nome.trim());
        Object duracaoObj = body.get("duracao");
        if (duracaoObj != null)
            s.setDuracao(Integer.valueOf(duracaoObj.toString()));
        Object isVetObj = body.get("isVet");
        s.setIsVet(isVetObj != null && Boolean.parseBoolean(isVetObj.toString()));
        return ResponseEntity.ok(repository.save(s));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Integer id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Serviço removido."));
    }
}

package backend.controller;

import backend.model.Servico;
import backend.repository.ServicoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Serviços", description = "Listagem e gestão dos serviços oferecidos pelo petshop")
@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    @Autowired
    private ServicoRepository repository;

    @Operation(summary = "Listar serviços", description = "Endpoint público. Retorna todos os serviços com id, nome, duração (minutos) e flag isVet.")
    @ApiResponse(responseCode = "200", description = "Lista de serviços")
    @GetMapping
    public List<Servico> listar() {
        return repository.findAll();
    }

    @Operation(summary = "Criar serviço", description = "Payload: {\"nome\":\"Banho\",\"duracao\":60,\"isVet\":false}", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Serviço criado"),
                    @ApiResponse(responseCode = "400", description = "Nome obrigatório") })
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

    @Operation(summary = "Remover serviço", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Serviço removido"),
                    @ApiResponse(responseCode = "404", description = "Serviço não encontrado") })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Integer id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Serviço removido."));
    }
}

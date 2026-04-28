package backend.controller;

import backend.model.Usuario;
import backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") // Permite que seu HTML/JS acesse a API sem erro de CORS
public class UsuarioController {

    @Autowired
    private UsuarioRepository repository;

    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody Usuario usuario) {
        // 1. Verifica se o e-mail já existe
        if (repository.findByEmail(usuario.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já cadastrado!"));
        }

        // 2. Salva o novo usuário no banco
        Usuario usuarioSalvo = repository.save(usuario);

        // 3. Retorna sucesso
        return ResponseEntity.ok(Map.of("mensagem", "Usuário cadastrado com sucesso!", "id", usuarioSalvo.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario usuario) {

        // procura usuário pelo email
        var usuarioOpt = repository.findByEmail(usuario.getEmail());

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("mensagem", "Email não encontrado"));
        }

        Usuario user = usuarioOpt.get();

        // verifica senha
        if (!user.getSenha().equals(usuario.getSenha())) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("mensagem", "Senha incorreta"));
        }

        // login ok
        return ResponseEntity.ok(
                Map.of(
                        "mensagem", "Login realizado com sucesso",
                        "id", user.getId(),
                        "nome", user.getNome()
                )
        );
    }
}
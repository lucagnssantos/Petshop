package backend.controller;

import backend.model.Usuario;
import backend.repository.UsuarioRepository;
import backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") // Permite que seu HTML/JS acesse a API sem erro de CORS
public class UsuarioController {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/funcionario/cadastrar")
    public ResponseEntity<?> cadastrarFuncionario(@RequestBody Usuario funcionario) {
        if (repository.findByEmail(funcionario.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já cadastrado!"));
        }
        funcionario.setIdRole(3);
        funcionario.setSenha(encoder.encode(funcionario.getSenha()));
        Usuario salvo = repository.save(funcionario);
        return ResponseEntity.ok(Map.of("mensagem", "Funcionário cadastrado com sucesso!", "id", salvo.getId()));
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody Usuario usuario) {
        if (repository.findByEmail(usuario.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já cadastrado!"));
        }
        usuario.setSenha(encoder.encode(usuario.getSenha()));
        Usuario usuarioSalvo = repository.save(usuario);
        return ResponseEntity.ok(Map.of("mensagem", "Usuário cadastrado com sucesso!", "id", usuarioSalvo.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario usuario) {
        var usuarioOpt = repository.findByEmail(usuario.getEmail());

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("mensagem", "Email não encontrado"));
        }

        Usuario user = usuarioOpt.get();

        if (!encoder.matches(usuario.getSenha(), user.getSenha())) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("mensagem", "Senha incorreta"));
        }

        String token = jwtUtil.generateToken(
                user.getId(), user.getEmail(), user.getIdRole(), user.getCargo());

        return ResponseEntity.ok(
                Map.of(
                        "mensagem", "Login realizado com sucesso",
                        "id", user.getId(),
                        "nome", user.getNome(),
                        "role", user.getIdRole(),
                        "cargo", user.getCargo() != null ? user.getCargo() : "",
                        "token", token
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Integer id) {
        return repository.findById(id)
                .map(u -> ResponseEntity.ok((Object) u))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody Usuario dados) {
        return repository.findById(id).map(u -> {
            if (dados.getNome() != null) u.setNome(dados.getNome());
            if (dados.getCep() != null) u.setCep(dados.getCep());
            if (dados.getEndereco() != null) u.setEndereco(dados.getEndereco());
            if (dados.getNumero() != null) u.setNumero(dados.getNumero());
            repository.save(u);
            return ResponseEntity.ok(Map.of("mensagem", "Usuário atualizado com sucesso!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    @GetMapping("/funcionarios")
    public List<Usuario> listarFuncionarios() {
        return repository.findByIdRole(3);
    }

    @PostMapping(value = "/{id}/imagem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImagem(@PathVariable Integer id,
                                           @RequestParam("imagem") MultipartFile file) throws IOException {
        return repository.findById(id).map(u -> {
            try {
                u.setImagem(file.getBytes());
                repository.save(u);
                return ResponseEntity.ok().build();
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/imagem")
    public ResponseEntity<byte[]> servirImagem(@PathVariable Integer id) {
        return repository.findById(id).map(u -> {
            byte[] imagem = u.getImagem();
            if (imagem == null || imagem.length == 0)
                return ResponseEntity.<byte[]>notFound().build();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG);
            return new ResponseEntity<>(imagem, headers, HttpStatus.OK);
        }).orElse(ResponseEntity.notFound().build());
    }
}
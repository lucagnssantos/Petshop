package backend.controller;

import backend.dto.UsuarioRequestDTO;
import backend.dto.UsuarioResponseDTO;
import backend.model.Pet;
import backend.model.Usuario;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
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
public class UsuarioController {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/funcionario/cadastrar")
    public ResponseEntity<?> cadastrarFuncionario(@RequestBody UsuarioRequestDTO dto) {
        if (repository.findByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já cadastrado!"));
        }
        Usuario funcionario = new Usuario();
        funcionario.setNome(dto.getNome());
        funcionario.setCpf(dto.getCpf());
        funcionario.setDataNascimento(dto.getDataNascimento());
        funcionario.setEmail(dto.getEmail());
        funcionario.setSenha(encoder.encode(dto.getSenha()));
        funcionario.setCargo(dto.getCargo());
        funcionario.setIdRole(3);
        Usuario salvo = repository.save(funcionario);
        return ResponseEntity.ok(Map.of("mensagem", "Funcionário cadastrado com sucesso!", "id", salvo.getId()));
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody UsuarioRequestDTO dto) {
        if (repository.findByEmail(dto.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já cadastrado!"));
        }
        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setCpf(dto.getCpf());
        usuario.setDataNascimento(dto.getDataNascimento());
        usuario.setCep(dto.getCep());
        usuario.setEndereco(dto.getEndereco());
        usuario.setNumero(dto.getNumero());
        usuario.setEmail(dto.getEmail());
        usuario.setSenha(encoder.encode(dto.getSenha()));
        Usuario salvo = repository.save(usuario);
        return ResponseEntity.ok(Map.of("mensagem", "Usuário cadastrado com sucesso!", "id", salvo.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UsuarioRequestDTO dto) {
        if (dto.getEmail() == null || dto.getSenha() == null) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Email e senha são obrigatórios"));
        }
        var usuarioOpt = repository.findByEmail(dto.getEmail());

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("mensagem", "Email não encontrado"));
        }

        Usuario user = usuarioOpt.get();

        if (!encoder.matches(dto.getSenha(), user.getSenha())) {
            return ResponseEntity.status(401).body(Map.of("mensagem", "Senha incorreta"));
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getIdRole(), user.getCargo());

        return ResponseEntity.ok(Map.of(
                "mensagem", "Login realizado com sucesso",
                "id", user.getId(),
                "nome", user.getNome(),
                "role", user.getIdRole(),
                "cargo", user.getCargo() != null ? user.getCargo() : "",
                "token", token
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Integer id) {
        return repository.findById(id)
                .map(u -> ResponseEntity.ok((Object) UsuarioResponseDTO.from(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody UsuarioRequestDTO dto) {
        return repository.findById(id).map(u -> {
            if (dto.getNome() != null) u.setNome(dto.getNome());
            if (dto.getCep() != null) u.setCep(dto.getCep());
            if (dto.getEndereco() != null) u.setEndereco(dto.getEndereco());
            if (dto.getNumero() != null) u.setNumero(dto.getNumero());
            if (dto.getCargo() != null) u.setCargo(dto.getCargo());
            repository.save(u);
            return ResponseEntity.ok(Map.of("mensagem", "Usuário atualizado com sucesso!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<UsuarioResponseDTO> listarTodos() {
        return repository.findAll().stream().map(UsuarioResponseDTO::from).toList();
    }

    @GetMapping("/funcionarios")
    public List<UsuarioResponseDTO> listarFuncionarios() {
        return repository.findByIdRole(3).stream().map(UsuarioResponseDTO::from).toList();
    }

    @GetMapping("/clientes")
    public List<UsuarioResponseDTO> listarClientes() {
        return repository.findByIdRole(2).stream().map(UsuarioResponseDTO::from).toList();
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
        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.<byte[]>notFound().build();
        byte[] imagem = opt.get().getImagem();
        if (imagem == null || imagem.length == 0) return ResponseEntity.<byte[]>notFound().build();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(imagem, headers, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Integer id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        List<Pet> pets = petRepository.findByUsuarioId(id);
        for (Pet pet : pets) {
            if (agendamentoRepository.existsByPetIdAndStatus(pet.getId(), "Agendado"))
                return ResponseEntity.badRequest().body(Map.of("mensagem",
                        "Não é possível excluir o cliente pois o pet \"" + pet.getNome() + "\" possui agendamentos ativos."));
        }
        for (Pet pet : pets) {
            agendamentoRepository.deleteByPetId(pet.getId());
            petRepository.deleteById(pet.getId());
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Cliente removido com sucesso!"));
    }
}

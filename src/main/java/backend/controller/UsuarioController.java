package backend.controller;

import backend.dto.UsuarioRequestDTO;
import backend.dto.UsuarioResponseDTO;
import backend.model.Pet;
import backend.model.Usuario;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.UsuarioRepository;
import backend.security.JwtUtil;
import backend.service.R2StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    @Autowired private UsuarioRepository repository;
    @Autowired private PetRepository petRepository;
    @Autowired private AgendamentoRepository agendamentoRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private R2StorageService r2;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/funcionario/cadastrar")
    public ResponseEntity<?> cadastrarFuncionario(@RequestBody UsuarioRequestDTO dto,
                                                   HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer "))
            return ResponseEntity.status(403).body(Map.of("mensagem", "Acesso negado."));
        Integer role = jwtUtil.extractClaims(header.substring(7)).get("role", Integer.class);
        if (!Integer.valueOf(1).equals(role))
            return ResponseEntity.status(403).body(Map.of("mensagem", "Apenas administradores podem cadastrar funcionários."));

        if (repository.findByEmail(dto.getEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já cadastrado!"));
        if (dto.getCpf() != null && repository.findByCpf(dto.getCpf()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("mensagem", "CPF já cadastrado!"));
        Usuario funcionario = new Usuario();
        funcionario.setNome(dto.getNome());
        funcionario.setCpf(dto.getCpf());
        funcionario.setDataNascimento(dto.getDataNascimento());
        funcionario.setEmail(dto.getEmail());
        funcionario.setSenha(encoder.encode(dto.getSenha()));
        funcionario.setCargo(dto.getCargo());
        funcionario.setTelefone(dto.getTelefone());
        funcionario.setIdRole(3);
        try {
            Usuario salvo = repository.save(funcionario);
            return ResponseEntity.ok(Map.of("mensagem", "Funcionário cadastrado com sucesso!", "id", salvo.getId()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail ou CPF já cadastrado!"));
        }
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody UsuarioRequestDTO dto) {
        if (repository.findByEmail(dto.getEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já cadastrado!"));
        if (dto.getCpf() != null && repository.findByCpf(dto.getCpf()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("mensagem", "CPF já cadastrado!"));
        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setCpf(dto.getCpf());
        usuario.setDataNascimento(dto.getDataNascimento());
        usuario.setCep(dto.getCep());
        usuario.setEndereco(dto.getEndereco());
        usuario.setNumero(dto.getNumero());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefone(dto.getTelefone());
        usuario.setSenha(encoder.encode(dto.getSenha()));
        try {
            Usuario salvo = repository.save(usuario);
            return ResponseEntity.ok(Map.of("mensagem", "Usuário cadastrado com sucesso!", "id", salvo.getId()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail ou CPF já cadastrado!"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UsuarioRequestDTO dto) {
        if (dto.getEmail() == null || dto.getSenha() == null)
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Email e senha são obrigatórios"));
        var usuarioOpt = repository.findByEmail(dto.getEmail());
        if (usuarioOpt.isEmpty())
            return ResponseEntity.status(401).body(Map.of("mensagem", "Email não encontrado"));
        Usuario user = usuarioOpt.get();
        if (!encoder.matches(dto.getSenha(), user.getSenha()))
            return ResponseEntity.status(401).body(Map.of("mensagem", "Senha incorreta"));
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
            if (dto.getNome() != null)           u.setNome(dto.getNome());
            if (dto.getEmail() != null) {
                var existing = repository.findByEmail(dto.getEmail());
                if (existing.isPresent() && !existing.get().getId().equals(id))
                    return ResponseEntity.badRequest().body((Object) Map.of("mensagem", "E-mail já cadastrado!"));
                u.setEmail(dto.getEmail());
            }
            if (dto.getCpf() != null)            u.setCpf(dto.getCpf());
            if (dto.getDataNascimento() != null) u.setDataNascimento(dto.getDataNascimento());
            if (dto.getCep() != null)            u.setCep(dto.getCep());
            if (dto.getEndereco() != null)       u.setEndereco(dto.getEndereco());
            if (dto.getNumero() != null)         u.setNumero(dto.getNumero());
            if (dto.getCargo() != null)          u.setCargo(dto.getCargo());
            if (dto.getTelefone() != null)       u.setTelefone(dto.getTelefone());
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

    @PostMapping(value = "/{id}/imagem", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadImagem(@PathVariable Integer id,
                                           @RequestParam("imagem") MultipartFile file,
                                           HttpServletRequest request) {
        // Valida tipo
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType))
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Formato inválido. Envie JPEG, PNG, GIF ou WebP."));

        // Valida tamanho
        if (file.getSize() > MAX_SIZE)
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Imagem muito grande. Máximo: 5MB."));

        // Valida propriedade: apenas o próprio usuário ou admin pode alterar.
        // Se não há token (ex: upload no fluxo de cadastro), permite sem restrição.
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            var claims = jwtUtil.extractClaims(header.substring(7));
            Integer tokenId = claims.get("id", Integer.class);
            Integer role    = claims.get("role", Integer.class);
            if (!Integer.valueOf(1).equals(role) && !id.equals(tokenId))
                return ResponseEntity.status(403).body(Map.of("mensagem", "Sem permissão para alterar a imagem deste usuário."));
        }

        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Usuario u = opt.get();

        // Remove imagem antiga do R2
        r2.delete(u.getImagemUrl());

        try {
            String url = r2.upload("usuarios", file.getBytes(), contentType);
            u.setImagemUrl(url);
            repository.save(u);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("mensagem", "Falha ao processar o arquivo."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("mensagem", "Falha ao enviar imagem."));
        }
    }

    @GetMapping("/{id}/imagem")
    public ResponseEntity<?> servirImagem(@PathVariable Integer id) {
        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        String url = opt.get().getImagemUrl();
        if (url == null || url.isBlank()) return ResponseEntity.notFound().build();
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, url).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Integer id) {
        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Usuario u = opt.get();
        List<Pet> pets = petRepository.findByUsuarioId(id);
        r2.delete(u.getImagemUrl());
        for (Pet pet : pets) {
            r2.delete(pet.getImagemUrl());
            agendamentoRepository.deleteByPetId(pet.getId());
            petRepository.deleteById(pet.getId());
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Cliente removido com sucesso!"));
    }
}

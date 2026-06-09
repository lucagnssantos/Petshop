package backend.controller;

import backend.dto.PetRequestDTO;
import backend.dto.PetResponseDTO;
import backend.model.Pet;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.security.JwtUtil;
import backend.service.R2StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Tag(name = "Pets", description = "Cadastro e gestão de pets vinculados a clientes")
@RestController
@RequestMapping("/api/pets")
public class PetController {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    @Autowired private PetRepository repository;
    @Autowired private AgendamentoRepository agendamentoRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private R2StorageService r2;

    private String calcularIdade(String dataNascimento) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate nascimento = LocalDate.parse(dataNascimento, formatter);
        Period periodo = Period.between(nascimento, LocalDate.now());
        int anos = periodo.getYears();
        int meses = periodo.getMonths();
        if (anos == 0) return meses <= 1 ? meses + " mês" : meses + " meses";
        return anos == 1 ? "1 ano" : anos + " anos";
    }

    @Operation(summary = "Buscar pet por ID", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Pet encontrado"),
                    @ApiResponse(responseCode = "404", description = "Pet não encontrado") })
    @GetMapping("/{id}")
    public ResponseEntity<PetResponseDTO> buscarPorId(@PathVariable Integer id) {
        return repository.findById(id)
                .map(p -> ResponseEntity.ok(PetResponseDTO.from(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Listar pets do usuário", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Lista de pets do cliente")
    @GetMapping("/usuario/{usuarioId}")
    public List<PetResponseDTO> listarPorUsuario(@PathVariable Integer usuarioId) {
        return repository.findByUsuarioId(usuarioId).stream().map(PetResponseDTO::from).toList();
    }

    @Operation(summary = "Listar todos os pets", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Lista completa de pets")
    @GetMapping
    public List<PetResponseDTO> listarTodos() {
        return repository.findAll().stream().map(PetResponseDTO::from).toList();
    }

    @Operation(summary = "Cadastrar pet", description = "Campo 'idade' deve estar no formato dd/MM/yyyy. A idade é calculada automaticamente.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Pet cadastrado")
    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody PetRequestDTO dto) {
        Pet pet = new Pet();
        pet.setNome(dto.getNome());
        pet.setRaca(dto.getRaca());
        pet.setPorte(dto.getPorte());
        pet.setSexo(dto.getSexo());
        pet.setIdade(calcularIdade(dto.getIdade()));
        pet.setObservacao(dto.getObservacao());
        pet.setUsuarioId(dto.getUsuarioId());
        return ResponseEntity.ok(PetResponseDTO.from(repository.save(pet)));
    }

    @Operation(summary = "Atualizar pet", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Pet atualizado"),
                    @ApiResponse(responseCode = "404", description = "Pet não encontrado") })
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody PetRequestDTO dto) {
        return repository.findById(id).map(p -> {
            if (dto.getNome() != null)       p.setNome(dto.getNome());
            if (dto.getRaca() != null)       p.setRaca(dto.getRaca());
            if (dto.getPorte() != null)      p.setPorte(dto.getPorte());
            if (dto.getSexo() != null)       p.setSexo(dto.getSexo());
            if (dto.getIdade() != null && !dto.getIdade().isBlank()) {
                    try {
                        p.setIdade(calcularIdade(dto.getIdade()));
                    } catch (Exception ignored) {
                        p.setIdade(dto.getIdade());
                    }
                }
            if (dto.getObservacao() != null) p.setObservacao(dto.getObservacao());
            repository.save(p);
            return ResponseEntity.ok(Map.of("mensagem", "Pet atualizado com sucesso!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Remover pet", description = "Bloqueia remoção se houver agendamentos ativos. Remove imagem da CDN.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Pet removido"),
                    @ApiResponse(responseCode = "400", description = "Pet possui agendamentos ativos"),
                    @ApiResponse(responseCode = "404", description = "Pet não encontrado") })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Integer id) {
        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Pet pet = opt.get();
        if (agendamentoRepository.existsByPetIdAndStatus(id, "Agendado"))
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Não é possível remover o pet pois ele possui agendamentos ativos."));
        r2.delete(pet.getImagemUrl());
        agendamentoRepository.deleteByPetId(id);
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Pet removido com sucesso!"));
    }

    @Operation(summary = "Upload de foto do pet", description = "Aceita JPEG, PNG, GIF ou WebP até 5 MB.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "URL da imagem salva"),
                    @ApiResponse(responseCode = "400", description = "Formato ou tamanho inválido"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão"),
                    @ApiResponse(responseCode = "404", description = "Pet não encontrado") })
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

        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Pet pet = opt.get();

        // Valida propriedade: apenas o dono do pet ou admin pode alterar
        String header = request.getHeader("Authorization");
        var claims = jwtUtil.extractClaims(header.substring(7));
        Integer tokenId = claims.get("id", Integer.class);
        Integer role    = claims.get("role", Integer.class);
        if (!Integer.valueOf(1).equals(role) && !tokenId.equals(pet.getUsuarioId()))
            return ResponseEntity.status(403).body(Map.of("mensagem", "Sem permissão para alterar a imagem deste pet."));

        // Remove imagem antiga do R2
        r2.delete(pet.getImagemUrl());

        try {
            String url = r2.upload("pets", file.getBytes(), contentType);
            pet.setImagemUrl(url);
            repository.save(pet);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("mensagem", "Falha ao processar o arquivo."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("mensagem", "Falha ao enviar imagem."));
        }
    }

    @Operation(summary = "Redirecionar para foto do pet", description = "Retorna 302 para a URL da CDN.")
    @ApiResponses({ @ApiResponse(responseCode = "302", description = "Redirect para a imagem"),
                    @ApiResponse(responseCode = "404", description = "Pet ou imagem não encontrada") })
    @GetMapping("/{id}/imagem")
    public ResponseEntity<?> servirImagem(@PathVariable Integer id) {
        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        String url = opt.get().getImagemUrl();
        if (url == null || url.isBlank()) return ResponseEntity.notFound().build();
        return ResponseEntity.status(302).header(HttpHeaders.LOCATION, url).build();
    }
}

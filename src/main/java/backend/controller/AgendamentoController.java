package backend.controller;

import backend.dto.AgendamentoRequestDTO;
import backend.dto.AgendamentoResponseDTO;
import backend.model.Agendamento;
import backend.model.Servico;
import backend.model.Usuario;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.ServicoRepository;
import backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    @Autowired private AgendamentoRepository agendamentoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PetRepository petRepository;
    @Autowired private ServicoRepository servicoRepository;

    private AgendamentoResponseDTO toDTO(Agendamento ag) {
        AgendamentoResponseDTO dto = AgendamentoResponseDTO.from(ag);
        if (ag.getUsuarioId() != null)
            usuarioRepository.findById(ag.getUsuarioId()).ifPresent(u -> dto.setUsuarioNome(u.getNome()));
        if (ag.getPetId() != null)
            petRepository.findById(ag.getPetId()).ifPresent(p -> dto.setPetNome(p.getNome()));
        return dto;
    }

    private int calcularDuracao(String servico) {
        if (servico == null || servico.isBlank()) return 60;
        return Arrays.stream(servico.split(","))
            .map(String::trim)
            .mapToInt(nome -> servicoRepository.findByNome(nome)
                .map(s -> s.getDuracao() != null ? s.getDuracao() : 60)
                .orElse(60))
            .sum();
    }

    private Optional<Integer> escolherFuncionario(String data, boolean isVet) {
        String cargoAlvo = isVet ? "Veterinário" : "Esteticista";
        List<Usuario> candidatos = usuarioRepository.findAll().stream()
            .filter(u -> cargoAlvo.equals(u.getCargo()))
            .toList();
        if (candidatos.isEmpty()) return Optional.empty();
        return candidatos.stream()
            .min(Comparator.comparingInt(u -> agendamentoRepository.findByFuncionarioId(u.getId()).stream()
                .filter(a -> data.equals(a.getData()) && "Agendado".equals(a.getStatus()))
                .mapToInt(a -> a.getDuracaoMinutos() != null ? a.getDuracaoMinutos() : 60)
                .sum()))
            .map(Usuario::getId);
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody AgendamentoRequestDTO dto) {
        List<Servico> servicosList = Arrays.stream(dto.getServico().split(","))
            .map(String::trim)
            .map(nome -> servicoRepository.findByNome(nome).orElse(null))
            .filter(Objects::nonNull)
            .toList();

        boolean hasVet    = servicosList.stream().anyMatch(s -> Boolean.TRUE.equals(s.getIsVet()));
        boolean hasNormal = servicosList.stream().anyMatch(s -> !Boolean.TRUE.equals(s.getIsVet()));
        if (hasVet && hasNormal)
            return ResponseEntity.badRequest().body(Map.of("mensagem",
                "Não é possível misturar serviços veterinários com outros serviços."));

        Optional<Integer> funcionarioId = escolherFuncionario(dto.getData(), hasVet);
        if (funcionarioId.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("mensagem",
                "Nenhum profissional disponível para este tipo de serviço."));

        Agendamento agendamento = new Agendamento();
        agendamento.setUsuarioId(dto.getUsuarioId());
        agendamento.setPetId(dto.getPetId());
        agendamento.setServico(dto.getServico());
        agendamento.setData(dto.getData());
        agendamento.setHora(dto.getHora());
        agendamento.setObservacao(dto.getObservacao());
        agendamento.setStatus("Agendado");
        agendamento.setDuracaoMinutos(calcularDuracao(dto.getServico()));
        agendamento.setFuncionarioId(funcionarioId.get());

        return ResponseEntity.ok(toDTO(agendamentoRepository.save(agendamento)));
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<AgendamentoResponseDTO> listarPorUsuario(@PathVariable Integer usuarioId) {
        return agendamentoRepository.findByUsuarioId(usuarioId).stream().map(this::toDTO).toList();
    }

    @GetMapping("/funcionario/{funcionarioId}")
    public List<AgendamentoResponseDTO> listarPorFuncionario(@PathVariable Integer funcionarioId) {
        return agendamentoRepository.findByFuncionarioId(funcionarioId).stream().map(this::toDTO).toList();
    }

    @GetMapping
    public List<AgendamentoResponseDTO> listarTodos() {
        return agendamentoRepository.findAll().stream().map(this::toDTO).toList();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody AgendamentoRequestDTO dto) {
        return agendamentoRepository.findById(id).map(ag -> {
            if (dto.getServico() != null) {
                ag.setServico(dto.getServico());
                ag.setDuracaoMinutos(calcularDuracao(dto.getServico()));
            }
            if (dto.getData() != null)       ag.setData(dto.getData());
            if (dto.getHora() != null)       ag.setHora(dto.getHora());
            if (dto.getObservacao() != null) ag.setObservacao(dto.getObservacao());
            if (dto.getStatus() != null)     ag.setStatus(dto.getStatus());
            if (dto.getMotivo() != null)     ag.setMotivo(dto.getMotivo());
            agendamentoRepository.save(ag);
            return ResponseEntity.ok(Map.of("mensagem", "Agendamento atualizado."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/disponibilidade")
    public ResponseEntity<?> disponibilidade(
            @RequestParam String data,
            @RequestParam(required = false, defaultValue = "normal") String tipo) {

        String cargoAlvo = "vet".equals(tipo) ? "Veterinário" : "Esteticista";

        Set<Integer> profissionalIds = usuarioRepository.findAll().stream()
            .filter(u -> cargoAlvo.equals(u.getCargo()))
            .map(Usuario::getId)
            .collect(Collectors.toSet());

        List<String> horas = List.of(
            "08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"
        );

        Map<String, Set<Integer>> slotBusy = new LinkedHashMap<>();
        for (String h : horas) slotBusy.put(h, new HashSet<>());

        agendamentoRepository.findByData(data).stream()
            .filter(ag -> "Agendado".equals(ag.getStatus()))
            .filter(ag -> ag.getFuncionarioId() != null && profissionalIds.contains(ag.getFuncionarioId()))
            .forEach(ag -> {
                String hora = ag.getHora();
                if (hora == null || !hora.matches("\\d{2}:\\d{2}")) return;
                int startH  = Integer.parseInt(hora.split(":")[0]);
                int duracao  = ag.getDuracaoMinutos() != null ? ag.getDuracaoMinutos() : 60;
                int slotsNeeded = (int) Math.ceil(duracao / 60.0);
                for (int i = 0; i < slotsNeeded; i++) {
                    String key = String.format("%02d:00", startH + i);
                    if (slotBusy.containsKey(key)) slotBusy.get(key).add(ag.getFuncionarioId());
                }
            });

        Map<String, Integer> slots = new LinkedHashMap<>();
        for (String h : horas)
            slots.put(h, profissionalIds.size() - slotBusy.get(h).size());

        return ResponseEntity.ok(Map.of("slots", slots));
    }
}

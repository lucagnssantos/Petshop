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
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
        if (ag.getServico() != null) {
            boolean vet = Arrays.stream(ag.getServico().split(","))
                .map(String::trim)
                .anyMatch(nome -> servicoRepository.findByNome(nome)
                    .map(s -> Boolean.TRUE.equals(s.getIsVet()))
                    .orElse(false));
            dto.setIsVet(vet);
        }
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

    private Optional<Integer> escolherFuncionario(String data, String hora, int duracaoNova, boolean isVet) {
        String cargoAlvo = isVet ? "Veterinário" : "Esteticista";
        int novaStart = Integer.parseInt(hora.split(":")[0]);
        int novaEnd   = novaStart + (int) Math.ceil(duracaoNova / 60.0);

        List<Usuario> candidatos = usuarioRepository.findAll().stream()
            .filter(u -> cargoAlvo.equals(u.getCargo()))
            .toList();
        if (candidatos.isEmpty()) return Optional.empty();

        return candidatos.stream()
            .filter(u -> agendamentoRepository.findByFuncionarioId(u.getId()).stream()
                .filter(a -> data.equals(a.getData()) && "Agendado".equals(a.getStatus()) && a.getHora() != null)
                .noneMatch(a -> {
                    int eStart = Integer.parseInt(a.getHora().split(":")[0]);
                    int eEnd   = eStart + (int) Math.ceil((a.getDuracaoMinutos() != null ? a.getDuracaoMinutos() : 60) / 60.0);
                    return novaStart < eEnd && novaEnd > eStart;
                }))
            .findFirst()
            .map(Usuario::getId);
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody AgendamentoRequestDTO dto) {
        // Data no passado
        if (LocalDate.parse(dto.getData()).isBefore(LocalDate.now()))
            return ResponseEntity.badRequest().body(Map.of("mensagem",
                "Não é possível agendar em datas passadas."));

        List<Servico> servicosList = Arrays.stream(dto.getServico().split(","))
            .map(String::trim)
            .map(nome -> servicoRepository.findByNome(nome).orElse(null))
            .filter(Objects::nonNull)
            .toList();

        // Mistura de serviços veterinários com gerais
        boolean hasVet    = servicosList.stream().anyMatch(s -> Boolean.TRUE.equals(s.getIsVet()));
        boolean hasNormal = servicosList.stream().anyMatch(s -> !Boolean.TRUE.equals(s.getIsVet()));
        if (hasVet && hasNormal)
            return ResponseEntity.badRequest().body(Map.of("mensagem",
                "Não é possível misturar serviços veterinários com outros serviços."));

        // Pet já tem agendamento no mesmo horário
        boolean petOcupado = agendamentoRepository.findByPetId(dto.getPetId()).stream()
            .anyMatch(a -> dto.getData().equals(a.getData())
                        && dto.getHora().equals(a.getHora())
                        && "Agendado".equals(a.getStatus()));
        if (petOcupado)
            return ResponseEntity.badRequest().body(Map.of("mensagem",
                "Este pet já possui um agendamento neste horário."));

        int duracao = calcularDuracao(dto.getServico());

        // Funcionário livre no horário (com checagem real de sobreposição)
        Optional<Integer> funcionarioId = escolherFuncionario(dto.getData(), dto.getHora(), duracao, hasVet);
        if (funcionarioId.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("mensagem",
                "Nenhum profissional disponível para este horário."));

        Agendamento agendamento = new Agendamento();
        agendamento.setUsuarioId(dto.getUsuarioId());
        agendamento.setPetId(dto.getPetId());
        agendamento.setServico(dto.getServico());
        agendamento.setData(dto.getData());
        agendamento.setHora(dto.getHora());
        agendamento.setObservacao(dto.getObservacao());
        agendamento.setStatus("Agendado");
        agendamento.setDuracaoMinutos(duracao);
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
            // Só agendamentos com status "Agendado" podem ser alterados
            if (!"Agendado".equals(ag.getStatus()))
                return ResponseEntity.badRequest().body(Map.of("mensagem",
                    "Não é possível alterar um agendamento já " + ag.getStatus().toLowerCase() + "."));

            if (dto.getStatus() != null) {
                // Motivo obrigatório ao cancelar
                if ("Cancelado".equals(dto.getStatus()) && (dto.getMotivo() == null || dto.getMotivo().isBlank()))
                    return ResponseEntity.badRequest().body(Map.of("mensagem",
                        "Informe o motivo do cancelamento."));
                ag.setStatus(dto.getStatus());
                if (dto.getMotivo() != null) ag.setMotivo(dto.getMotivo());
            }

            if (dto.getServico() != null) {
                ag.setServico(dto.getServico());
                ag.setDuracaoMinutos(calcularDuracao(dto.getServico()));
            }
            if (dto.getData() != null)       ag.setData(dto.getData());
            if (dto.getHora() != null)       ag.setHora(dto.getHora());
            if (dto.getObservacao() != null) ag.setObservacao(dto.getObservacao());

            try {
                agendamentoRepository.save(ag);
            } catch (ObjectOptimisticLockingFailureException e) {
                return ResponseEntity.status(409).body(Map.of("mensagem",
                    "Este agendamento foi alterado por outro usuário. Recarregue e tente novamente."));
            }
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

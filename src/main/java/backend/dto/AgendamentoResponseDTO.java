package backend.dto;

import backend.model.Agendamento;
import lombok.Data;

@Data
public class AgendamentoResponseDTO {
    private Integer id;
    private Integer usuarioId;
    private Integer petId;
    private String servico;
    private String data;
    private String hora;
    private String observacao;
    private String status;
    private String motivo;
    private Integer duracaoMinutos;
    private Integer funcionarioId;
    private Boolean isVet;
    private String usuarioNome;
    private String petNome;

    public static AgendamentoResponseDTO from(Agendamento ag) {
        AgendamentoResponseDTO dto = new AgendamentoResponseDTO();
        dto.id = ag.getId();
        dto.usuarioId = ag.getUsuarioId();
        dto.petId = ag.getPetId();
        dto.servico = ag.getServico();
        dto.data = ag.getData();
        dto.hora = ag.getHora();
        dto.observacao = ag.getObservacao();
        dto.status = ag.getStatus() != null ? ag.getStatus() : "Agendado";
        dto.motivo = ag.getMotivo();
        dto.duracaoMinutos = ag.getDuracaoMinutos();
        dto.funcionarioId = ag.getFuncionarioId();
        return dto;
    }
}

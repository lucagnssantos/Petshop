package backend.dto;

import lombok.Data;

@Data
public class AgendamentoRequestDTO {
    private Integer usuarioId;
    private Integer petId;
    private String servico;
    private String data;
    private String hora;
    private String observacao;
    private String status;
    private String motivo;
}

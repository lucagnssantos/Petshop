package backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Dados para criar ou atualizar um agendamento")
public class AgendamentoRequestDTO {
    @Schema(description = "ID do cliente", example = "5")
    private Integer usuarioId;
    @Schema(description = "ID do pet", example = "3")
    private Integer petId;
    @Schema(description = "Nome(s) do serviço separados por vírgula", example = "Banho, Tosa")
    private String servico;
    @Schema(description = "Data no formato yyyy-MM-dd", example = "2026-07-15")
    private String data;
    @Schema(description = "Horário no formato HH:mm (08:00 a 17:00)", example = "10:00")
    private String hora;
    @Schema(example = "Pet com alergia a produtos com fragrância forte")
    private String observacao;
    @Schema(description = "Status do agendamento: Agendado, Concluído, Cancelado", example = "Cancelado")
    private String status;
    @Schema(description = "Obrigatório ao cancelar", example = "Cliente solicitou cancelamento")
    private String motivo;
}

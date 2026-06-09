package backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Dados para cadastrar ou atualizar um pet")
public class PetRequestDTO {
    @Schema(example = "Rex")
    private String nome;
    @Schema(example = "Golden Retriever")
    private String raca;
    @Schema(description = "Pequeno, Médio ou Grande", example = "Grande")
    private String porte;
    @Schema(description = "Macho ou Fêmea", example = "Macho")
    private String sexo;
    @Schema(description = "Data de nascimento no formato dd/MM/yyyy", example = "10/05/2021")
    private String idade;
    @Schema(example = "Alérgico a determinados shampoos")
    private String observacao;
    @Schema(description = "ID do cliente dono do pet", example = "5")
    private Integer usuarioId;
}

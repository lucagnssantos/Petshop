package backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Dados para criação ou login de usuário")
public class UsuarioRequestDTO {
    @Schema(description = "Nome completo", example = "João Silva")
    private String nome;
    @Schema(description = "CPF no formato 000.000.000-00", example = "123.456.789-00")
    private String cpf;
    @Schema(description = "Data de nascimento no formato dd/MM/yyyy", example = "15/03/1990")
    private String dataNascimento;
    @Schema(example = "12345-678")
    private String cep;
    @Schema(example = "Rua das Flores")
    private String endereco;
    @Schema(example = "42")
    private String numero;
    @Schema(example = "joao@email.com")
    private String email;
    @Schema(example = "senhaSegura123")
    private String senha;
    @Schema(description = "Cargo do funcionário", example = "Esteticista")
    private String cargo;
    @Schema(description = "Telefone no formato (00) 00000-0000", example = "(11) 99999-9999")
    private String telefone;
}

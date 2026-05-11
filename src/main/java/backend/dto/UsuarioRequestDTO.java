package backend.dto;

import lombok.Data;

@Data
public class UsuarioRequestDTO {
    private String nome;
    private String cpf;
    private String dataNascimento;
    private String cep;
    private String endereco;
    private String numero;
    private String email;
    private String senha;
    private String cargo;
    private String telefone;
}

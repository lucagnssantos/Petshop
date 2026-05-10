package backend.dto;

import backend.model.Usuario;
import lombok.Data;

@Data
public class UsuarioResponseDTO {
    private Integer id;
    private String nome;
    private String cpf;
    private String dataNascimento;
    private String cep;
    private String endereco;
    private String numero;
    private String email;
    private Integer idRole;
    private String cargo;

    public static UsuarioResponseDTO from(Usuario u) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.id = u.getId();
        dto.nome = u.getNome();
        dto.cpf = u.getCpf();
        dto.dataNascimento = u.getDataNascimento();
        dto.cep = u.getCep();
        dto.endereco = u.getEndereco();
        dto.numero = u.getNumero();
        dto.email = u.getEmail();
        dto.idRole = u.getIdRole();
        dto.cargo = u.getCargo();
        return dto;
    }
}

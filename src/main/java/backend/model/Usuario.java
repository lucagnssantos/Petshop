package backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nome;
    private String cpf;
    private String dataNascimento;
    private String cep;
    private String endereco;
    private String numero;
    private String email;
    private String senha;

    // 1 = Admin, 2 = Cliente, 3 = Funcionário
    @Column(name = "id_role")
    private Integer idRole = 2;

    private String cargo;

    @Lob
    @Column(name = "imagem")
    private byte[] imagem;
}

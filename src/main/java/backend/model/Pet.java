package backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "pets")
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nome;
    private String raca;
    private String porte;
    private String sexo;
    private String idade;
    private String observacao;

    @Lob
    @Column(name = "imagem")
    private byte[] imagem;

    @Column(name = "usuario_id")
    private Integer usuarioId;
}

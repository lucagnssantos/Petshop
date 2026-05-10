package backend.dto;

import lombok.Data;

@Data
public class PetRequestDTO {
    private String nome;
    private String raca;
    private String porte;
    private String sexo;
    private String idade;
    private String observacao;
    private Integer usuarioId;
}

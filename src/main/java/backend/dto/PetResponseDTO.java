package backend.dto;

import backend.model.Pet;
import lombok.Data;

@Data
public class PetResponseDTO {
    private Integer id;
    private String nome;
    private String raca;
    private String porte;
    private String sexo;
    private String idade;
    private String observacao;
    private Integer usuarioId;

    public static PetResponseDTO from(Pet p) {
        PetResponseDTO dto = new PetResponseDTO();
        dto.id = p.getId();
        dto.nome = p.getNome();
        dto.raca = p.getRaca();
        dto.porte = p.getPorte();
        dto.sexo = p.getSexo();
        dto.idade = p.getIdade();
        dto.observacao = p.getObservacao();
        dto.usuarioId = p.getUsuarioId();
        return dto;
    }
}

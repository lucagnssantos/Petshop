package backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "agendamentos")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "usuario_id")
    private Integer usuarioId;

    @Column(name = "pet_id")
    private Integer petId;

    private String servico;
    private String data;
    private String hora;
    private String observacao;
    private String status = "Agendado";

    @Version
    private Integer versao;
    private String motivo;

    @Column(name = "duracao_minutos")
    private Integer duracaoMinutos;

    @Column(name = "funcionario_id")
    private Integer funcionarioId;
}

package backend.repository;

import backend.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Integer> {
    List<Agendamento> findByUsuarioId(Integer usuarioId);
    List<Agendamento> findByFuncionarioId(Integer funcionarioId);
    long countByData(String data);
}

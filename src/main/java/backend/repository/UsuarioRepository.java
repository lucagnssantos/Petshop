package backend.repository;

import backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> { // Mudamos de Long para Integer

    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByIdRole(Integer idRole);
}
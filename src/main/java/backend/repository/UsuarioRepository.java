package backend.repository;

import backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // Opcional, mas boa prática
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> { // Mudamos de Long para Integer

    // O Spring gera o SQL: SELECT * FROM usuario WHERE email = ?
    Optional<Usuario> findByEmail(String email);
}
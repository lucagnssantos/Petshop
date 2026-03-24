package com.petshop.petshop.repository;

import com.petshop.petshop.model.Usuario; // Importa sua Entity
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Usuario, Integer> {

    // Este método é essencial para o Login!
    // O Spring vai criar o SQL "SELECT * FROM usuario WHERE email = ..." sozinho.
    Optional<Usuario> findByEmail(String email);
}
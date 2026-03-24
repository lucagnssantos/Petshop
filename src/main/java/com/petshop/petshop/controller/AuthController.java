package com.petshop.petshop.controller;

import com.petshop.petshop.model.Usuario;
import com.petshop.petshop.service.JwtService;
import com.petshop.petshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String senha = loginData.get("senha");

        // 1. Busca o usuário no MySQL pelo e-mail
        Optional<Usuario> usuarioOpt = userRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            // 2. Verifica se a senha bate
            if (usuario.getSenha().equals(senha)) {

                // 3. AGORA PASSAMOS O OBJETO USUÁRIO INTEIRO
                // Isso permite que o JwtService pegue o idRole e coloque no Token
                String token = jwtService.generateToken(usuario);

                // 4. Retorna o Token para o HTML
                return ResponseEntity.ok(Map.of("token", token));
            }
        }

        return ResponseEntity.status(401).body("E-mail ou senha incorretos.");
    }
}
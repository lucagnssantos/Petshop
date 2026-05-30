package backend.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    private static final String SECRET = "minhaChaveSecretaSuperSeguraParaTestesDoPetGO2024!!";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
    }

    @Test
    void deveGerarTokenValido() {
        String token = jwtUtil.generateToken(1, "maria@email.com", 2, null);
        assertTrue(jwtUtil.isValid(token));
    }

    @Test
    void deveExtrairEmailDoToken() {
        String token = jwtUtil.generateToken(1, "maria@email.com", 2, null);
        assertEquals("maria@email.com", jwtUtil.extractEmail(token));
    }

    @Test
    void deveConterRoleCorretaNoToken() {
        String token = jwtUtil.generateToken(5, "admin@email.com", 1, "Gerente");
        Claims claims = jwtUtil.extractClaims(token);
        assertEquals(1, claims.get("role", Integer.class));
        assertEquals(5, claims.get("id", Integer.class));
    }

    @Test
    void deveConterCargoNoToken() {
        String token = jwtUtil.generateToken(3, "vet@email.com", 3, "Veterinário");
        Claims claims = jwtUtil.extractClaims(token);
        assertEquals("Veterinário", claims.get("cargo", String.class));
    }

    @Test
    void cargoNullDeveSerStringVaziaNoToken() {
        String token = jwtUtil.generateToken(1, "cliente@email.com", 2, null);
        Claims claims = jwtUtil.extractClaims(token);
        assertEquals("", claims.get("cargo", String.class));
    }

    @Test
    void tokenInvalidoDeveRetornarFalse() {
        assertFalse(jwtUtil.isValid("token.invalido.aqui"));
    }

    @Test
    void tokenVazioDeveRetornarFalse() {
        assertFalse(jwtUtil.isValid(""));
    }

    @Test
    void tokenAlteradoDeveRetornarFalse() {
        String token = jwtUtil.generateToken(1, "test@test.com", 2, null);
        String tokenAlterado = token.substring(0, token.length() - 5) + "XXXXX";
        assertFalse(jwtUtil.isValid(tokenAlterado));
    }
}

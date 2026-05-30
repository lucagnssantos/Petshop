package backend.repository;

import backend.DataLoader;
import backend.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UsuarioRepositoryTest {

    // Substitui o DataLoader por um no-op para não popular o banco com seed data
    @MockitoBean
    private DataLoader dataLoader;

    @Autowired
    private UsuarioRepository repository;

    private Usuario criarUsuario(String nome, String email, String cpf, Integer role, String cargo) {
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setCpf(cpf);
        u.setSenha("senha-hash");
        u.setIdRole(role);
        u.setCargo(cargo);
        return repository.save(u);
    }

    // ─── findByEmail ──────────────────────────────────────────────────────────

    @Test
    void findByEmailDeveRetornarUsuarioQuandoExiste() {
        criarUsuario("Maria", "maria_test@email.com", "111.111.111-11", 2, null);

        Optional<Usuario> resultado = repository.findByEmail("maria_test@email.com");

        assertTrue(resultado.isPresent());
        assertEquals("Maria", resultado.get().getNome());
    }

    @Test
    void findByEmailDeveRetornarVazioQuandoNaoExiste() {
        Optional<Usuario> resultado = repository.findByEmail("fantasma@email.com");

        assertTrue(resultado.isEmpty());
    }

    // ─── findByCpf ────────────────────────────────────────────────────────────

    @Test
    void findByCpfDeveRetornarUsuarioQuandoExiste() {
        criarUsuario("João", "joao_test@email.com", "333.333.333-33", 2, null);

        Optional<Usuario> resultado = repository.findByCpf("333.333.333-33");

        assertTrue(resultado.isPresent());
        assertEquals("João", resultado.get().getNome());
    }

    @Test
    void findByCpfDeveRetornarVazioQuandoNaoExiste() {
        Optional<Usuario> resultado = repository.findByCpf("000.000.000-00");

        assertTrue(resultado.isEmpty());
    }

    // ─── findByIdRole ─────────────────────────────────────────────────────────

    @Test
    void findByIdRoleDeveRetornarApenasClientesQuandoRole2() {
        criarUsuario("Cliente1", "cli1_test@email.com", "111.000.000-01", 2, null);
        criarUsuario("Cliente2", "cli2_test@email.com", "222.000.000-01", 2, null);
        criarUsuario("Func1",    "fun1_test@email.com", "333.000.000-01", 3, "Esteticista");

        List<Usuario> clientes = repository.findByIdRole(2);

        assertEquals(2, clientes.size());
        assertTrue(clientes.stream().allMatch(u -> u.getIdRole() == 2));
    }

    @Test
    void findByIdRoleDeveRetornarFuncionariosQuandoRole3() {
        criarUsuario("Func1", "func1_test@email.com", "444.000.000-01", 3, "Esteticista");
        criarUsuario("Func2", "func2_test@email.com", "555.000.000-01", 3, "Veterinário");
        criarUsuario("Admin", "admin_test@email.com", "666.000.000-01", 1, null);

        List<Usuario> funcionarios = repository.findByIdRole(3);

        assertEquals(2, funcionarios.size());
        assertTrue(funcionarios.stream().allMatch(u -> u.getIdRole() == 3));
    }

    @Test
    void findByIdRoleDeveRetornarListaVaziaQuandoSemUsuariosNaRole() {
        criarUsuario("Admin", "adm_test@email.com", "777.000.000-01", 1, null);

        List<Usuario> clientes = repository.findByIdRole(2);

        assertTrue(clientes.isEmpty());
    }

    // ─── Unicidade de email e CPF ─────────────────────────────────────────────

    @Test
    void deveLancarExcecaoAoSalvarEmailDuplicado() {
        criarUsuario("Maria", "dupEmail_test@email.com", "101.010.101-01", 2, null);

        Usuario duplicado = new Usuario();
        duplicado.setNome("Outro");
        duplicado.setEmail("dupEmail_test@email.com");
        duplicado.setSenha("hash");
        duplicado.setIdRole(2);

        assertThrows(Exception.class, () -> repository.saveAndFlush(duplicado));
    }

    @Test
    void deveLancarExcecaoAoSalvarCpfDuplicado() {
        criarUsuario("Maria", "cpf1_test@email.com", "202.020.202-02", 2, null);

        Usuario duplicado = new Usuario();
        duplicado.setNome("Outro");
        duplicado.setEmail("cpf2_test@email.com");
        duplicado.setCpf("202.020.202-02");
        duplicado.setSenha("hash");
        duplicado.setIdRole(2);

        assertThrows(Exception.class, () -> repository.saveAndFlush(duplicado));
    }
}

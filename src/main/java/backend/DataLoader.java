package backend;

import backend.model.Agendamento;
import backend.model.Pet;
import backend.model.Servico;
import backend.model.Usuario;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import backend.repository.AgendamentoRepository;
import backend.repository.PetRepository;
import backend.repository.ServicoRepository;
import backend.repository.UsuarioRepository;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements ApplicationRunner {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PetRepository petRepository;
    @Autowired private AgendamentoRepository agendamentoRepository;
    @Autowired private ServicoRepository servicoRepository;
    @Autowired private JdbcTemplate jdbc;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public void run(ApplicationArguments args) {
        agendamentoRepository.deleteAll();
        petRepository.deleteAll();
        usuarioRepository.deleteAll();
        servicoRepository.deleteAll();
        jdbc.execute("ALTER TABLE agendamentos AUTO_INCREMENT = 1");
        jdbc.execute("ALTER TABLE pets AUTO_INCREMENT = 1");
        jdbc.execute("ALTER TABLE usuarios AUTO_INCREMENT = 1");
        jdbc.execute("ALTER TABLE servicos AUTO_INCREMENT = 1");

        // ===================== SERVIÇOS =====================
        servico("Banho",         60, false);
        servico("Tosa",          60, false);
        servico("Corte de unha", 30, false);
        servico("Desembolamento",45, false);
        servico("Hidratação",    30, false);
        servico("Consulta",      30, true);
        servico("Vacinação",     20, true);

        // ===================== ADMIN =====================
        Usuario admin = usuario("Administrador PetGO", "000.000.000-00", "01/01/1990",
                "01310-100", "Av. Paulista", "1000", "admin@petgo.com", "Admin@123", 1, null, null);

        // ===================== FUNCIONÁRIOS =====================
        Usuario vet = usuario("Carlos Eduardo Souza", "111.111.111-11", "15/03/1988",
                null, null, null, "carlos.vet@petgo.com", "Func@123", 3, "Veterinário", "(11) 99111-1111");

        Usuario esteticista1 = usuario("Fernanda Lima", "222.222.222-22", "22/07/1995",
                null, null, null, "fernanda.est@petgo.com", "Func@123", 3, "Esteticista", "(11) 99222-2222");

        Usuario esteticista2 = usuario("Ricardo Alves", "333.333.333-33", "10/11/1992",
                null, null, null, "ricardo.est@petgo.com", "Func@123", 3, "Esteticista", "(11) 99333-3333");

        Usuario atendente = usuario("Juliana Martins", "444.444.444-44", "05/06/1997",
                null, null, null, "juliana.at@petgo.com", "Func@123", 3, "Atendente", "(11) 99444-4444");

        // ===================== CLIENTES =====================
        Usuario ana = usuario("Ana Paula Ferreira", "555.555.555-55", "14/02/1990",
                "04538-133", "Rua Funchal", "129", "ana.paula@email.com", "Cliente@123", 2, null, "(11) 98501-1001");

        Usuario joao = usuario("João Vitor Santos", "666.666.666-66", "30/08/1985",
                "01401-000", "Rua Augusta", "800", "joao.vitor@email.com", "Cliente@123", 2, null, "(11) 97602-2002");

        Usuario mariana = usuario("Mariana Costa", "777.777.777-77", "19/12/1998",
                "05001-100", "Av. Rebouças", "3970", "mariana.costa@email.com", "Cliente@123", 2, null, "(11) 96703-3003");

        Usuario pedro = usuario("Pedro Henrique Gomes", "888.888.888-88", "07/04/1993",
                "02010-000", "Rua do Triunfo", "45", "pedro.gomes@email.com", "Cliente@123", 2, null, "(11) 95804-4004");

        Usuario lucia = usuario("Lúcia Oliveira Nunes", "999.999.999-99", "25/09/1975",
                "03101-000", "Av. Rangel Pestana", "220", "lucia.nunes@email.com", "Cliente@123", 2, null, "(11) 94905-5005");

        Usuario rafael = usuario("Rafael Mendes Carvalho", "101.010.101-01", "12/05/1994",
                "01310-200", "Av. Paulista", "500", "rafael.mendes@email.com", "Cliente@123", 2, null, "(11) 93106-6006");

        Usuario camila = usuario("Camila Torres Braga", "202.020.202-02", "08/11/1996",
                "04551-060", "Rua Leopoldo Couto", "308", "camila.torres@email.com", "Cliente@123", 2, null, "(11) 92207-7007");

        Usuario felipe = usuario("Felipe Rocha Andrade", "303.030.303-03", "21/03/1988",
                "05424-020", "Av. Sumaré", "1420", "felipe.rocha@email.com", "Cliente@123", 2, null, "(11) 91308-8008");

        Usuario beatriz = usuario("Beatriz Nascimento Silva", "404.040.404-04", "03/07/2000",
                "09520-070", "Rua Marechal Deodoro", "77", "beatriz.nasc@email.com", "Cliente@123", 2, null, "(11) 98409-9009");

        Usuario gustavo = usuario("Gustavo Lima Pereira", "505.050.505-05", "17/09/1991",
                "01414-001", "Rua Oscar Freire", "900", "gustavo.lima@email.com", "Cliente@123", 2, null, "(11) 97510-0010");

        Usuario isabela = usuario("Isabela Rodrigues Pinto", "606.060.606-06", "29/01/1997",
                "04571-010", "Rua das Olimpíadas", "200", "isabela.rod@email.com", "Cliente@123", 2, null, "(11) 96611-1011");

        Usuario thiago = usuario("Thiago Barbosa Correia", "707.070.707-07", "14/06/1983",
                "01244-020", "Rua Consolação", "2300", "thiago.barb@email.com", "Cliente@123", 2, null, "(11) 95712-2012");

        Usuario natalia = usuario("Natália Souza Freitas", "808.080.808-08", "05/10/1999",
                "03303-000", "Av. Celso Garcia", "850", "natalia.souza@email.com", "Cliente@123", 2, null, "(11) 94813-3013");

        Usuario lucas = usuario("Lucas Ferreira Matos", "909.090.909-09", "22/04/1995",
                "05009-000", "Rua Cardoso de Almeida", "1100", "lucas.ferreira@email.com", "Cliente@123", 2, null, "(11) 93914-4014");

        Usuario juliana = usuario("Juliana Pires Vieira", "110.110.110-10", "11/12/1992",
                "04711-130", "Av. João Dias", "640", "juliana.pires@email.com", "Cliente@123", 2, null, "(11) 92015-5015");

        Usuario marcos = usuario("Marcos Antônio Ribeiro", "220.220.220-20", "28/02/1980",
                "03047-000", "Rua do Gasômetro", "400", "marcos.ribeiro@email.com", "Cliente@123", 2, null, "(11) 91116-6016");

        Usuario carolina = usuario("Carolina Duarte Monteiro", "330.330.330-30", "16/08/2001",
                "05305-902", "Rua Butantã", "370", "carolina.duarte@email.com", "Cliente@123", 2, null, "(11) 98217-7017");

        // ===================== PETS =====================
        Pet mel      = pet("Mel",      "Golden Retriever", "Grande",  "Fêmea", "3 anos", "Dócil, adora banho",                     ana.getId());
        Pet bolinha  = pet("Bolinha",  "Poodle",           "Pequeno", "Macho", "1 ano",  "Muito agitado",                          ana.getId());
        Pet thor     = pet("Thor",     "Rottweiler",       "Grande",  "Macho", "5 anos", "Precisa de focinheira durante tosa",      joao.getId());
        Pet luna     = pet("Luna",     "Shih Tzu",         "Pequeno", "Fêmea", "2 anos", "Pelo longo, tosa a cada 45 dias",        mariana.getId());
        Pet simba    = pet("Simba",    "Persa",            "Pequeno", "Macho", "4 anos", "Gato, muito tranquilo",                  mariana.getId());
        Pet bob      = pet("Bob",      "Labrador",         "Grande",  "Macho", "6 anos", "Alérgico a shampoo com fragrância",      pedro.getId());
        Pet nina     = pet("Nina",     "Dachshund",        "Pequeno", "Fêmea", "7 anos", "Coluna sensível, cuidado ao segurar",    lucia.getId());
        Pet rex      = pet("Rex",      "Pastor Alemão",    "Grande",  "Macho", "4 anos", "Só tosa higiênica",                     lucia.getId());
        Pet pipoca   = pet("Pipoca",   "Maltês",           "Pequeno", "Fêmea", "2 anos", "Pelo branco, usar shampoo clareador",    rafael.getId());
        Pet cookie   = pet("Cookie",   "Beagle",           "Médio",   "Fêmea", "3 anos", "Ativa e brincalhona",                   camila.getId());
        Pet zeus     = pet("Zeus",     "Husky Siberiano",  "Grande",  "Macho", "2 anos", "Pelagem densa, demora mais para secar",  felipe.getId());
        Pet mia      = pet("Mia",      "Siamês",           "Pequeno", "Fêmea", "5 anos", "Gata, comportamento agitado no banho",  beatriz.getId());
        Pet caramelo = pet("Caramelo", "SRD",              "Médio",   "Macho", "4 anos", "Resgatado, muito dócil",                gustavo.getId());
        Pet nala     = pet("Nala",     "Border Collie",    "Grande",  "Fêmea", "1 ano",  "Filhote, primeira vez no pet shop",     isabela.getId());
        Pet frida    = pet("Frida",    "Yorkshire",        "Pequeno", "Fêmea", "6 anos", "Tosa a cada 30 dias",                   thiago.getId());
        Pet apolo    = pet("Apolo",    "Dálmata",          "Grande",  "Macho", "3 anos", "Ansioso, fica agitado com barulho",     natalia.getId());
        Pet lola     = pet("Lola",     "Spitz Alemão",     "Pequeno", "Fêmea", "2 anos", "Muito peluda, desembolamento frequente", lucas.getId());
        Pet duke     = pet("Duke",     "Boxer",            "Grande",  "Macho", "5 anos", "Focinheiro largo, cuidado na tosa",     juliana.getId());
        Pet amendoim = pet("Amendoim", "Lhasa Apso",       "Pequeno", "Macho", "8 anos", "Idoso, cuidado extra no manuseio",      marcos.getId());
        Pet aurora   = pet("Aurora",   "Golden Retriever", "Grande",  "Fêmea", "1 ano",  "Filhote, super agitada",                carolina.getId());

        // ===================== AGENDAMENTOS =====================
        // Agendamentos concluídos
        agendamento(ana.getId(), mel.getId(), "Banho, Tosa", "2026-04-10", "09:00", "Tosa estilo urso", "Concluído", null);
        agendamento(joao.getId(), thor.getId(), "Banho", "2026-04-12", "14:00", null, "Concluído", null);
        agendamento(mariana.getId(), luna.getId(), "Tosa", "2026-04-15", "10:00", "Tosa estilo franja curta", "Concluído", null);
        agendamento(pedro.getId(), bob.getId(), "Banho", "2026-04-18", "11:00", "Usar shampoo neutro", "Concluído", null);
        agendamento(lucia.getId(), nina.getId(), "Corte de unha", "2026-04-20", "08:00", null, "Concluído", null);

        // Agendamentos de hoje (data dinâmica)
        String hoje = LocalDate.now().toString();
        agendamento(gustavo.getId(), caramelo.getId(), "Banho, Tosa",  hoje, "09:00", null,                    "Agendado",  null);
        agendamento(juliana.getId(), duke.getId(),     "Corte de unha", hoje, "10:00", "Unhas bem compridas",  "Agendado",  null);
        agendamento(ana.getId(),     mel.getId(),      "Consulta",      hoje, "08:00", "Check-up de rotina",        "Concluído", null);
        agendamento(joao.getId(),   thor.getId(),     "Vacinação",     hoje, "11:00", "Reforço antirrábica",       "Cancelado", "Tutor não pôde comparecer no horário.");
        agendamento(beatriz.getId(),mia.getId(),      "Consulta",      hoje, "12:00", "Gata agitada, usar luvas",  "Agendado",  null);
        agendamento(lucas.getId(),  lola.getId(),     "Vacinação",     hoje, "13:00", "Reforço anual",             "Agendado",  null);
        agendamento(mariana.getId(),simba.getId(),    "Consulta",      hoje, "14:00", "Primeiro check-up do Simba","Agendado",  null);

        // Agendamentos agendados (futuros)
        agendamento(ana.getId(), bolinha.getId(), "Banho, Tosa", "2026-05-15", "09:00", null, "Agendado", null);
        agendamento(mariana.getId(), simba.getId(), "Banho", "2026-05-16", "10:00", "Primeiro banho do Simba aqui", "Agendado", null);
        agendamento(joao.getId(), thor.getId(), "Tosa", "2026-05-17", "14:00", null, "Agendado", null);
        agendamento(lucia.getId(), rex.getId(), "Banho, Tosa", "2026-05-18", "09:00", "Tosa higiênica apenas", "Agendado", null);
        agendamento(pedro.getId(), bob.getId(), "Hidratação", "2026-05-20", "11:00", "Pelo ressecado", "Agendado", null);

        // Agendamentos cancelados
        agendamento(ana.getId(), mel.getId(), "Tosa", "2026-04-25", "15:00", null, "Cancelado", "Mel estava doente no dia, veterinário recomendou repouso.");
        agendamento(mariana.getId(), luna.getId(), "Banho", "2026-04-28", "13:00", null, "Cancelado", "Viagem inesperada da tutora, não foi possível comparecer.");
        agendamento(gustavo.getId(), caramelo.getId(), "Banho, Tosa", "2026-04-22", "10:00", null, "Cancelado", "Problema de saúde do tutor.");

        // Agendamentos concluídos — novos clientes
        agendamento(rafael.getId(),  pipoca.getId(),   "Tosa",           "2026-04-05", "09:00", "Tosa higiênica",                  "Concluído", null);
        agendamento(camila.getId(),  cookie.getId(),   "Banho",          "2026-04-07", "11:00", null,                             "Concluído", null);
        agendamento(felipe.getId(),  zeus.getId(),     "Banho, Tosa",   "2026-04-08", "14:00", "Pelagem densa, usar secador forte","Concluído", null);
        agendamento(beatriz.getId(), mia.getId(),      "Banho",          "2026-04-09", "10:00", "Gata, precisa de contenção",      "Concluído", null);
        agendamento(isabela.getId(), nala.getId(),     "Banho",          "2026-04-11", "09:00", "Primeiro banho",                  "Concluído", null);
        agendamento(thiago.getId(),  frida.getId(),    "Tosa",           "2026-04-13", "15:00", "Tosa padrão Yorkshire",           "Concluído", null);
        agendamento(natalia.getId(), apolo.getId(),    "Banho, Tosa",   "2026-04-14", "08:00", null,                             "Concluído", null);
        agendamento(lucas.getId(),   lola.getId(),     "Desembolamento", "2026-04-16", "11:00", "Pelos muito emaranhados",         "Concluído", null);
        agendamento(juliana.getId(), duke.getId(),     "Banho",          "2026-04-17", "13:00", null,                             "Concluído", null);
        agendamento(marcos.getId(),  amendoim.getId(), "Corte de unha",  "2026-04-19", "08:00", "Unhas muito compridas",           "Concluído", null);
        agendamento(carolina.getId(),aurora.getId(),   "Banho",          "2026-04-21", "10:00", "Primeiro banho da filhote",       "Concluído", null);

        // Agendamentos futuros — novos clientes
        agendamento(rafael.getId(),  pipoca.getId(),   "Banho, Tosa",   "2026-05-21", "09:00", null,                             "Agendado", null);
        agendamento(camila.getId(),  cookie.getId(),   "Hidratação",     "2026-05-22", "10:00", null,                             "Agendado", null);
        agendamento(felipe.getId(),  zeus.getId(),     "Banho",          "2026-05-23", "14:00", null,                             "Agendado", null);
        agendamento(beatriz.getId(), mia.getId(),      "Banho",          "2026-05-24", "11:00", "Usar luvas de proteção",          "Agendado", null);
        agendamento(isabela.getId(), nala.getId(),     "Banho, Tosa",   "2026-05-26", "09:00", null,                             "Agendado", null);
        agendamento(thiago.getId(),  frida.getId(),    "Tosa",           "2026-05-27", "15:00", null,                             "Agendado", null);
        agendamento(natalia.getId(), apolo.getId(),    "Banho",          "2026-05-28", "08:00", null,                             "Agendado", null);
        agendamento(lucas.getId(),   lola.getId(),     "Desembolamento", "2026-05-29", "11:00", null,                             "Agendado", null);
        agendamento(marcos.getId(),  amendoim.getId(), "Banho, Tosa",   "2026-05-30", "09:00", "Cuidado extra por ser idoso",     "Agendado", null);
        agendamento(carolina.getId(),aurora.getId(),   "Tosa",           "2026-06-02", "10:00", null,                             "Agendado", null);

        // Agendamentos veterinários
        agendamento(pedro.getId(),   bob.getId(),      "Consulta",       "2026-04-23", "09:00", "Check-up anual",                  "Concluído", null);
        agendamento(beatriz.getId(), mia.getId(),      "Vacinação",      "2026-05-31", "11:00", "Reforço anual de vacinas",        "Agendado",  null);
        agendamento(lucas.getId(),   lola.getId(),     "Consulta",       "2026-04-30", "14:00", "Suspeita de alergia alimentar",   "Cancelado", "Tutora não pôde comparecer, reagendamento necessário.");

        System.out.println("=== DataLoader: banco populado com sucesso! ===");
        System.out.println("Admin:            admin@petgo.com        / Admin@123");
        System.out.println("Veterinário:      carlos.vet@petgo.com   / Func@123");
        System.out.println("Esteticista:      fernanda.est@petgo.com / Func@123");
        System.out.println("Atendente:        juliana.at@petgo.com   / Func@123");
        System.out.println("Cliente:          ana.paula@email.com    / Cliente@123");
    }

    private Usuario usuario(String nome, String cpf, String dataNascimento,
                             String cep, String endereco, String numero,
                             String email, String senha, int role, String cargo, String telefone) {
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setCpf(cpf);
        u.setDataNascimento(dataNascimento);
        u.setCep(cep);
        u.setEndereco(endereco);
        u.setNumero(numero);
        u.setEmail(email);
        u.setSenha(encoder.encode(senha));
        u.setIdRole(role);
        u.setCargo(cargo);
        u.setTelefone(telefone);
        return usuarioRepository.save(u);
    }

    private Pet pet(String nome, String raca, String porte, String sexo, String idade, String observacao, Integer usuarioId) {
        Pet p = new Pet();
        p.setNome(nome);
        p.setRaca(raca);
        p.setPorte(porte);
        p.setSexo(sexo);
        p.setIdade(idade);
        p.setObservacao(observacao);
        p.setUsuarioId(usuarioId);
        return petRepository.save(p);
    }

    private void servico(String nome, int duracao, boolean isVet) {
        Servico s = new Servico();
        s.setNome(nome);
        s.setDuracao(duracao);
        s.setIsVet(isVet);
        servicoRepository.save(s);
    }

    private void agendamento(Integer usuarioId, Integer petId, String servico,
                              String data, String hora, String observacao, String status, String motivo) {
        boolean isVet = Arrays.stream(servico.split(","))
            .map(String::trim)
            .anyMatch(nome -> servicoRepository.findByNome(nome)
                .map(s -> Boolean.TRUE.equals(s.getIsVet()))
                .orElse(false));

        Agendamento ag = new Agendamento();
        ag.setUsuarioId(usuarioId);
        ag.setPetId(petId);
        ag.setServico(servico);
        ag.setData(data);
        ag.setHora(hora);
        ag.setObservacao(observacao);
        ag.setStatus(status);
        ag.setMotivo(motivo);
        ag.setDuracaoMinutos(calcularDuracao(servico));
        ag.setFuncionarioId(escolherFuncionario(data, isVet));
        agendamentoRepository.save(ag);
    }

    private Integer escolherFuncionario(String data, boolean isVet) {
        String cargoAlvo = isVet ? "Veterinário" : "Esteticista";
        List<backend.model.Usuario> candidatos = usuarioRepository.findAll().stream()
            .filter(u -> cargoAlvo.equals(u.getCargo()))
            .toList();
        if (candidatos.isEmpty()) return null;
        return candidatos.stream()
            .min(Comparator.comparingInt(u -> agendamentoRepository.findByFuncionarioId(u.getId()).stream()
                .filter(a -> data.equals(a.getData()) && "Agendado".equals(a.getStatus()))
                .mapToInt(a -> a.getDuracaoMinutos() != null ? a.getDuracaoMinutos() : 60)
                .sum()))
            .map(backend.model.Usuario::getId)
            .orElse(null);
    }

    private int calcularDuracao(String servico) {
        if (servico == null || servico.isBlank()) return 60;
        return Arrays.stream(servico.split(","))
            .map(String::trim)
            .mapToInt(nome -> servicoRepository.findByNome(nome)
                .map(s -> s.getDuracao() != null ? s.getDuracao() : 60)
                .orElse(60))
            .sum();
    }
}

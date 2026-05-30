package backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping({"/", "/index.html"})
    public String index() { return "index"; }

    @GetMapping("/login.html")
    public String login() { return "login"; }

    @GetMapping("/cadastro.html")
    public String cadastro() { return "cadastro"; }

    @GetMapping("/perfil.html")
    public String perfil() { return "perfil"; }

    @GetMapping("/editar-perfil.html")
    public String editarPerfil() { return "editar-perfil"; }

    @GetMapping("/agendar.html")
    public String agendar() { return "agendar"; }

    @GetMapping("/cadastro-pet.html")
    public String cadastroPet() { return "cadastro-pet"; }

    @GetMapping("/cliente.html")
    public String cliente() { return "cliente"; }

    @GetMapping("/pet.html")
    public String pet() { return "pet"; }

    @GetMapping("/func-detalhe.html")
    public String funcDetalhe() { return "func-detalhe"; }

    @GetMapping("/admin.html")
    public String admin() { return "admin"; }

    @GetMapping("/funcionario.html")
    public String funcionario() { return "funcionario"; }

    @GetMapping("/cadastro-funcionario.html")
    public String cadastroFuncionario() { return "cadastro-funcionario"; }
}

package com.petshop.petshop.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/home")
    public String home() {
        return "forward:/Home.html";
    }

    @GetMapping("/pagina1")
    public String pagina1() {
        return "forward:/Pagina1.html";
    }

    @GetMapping("/pagina2")
    public String pagina2() {
        return "forward:/Pagina2.html";
    }
}
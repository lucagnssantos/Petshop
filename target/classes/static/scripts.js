document.addEventListener("DOMContentLoaded", () => {
    const btnCadastrar = document.getElementById("btnCadastrar");
    const inputImagem = document.getElementById("inputImagem");

    // --- 1. Lógica do Preview da Imagem ---
    window.previewImagem = function(event) {
        const nomeArquivo = document.getElementById('nomeArquivo');
        const fotoPreview = document.getElementById('fotoPreview');

        if (event.target.files && event.target.files[0]) {
            nomeArquivo.textContent = event.target.files[0].name;

            const reader = new FileReader();
            reader.onload = function(e) {
                fotoPreview.src = e.target.result;
                fotoPreview.style.display = 'inline-block';
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    // --- 2. Lógica do Envio do Cadastro ---
    btnCadastrar.addEventListener("click", async (event) => {
        event.preventDefault();

        // Captura os dados exatamente como estão na sua classe Usuario.java
        const usuario = {
            nome: document.getElementById("nome").value,
            cpf: document.getElementById("cpf").value,
            dataNascimento: document.getElementById("dataNascimento").value,
            cep: document.getElementById("cep").value,
            endereco: document.getElementById("endereco").value,
            numero: document.getElementById("numero").value,
            email: document.getElementById("email").value,
            senha: document.getElementById("senha").value
        };

        const senhaRepetida = document.getElementById("senhaRepetida").value;

        // Validação de senha
        if (usuario.senha !== senhaRepetida) {
            alert("As senhas não coincidem!");
            return;
        }

        // Validação de campos vazios (opcional, mas recomendado)
        if (!usuario.nome || !usuario.email || !usuario.senha) {
            alert("Por favor, preencha os campos obrigatórios (Nome, Email e Senha).");
            return;
        }

        try {
            // Envia para o seu UsuarioController
            const response = await fetch("http://localhost:8080/api/usuarios/cadastrar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(usuario)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Sucesso! Usuário cadastrado com ID: " + data.id);
                window.location.href = "login.html";
            } else {
                alert("Erro: " + (data.mensagem || "Falha ao cadastrar"));
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Não foi possível conectar ao servidor. Verifique se o projeto Spring está rodando!");
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btnLogin");

    btnLogin.addEventListener("click", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        console.log("Tentando login...");

        try {
            const response = await fetch("http://localhost:8080/api/usuarios/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Login realizado com sucesso!");

                // redireciona
                window.location.href = "index.html";
            } else {
                alert("Email ou senha inválidos");
            }

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        }
    });
});
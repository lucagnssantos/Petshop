document.addEventListener("DOMContentLoaded", () => {

    const btnCadastrar = document.getElementById("btnCadastrar");

    if (btnCadastrar) {
        btnCadastrar.addEventListener("click", async (event) => {
            event.preventDefault();

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

            if (usuario.senha !== senhaRepetida) {
                alert("As senhas não coincidem!");
                return;
            }

            try {
                const response = await fetch("http://localhost:8080/api/usuarios/cadastrar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(usuario)
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Cadastrado com sucesso!");
                    window.location.href = "login.html";
                } else {
                    alert(data.mensagem);
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    // ================= LOGIN =================

    const btnLogin = document.getElementById("btnLogin");

    if (btnLogin) {
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
                    window.location.href = "index.html";
                } else {
                    alert(data.mensagem || "Erro no login");
                }

            } catch (error) {
                console.error(error);
                alert("Erro ao conectar com o servidor");
            }
        });
    }

});
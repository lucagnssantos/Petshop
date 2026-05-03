document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = "http://localhost:8080";

    // ================= AUTH FETCH =================

    function authFetch(url, options = {}) {
        const token = localStorage.getItem("petgo_token");
        const headers = { ...(options.headers || {}) };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return fetch(url, { ...options, headers });
    }

    // ================= TOAST =================

    function toast(mensagem, tipo = "primary") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            document.body.appendChild(container);
        }

        const notif = document.createElement("div");
        notif.className = `notification is-${tipo}`;
        notif.innerHTML = `<button class="delete"></button>${mensagem}`;

        container.appendChild(notif);

        notif.querySelector(".delete").addEventListener("click", () => fecharToast(notif));

        setTimeout(() => fecharToast(notif), 4000);
    }

    function fecharToast(notif) {
        notif.classList.add("toast-saindo");
        notif.addEventListener("animationend", () => notif.remove(), { once: true });
    }

    // ================= NAVBAR USUÁRIO =================

    function inicializarNavUsuario() {
        const nome = localStorage.getItem("petgo_nome");
        const navNome = document.getElementById("nav-nome");
        const navAvatar = document.getElementById("nav-avatar");
        const navBtnEntrar = document.getElementById("nav-btn-entrar");
        const navUsuario = document.getElementById("nav-usuario");

        if (nome) {
            if (navNome) navNome.textContent = nome.split(" ")[0];
            if (navAvatar) navAvatar.src = `https://placehold.co/40x40?text=${nome[0].toUpperCase()}`;
            if (navBtnEntrar) navBtnEntrar.style.display = "none";
            if (navUsuario) navUsuario.style.display = "flex";
        } else {
            if (navBtnEntrar) navBtnEntrar.style.display = "";
            if (navUsuario) navUsuario.style.display = "none";
        }
    }

    inicializarNavUsuario();

    // ================= SERVIÇOS (HOME) =================

    document.querySelectorAll(".servico-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const destino = localStorage.getItem("petgo_id") ? "agendar.html" : "login.html";
            window.location.href = destino;
        });
    });

    // ================= MÁSCARAS E VALIDAÇÃO =================

    // --- Helpers visuais ---
    function setErro(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("is-danger");
        el.classList.remove("is-success");
        let help = el.closest(".field, .control")?.querySelector(".help.erro");
        if (!help) {
            help = document.createElement("p");
            help.className = "help is-danger erro";
            el.parentElement.appendChild(help);
        }
        help.textContent = msg;
    }

    function setOk(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove("is-danger");
        el.classList.add("is-success");
        const help = el.closest(".field, .control")?.querySelector(".help.erro");
        if (help) help.textContent = "";
    }

    function setErroSelect(wrapperId, selectId, msg) {
        const wrapper = document.getElementById(wrapperId);
        const select = document.getElementById(selectId);
        if (!wrapper || !select) return;
        wrapper.classList.add("is-danger");
        wrapper.classList.remove("is-success");
        let help = wrapper.closest(".field")?.querySelector(".help.erro");
        if (!help) {
            help = document.createElement("p");
            help.className = "help is-danger erro";
            wrapper.closest(".field").appendChild(help);
        }
        help.textContent = msg;
    }

    function setOkSelect(wrapperId) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        wrapper.classList.remove("is-danger");
        wrapper.classList.add("is-success");
        const help = wrapper.closest(".field")?.querySelector(".help.erro");
        if (help) help.textContent = "";
    }

    // --- Algoritmo CPF ---
    function cpfValido(cpf) {
        cpf = cpf.replace(/\D/g, "");
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        let soma = 0;
        for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
        let r = (soma * 10) % 11;
        if (r === 10 || r === 11) r = 0;
        if (r !== parseInt(cpf[9])) return false;
        soma = 0;
        for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
        r = (soma * 10) % 11;
        if (r === 10 || r === 11) r = 0;
        return r === parseInt(cpf[10]);
    }

    // --- Validações individuais ---
    function validarNome(id) {
        const v = document.getElementById(id)?.value.trim() || "";
        if (!v) { setErro(id, "Nome obrigatório."); return false; }
        if (v.length < 3) { setErro(id, "Nome muito curto."); return false; }
        setOk(id); return true;
    }

    function validarCpf(id) {
        const v = document.getElementById(id)?.value || "";
        if (!v) { setErro(id, "CPF obrigatório."); return false; }
        if (!cpfValido(v)) { setErro(id, "CPF inválido."); return false; }
        setOk(id); return true;
    }

    function validarData(id) {
        const v = document.getElementById(id)?.value || "";
        if (!v) { setErro(id, "Data obrigatória."); return false; }
        const [d, m, a] = v.split("/").map(Number);
        const data = new Date(a, m - 1, d);
        if (isNaN(data) || data.getDate() !== d || data.getMonth() !== m - 1 || a < 1900 || a > new Date().getFullYear()) {
            setErro(id, "Data inválida."); return false;
        }
        setOk(id); return true;
    }

    function validarCep(id) {
        const v = (document.getElementById(id)?.value || "").replace(/\D/g, "");
        if (!v) { setErro(id, "CEP obrigatório."); return false; }
        if (v.length !== 8) { setErro(id, "CEP inválido."); return false; }
        setOk(id); return true;
    }

    function validarObrigatorio(id, label) {
        const v = document.getElementById(id)?.value.trim() || "";
        if (!v) { setErro(id, `${label} obrigatório.`); return false; }
        setOk(id); return true;
    }

    function validarEmail(id) {
        const v = document.getElementById(id)?.value.trim() || "";
        if (!v) { setErro(id, "E-mail obrigatório."); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErro(id, "E-mail inválido."); return false; }
        setOk(id); return true;
    }

    function validarSenha(id) {
        const v = document.getElementById(id)?.value || "";
        if (!v) { setErro(id, "Senha obrigatória."); return false; }
        if (v.length < 6) { setErro(id, "Mínimo 6 caracteres."); return false; }
        if (!/[A-Z]/.test(v)) { setErro(id, "Deve conter letra maiúscula."); return false; }
        if (!/[0-9]/.test(v)) { setErro(id, "Deve conter um número."); return false; }
        if (!/[^A-Za-z0-9]/.test(v)) { setErro(id, "Deve conter um símbolo."); return false; }
        setOk(id); return true;
    }

    function validarConfirmacaoSenha(idSenha, idConf) {
        const s = document.getElementById(idSenha)?.value || "";
        const c = document.getElementById(idConf)?.value || "";
        if (!c) { setErro(idConf, "Confirmação obrigatória."); return false; }
        if (s !== c) { setErro(idConf, "As senhas não coincidem."); return false; }
        setOk(idConf); return true;
    }

    function validarSelect(wrapperId, selectId, label) {
        const v = document.getElementById(selectId)?.value || "";
        if (!v) { setErroSelect(wrapperId, selectId, `${label} obrigatório.`); return false; }
        setOkSelect(wrapperId); return true;
    }

    // --- Aplica máscaras IMask ---
    function mascara(id, opts) {
        const el = document.getElementById(id);
        if (el && window.IMask) IMask(el, opts);
    }

    mascara("cpf",              { mask: "000.000.000-00" });
    mascara("dataNascimento",   { mask: "00/00/0000" });
    mascara("cep",              { mask: "00000-000" });
    mascara("func-cpf",         { mask: "000.000.000-00" });
    mascara("func-dataNascimento", { mask: "00/00/0000" });
    mascara("pet-idade",        { mask: "00/00/0000" });

    // --- Blur em tempo real ---
    const blurRules = [
        ["nome",               () => validarNome("nome")],
        ["cpf",                () => validarCpf("cpf")],
        ["dataNascimento",     () => validarData("dataNascimento")],
        ["cep",                () => validarCep("cep")],
        ["endereco",           () => validarObrigatorio("endereco", "Endereço")],
        ["numero",             () => validarObrigatorio("numero", "Número")],
        ["email",              () => validarEmail("email")],
        ["senha",              () => validarSenha("senha")],
        ["senhaRepetida",      () => validarConfirmacaoSenha("senha", "senhaRepetida")],
        ["func-nome",          () => validarNome("func-nome")],
        ["func-cpf",           () => validarCpf("func-cpf")],
        ["func-dataNascimento",() => validarData("func-dataNascimento")],
        ["func-email",         () => validarEmail("func-email")],
        ["func-senha",         () => validarSenha("func-senha")],
        ["func-senhaRepetida", () => validarConfirmacaoSenha("func-senha", "func-senhaRepetida")],
        ["pet-nome",           () => validarNome("pet-nome")],
        ["pet-raca",           () => validarObrigatorio("pet-raca", "Raça")],
    ];

    blurRules.forEach(([id, fn]) => {
        document.getElementById(id)?.addEventListener("blur", fn);
    });

    document.getElementById("pet-porte")?.addEventListener("change",
        () => validarSelect("wrap-pet-porte", "pet-porte", "Porte"));
    document.getElementById("pet-sexo")?.addEventListener("change",
        () => validarSelect("wrap-pet-sexo", "pet-sexo", "Sexo"));
    document.getElementById("func-cargo")?.addEventListener("change",
        () => validarSelect("wrap-func-cargo", "func-cargo", "Cargo"));

    // ================= CADASTRO =================

    const btnCadastrar = document.getElementById("btnCadastrar");

    if (btnCadastrar) {
        btnCadastrar.addEventListener("click", async (event) => {
            event.preventDefault();

            const ok = [
                validarNome("nome"),
                validarCpf("cpf"),
                validarData("dataNascimento"),
                validarCep("cep"),
                validarObrigatorio("endereco", "Endereço"),
                validarObrigatorio("numero", "Número"),
                validarEmail("email"),
                validarSenha("senha"),
                validarConfirmacaoSenha("senha", "senhaRepetida"),
            ].every(Boolean);

            if (!ok) return;

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

            try {
                const response = await authFetch(`${BASE_URL}/api/usuarios/cadastrar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(usuario)
                });

                const data = await response.json();

                if (response.ok) {
                    toast("Cadastrado com sucesso!");
                    setTimeout(() => window.location.href = "login.html", 1500);
                } else {
                    toast(data.mensagem, "danger");
                }
            } catch (error) {
                console.error(error);
                toast("Não foi possível conectar ao servidor.", "danger");
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

            try {
                const response = await authFetch(`${BASE_URL}/api/usuarios/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("petgo_id", data.id);
                    localStorage.setItem("petgo_nome", data.nome);
                    localStorage.setItem("petgo_role", data.role);
                    localStorage.setItem("petgo_cargo", data.cargo || "");
                    localStorage.setItem("petgo_token", data.token);
                    toast("Login realizado com sucesso!");
                    const role = Number(data.role);
                    const destino = role === 1 ? "admin.html" : role === 3 ? "funcionario.html" : "index.html";
                    setTimeout(() => window.location.href = destino, 1500);
                } else {
                    toast(data.mensagem || "Erro no login", "danger");
                }
            } catch (error) {
                console.error(error);
                toast("Erro ao conectar com o servidor", "danger");
            }
        });
    }

    // ================= PERFIL =================

    if (document.getElementById("tab-perfil")) {
        const usuarioId = localStorage.getItem("petgo_id");

        if (!usuarioId) {
            window.location.href = "login.html";
        }

        const nomeLocal = localStorage.getItem("petgo_nome") || "";
        document.getElementById("perfil-nome").textContent = nomeLocal;
        document.getElementById("nav-nome").textContent = nomeLocal.split(" ")[0];
        const inicial = nomeLocal[0]?.toUpperCase() || "?";
        document.getElementById("perfil-avatar").src = `https://placehold.co/96x96?text=${inicial}`;
        document.getElementById("nav-avatar").src = `https://placehold.co/40x40?text=${inicial}`;

        // Endpoint esperado: GET /api/usuarios/{id}
        authFetch(`${BASE_URL}/api/usuarios/${usuarioId}`)
            .then(r => r.ok ? r.json() : null)
            .then(usuario => {
                if (!usuario) return;
                document.getElementById("perfil-nome").textContent = usuario.nome;
                document.getElementById("perfil-email").textContent = usuario.email;
                document.getElementById("campo-nome").textContent = usuario.nome || "—";
                document.getElementById("campo-cpf").textContent = usuario.cpf || "—";
                document.getElementById("campo-dataNascimento").textContent = usuario.dataNascimento || "—";
                document.getElementById("campo-cep").textContent = usuario.cep || "—";
                document.getElementById("campo-endereco").textContent = usuario.endereco || "—";
                document.getElementById("campo-numero").textContent = usuario.numero || "—";
                document.getElementById("campo-emailPerfil").textContent = usuario.email || "—";
                if (usuario.imagem) {
                    document.getElementById("perfil-avatar").src = usuario.imagem;
                    document.getElementById("nav-avatar").src = usuario.imagem;
                }
                localStorage.setItem("petgo_nome", usuario.nome);
            })
            .catch(() => {});

        // Endpoint esperado: GET /api/pets/usuario/{id}
        authFetch(`${BASE_URL}/api/pets/usuario/${usuarioId}`)
            .then(r => r.ok ? r.json() : [])
            .then(pets => {
                const lista = document.getElementById("lista-pets");
                const vazio = document.getElementById("pets-vazio");
                if (!pets || pets.length === 0) {
                    vazio.classList.remove("is-hidden");
                    return;
                }
                pets.forEach(pet => {
                    const col = document.createElement("div");
                    col.className = "column is-one-quarter";
                    col.innerHTML = `
                        <div class="box has-text-centered">
                          <figure class="image is-96x96 mx-auto mb-3">
                            <img class="is-rounded" src="${pet.imagem || `https://placehold.co/96x96?text=${pet.nome[0]}`}" alt="${pet.nome}" style="height:96px;object-fit:cover;border-radius:50%;" />
                          </figure>
                          <p class="has-text-weight-bold">${pet.nome}</p>
                          <p class="is-size-7 has-text-grey">${pet.raca || ""} · ${pet.porte || ""}</p>
                        </div>`;
                    lista.appendChild(col);
                });
            })
            .catch(() => {});

        // Endpoint esperado: GET /api/agendamentos/usuario/{id}
        authFetch(`${BASE_URL}/api/agendamentos/usuario/${usuarioId}`)
            .then(r => r.ok ? r.json() : [])
            .then(agendamentos => {
                const lista = document.getElementById("lista-agendamentos");
                const vazio = document.getElementById("agendamentos-vazio");
                if (!agendamentos || agendamentos.length === 0) {
                    vazio.classList.remove("is-hidden");
                    return;
                }
                agendamentos.forEach(ag => {
                    const item = document.createElement("div");
                    item.className = "box mb-3 is-flex is-align-items-center";
                    item.style.gap = "1rem";
                    item.innerHTML = `
                        <span class="icon is-large has-text-primary"><i class="fas fa-calendar-check fa-2x"></i></span>
                        <div>
                          <p class="has-text-weight-bold">${ag.servico || "Serviço"}</p>
                          <p class="is-size-7 has-text-grey">${ag.data || ""} ${ag.hora || ""} · Pet: ${ag.petNome || "-"}</p>
                        </div>
                        <span class="tag is-primary is-light ml-auto">${ag.status || "Agendado"}</span>`;
                    lista.appendChild(item);
                });
            })
            .catch(() => {});

        document.querySelectorAll(".tabs li[data-tab]").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".tabs li").forEach(t => t.classList.remove("is-active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.add("is-hidden"));
                tab.classList.add("is-active");
                document.getElementById(`tab-${tab.dataset.tab}`).classList.remove("is-hidden");
            });
        });

        // Abre aba pelo hash da URL (ex: perfil.html#agendamentos)
        const hash = window.location.hash.replace("#", "");
        if (hash) {
            const tabAlvo = document.querySelector(`.tabs li[data-tab="${hash}"]`);
            if (tabAlvo) tabAlvo.click();
        }

        document.getElementById("btn-sair")?.addEventListener("click", () => {
            localStorage.removeItem("petgo_id");
            localStorage.removeItem("petgo_nome");
            localStorage.removeItem("petgo_token");
            window.location.href = "index.html";
        });
    }

    // ================= EDITAR PERFIL =================

    if (document.getElementById("edit-nome")) {
        const usuarioId = localStorage.getItem("petgo_id");

        if (!usuarioId) {
            window.location.href = "login.html";
        }

        const preencherCampos = (usuario) => {
            document.getElementById("edit-nome").value = usuario.nome || "";
            document.getElementById("edit-cpf").value = usuario.cpf || "";
            document.getElementById("edit-dataNascimento").value = usuario.dataNascimento || "";
            document.getElementById("edit-cep").value = usuario.cep || "";
            document.getElementById("edit-endereco").value = usuario.endereco || "";
            document.getElementById("edit-numero").value = usuario.numero || "";
            document.getElementById("edit-email").value = usuario.email || "";
        };

        // Endpoint esperado: GET /api/usuarios/{id}
        authFetch(`${BASE_URL}/api/usuarios/${usuarioId}`)
            .then(r => r.ok ? r.json() : null)
            .then(usuario => { if (usuario) preencherCampos(usuario); })
            .catch(() => {
                preencherCampos({ nome: localStorage.getItem("petgo_nome") || "" });
            });

        document.getElementById("btn-salvar")?.addEventListener("click", async () => {
            const body = {
                nome: document.getElementById("edit-nome").value,
                cep: document.getElementById("edit-cep").value,
                endereco: document.getElementById("edit-endereco").value,
                numero: document.getElementById("edit-numero").value
            };

            try {
                // Endpoint esperado: PUT /api/usuarios/{id}
                const response = await authFetch(`${BASE_URL}/api/usuarios/${usuarioId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    localStorage.setItem("petgo_nome", body.nome);
                    window.location.href = "perfil.html";
                } else {
                    toast("Erro ao salvar. Tente novamente.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });
    }

    // ================= ADMIN =================

    if (document.getElementById("admin-dashboard")) {
        const role = localStorage.getItem("petgo_role");
        if (!localStorage.getItem("petgo_id") || Number(role) !== 1) {
            window.location.href = "index.html";
        }

        // Endpoint esperado: GET /api/admin/stats
        authFetch(`${BASE_URL}/api/admin/stats`)
            .then(r => r.ok ? r.json() : null)
            .then(stats => {
                if (!stats) return;
                document.getElementById("stat-usuarios").textContent = stats.totalUsuarios ?? "—";
                document.getElementById("stat-pets").textContent = stats.totalPets ?? "—";
                document.getElementById("stat-agendamentos").textContent = stats.totalAgendamentos ?? "—";
                document.getElementById("stat-hoje").textContent = stats.agendamentosHoje ?? "—";
            })
            .catch(() => {});

        // Endpoint esperado: GET /api/agendamentos
        authFetch(`${BASE_URL}/api/agendamentos`)
            .then(r => r.ok ? r.json() : [])
            .then(agendamentos => {
                const tbody = document.getElementById("tabela-agendamentos");
                const vazio = document.getElementById("agendamentos-vazio");
                if (!agendamentos || agendamentos.length === 0) {
                    vazio.classList.remove("is-hidden");
                    return;
                }
                agendamentos.forEach(ag => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${ag.id}</td>
                        <td>${ag.usuarioNome || "—"}</td>
                        <td>${ag.petNome || "—"}</td>
                        <td>${ag.servico || "—"}</td>
                        <td>${ag.data || "—"} ${ag.hora || ""}</td>
                        <td><span class="tag is-primary is-light">${ag.status || "Agendado"}</span></td>`;
                    tbody.appendChild(tr);
                });
            })
            .catch(() => {});

        // Endpoint esperado: GET /api/usuarios (apenas clientes, role=2)
        authFetch(`${BASE_URL}/api/usuarios`)
            .then(r => r.ok ? r.json() : [])
            .then(usuarios => {
                const tbody = document.getElementById("tabela-usuarios");
                const vazio = document.getElementById("usuarios-vazio");
                if (!usuarios || usuarios.length === 0) {
                    vazio.classList.remove("is-hidden");
                    return;
                }
                usuarios.forEach(u => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${u.id}</td>
                        <td>${u.nome || "—"}</td>
                        <td>${u.email || "—"}</td>
                        <td><span class="tag ${u.idRole === 1 ? "is-warning" : "is-info"} is-light">${u.idRole === 1 ? "Admin" : "Cliente"}</span></td>`;
                    tbody.appendChild(tr);
                });
            })
            .catch(() => {});

        // Endpoint esperado: GET /api/usuarios/funcionarios (role=3)
        authFetch(`${BASE_URL}/api/usuarios/funcionarios`)
            .then(r => r.ok ? r.json() : [])
            .then(funcionarios => {
                const tbody = document.getElementById("tabela-funcionarios");
                const vazio = document.getElementById("funcionarios-vazio");
                if (!funcionarios || funcionarios.length === 0) {
                    vazio.classList.remove("is-hidden");
                    return;
                }
                funcionarios.forEach(f => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${f.id}</td>
                        <td>${f.nome || "—"}</td>
                        <td>${f.cargo || "—"}</td>
                        <td>${f.email || "—"}</td>`;
                    tbody.appendChild(tr);
                });
            })
            .catch(() => {});

        document.querySelectorAll("[data-secao]").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const id = link.dataset.secao;
                document.getElementById(`section-${id}`).scrollIntoView({ behavior: "smooth" });
            });
        });

        document.getElementById("btn-sair-admin")?.addEventListener("click", () => {
            localStorage.removeItem("petgo_id");
            localStorage.removeItem("petgo_nome");
            localStorage.removeItem("petgo_role");
            localStorage.removeItem("petgo_token");
            window.location.href = "index.html";
        });
    }

    // ================= CADASTRO FUNCIONÁRIO =================

    if (document.getElementById("pagina-cadastro-funcionario")) {
        const role = localStorage.getItem("petgo_role");
        if (!localStorage.getItem("petgo_id") || Number(role) !== 1) {
            window.location.href = "index.html";
        }

        document.getElementById("btn-cadastrar-funcionario")?.addEventListener("click", async () => {
            const ok = [
                validarNome("func-nome"),
                validarCpf("func-cpf"),
                validarSelect("wrap-func-cargo", "func-cargo", "Cargo"),
                validarData("func-dataNascimento"),
                validarEmail("func-email"),
                validarSenha("func-senha"),
                validarConfirmacaoSenha("func-senha", "func-senhaRepetida"),
            ].every(Boolean);

            if (!ok) return;

            const body = {
                nome: document.getElementById("func-nome").value,
                cpf: document.getElementById("func-cpf").value,
                cargo: document.getElementById("func-cargo").value,
                dataNascimento: document.getElementById("func-dataNascimento").value,
                email: document.getElementById("func-email").value,
                senha: document.getElementById("func-senha").value
            };

            try {
                // Endpoint: POST /api/usuarios/funcionario/cadastrar
                const response = await authFetch(`${BASE_URL}/api/usuarios/funcionario/cadastrar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                const data = await response.json();

                if (response.ok) {
                    toast("Funcionário cadastrado com sucesso!");
                    setTimeout(() => window.location.href = "admin.html", 1500);
                } else {
                    toast(data.mensagem || "Erro ao cadastrar.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });

        document.getElementById("btn-sair-admin")?.addEventListener("click", () => {
            localStorage.removeItem("petgo_id");
            localStorage.removeItem("petgo_nome");
            localStorage.removeItem("petgo_role");
            localStorage.removeItem("petgo_token");
            window.location.href = "index.html";
        });
    }

    // ================= FUNCIONÁRIO DASHBOARD =================

    if (document.getElementById("funcionario-dashboard")) {
        const role = localStorage.getItem("petgo_role");
        const usuarioId = localStorage.getItem("petgo_id");

        if (!usuarioId || Number(role) !== 3) {
            window.location.href = "index.html";
        }

        const nomeLocal = localStorage.getItem("petgo_nome") || "";
        const cargoLocal = localStorage.getItem("petgo_cargo") || "";
        const inicial = nomeLocal[0]?.toUpperCase() || "?";

        document.getElementById("func-nome-nav").textContent = nomeLocal.split(" ")[0];
        document.getElementById("func-cargo-nav").textContent = cargoLocal;
        document.getElementById("func-avatar").src = `https://placehold.co/64x64?text=${inicial}`;

        // Navegação entre seções da sidebar
        document.querySelectorAll("[data-secao-func]").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const id = link.dataset.secaoFunc;
                document.querySelectorAll("[id^='section-func-']").forEach(s => s.classList.add("is-hidden"));
                document.querySelectorAll("[data-secao-func]").forEach(l => l.classList.remove("is-active", "has-text-weight-bold"));
                document.getElementById(`section-func-${id}`).classList.remove("is-hidden");
                link.classList.add("is-active", "has-text-weight-bold");
            });
        });

        // Carrega dados do funcionário via API
        // Endpoint esperado: GET /api/usuarios/{id}
        authFetch(`${BASE_URL}/api/usuarios/${usuarioId}`)
            .then(r => r.ok ? r.json() : null)
            .then(f => {
                if (!f) return;
                document.getElementById("func-nome-nav").textContent = f.nome?.split(" ")[0] || "";
                document.getElementById("func-cargo-nav").textContent = f.cargo || "";
                document.getElementById("fp-nome").textContent = f.nome || "—";
                document.getElementById("fp-cargo").textContent = f.cargo || "—";
                document.getElementById("fp-cpf").textContent = f.cpf || "—";
                document.getElementById("fp-dataNascimento").textContent = f.dataNascimento || "—";
                document.getElementById("fp-email").textContent = f.email || "—";
            })
            .catch(() => {});

        // Endpoint esperado: GET /api/agendamentos/funcionario/{id}
        authFetch(`${BASE_URL}/api/agendamentos/funcionario/${usuarioId}`)
            .then(r => r.ok ? r.json() : [])
            .then(agendamentos => {
                const lista = document.getElementById("lista-agenda-funcionario");
                const vazio = document.getElementById("agenda-vazio");
                if (!agendamentos || agendamentos.length === 0) {
                    vazio.classList.remove("is-hidden");
                    return;
                }
                agendamentos.forEach(ag => {
                    const item = document.createElement("div");
                    item.className = "box mb-3 is-flex is-align-items-center";
                    item.style.gap = "1rem";
                    item.innerHTML = `
                        <span class="icon is-large has-text-primary"><i class="fas fa-calendar-check fa-2x"></i></span>
                        <div>
                          <p class="has-text-weight-bold">${ag.servico || "Serviço"}</p>
                          <p class="is-size-7 has-text-grey">${ag.data || ""} ${ag.hora || ""} · Pet: ${ag.petNome || "-"} · Cliente: ${ag.usuarioNome || "-"}</p>
                        </div>
                        <span class="tag is-primary is-light ml-auto">${ag.status || "Agendado"}</span>`;
                    lista.appendChild(item);
                });
            })
            .catch(() => {});

        document.getElementById("btn-sair-funcionario")?.addEventListener("click", () => {
            localStorage.removeItem("petgo_id");
            localStorage.removeItem("petgo_nome");
            localStorage.removeItem("petgo_role");
            localStorage.removeItem("petgo_cargo");
            localStorage.removeItem("petgo_token");
            window.location.href = "index.html";
        });
    }

    // ================= CADASTRO PET =================

    if (document.getElementById("btn-cadastrar-pet")) {
        const usuarioId = localStorage.getItem("petgo_id");

        if (!usuarioId) {
            window.location.href = "login.html";
        }

        document.getElementById("btn-cadastrar-pet").addEventListener("click", async () => {
            const ok = [
                validarNome("pet-nome"),
                validarObrigatorio("pet-raca", "Raça"),
                validarSelect("wrap-pet-porte", "pet-porte", "Porte"),
                validarSelect("wrap-pet-sexo", "pet-sexo", "Sexo"),
            ].every(Boolean);

            if (!ok) return;

            const body = {
                nome: document.getElementById("pet-nome").value,
                raca: document.getElementById("pet-raca").value,
                porte: document.getElementById("pet-porte").value,
                sexo: document.getElementById("pet-sexo").value,
                idade: document.getElementById("pet-idade").value,
                observacao: document.getElementById("pet-observacao").value,
                usuarioId: Number(usuarioId)
            };

            try {
                const response = await authFetch(`${BASE_URL}/api/pets`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    toast("Pet cadastrado com sucesso!");
                    setTimeout(() => window.location.href = "perfil.html#pets", 1500);
                } else {
                    toast("Erro ao cadastrar pet. Tente novamente.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });
    }

    // ================= AGENDAR =================

    if (document.getElementById("agendar-pet")) {
        const usuarioId = localStorage.getItem("petgo_id");

        if (!usuarioId) {
            window.location.href = "login.html";
        }

        // Endpoint esperado: GET /api/pets/usuario/{id}
        authFetch(`${BASE_URL}/api/pets/usuario/${usuarioId}`)
            .then(r => r.ok ? r.json() : [])
            .then(pets => {
                const select = document.getElementById("agendar-pet");
                pets.forEach(pet => {
                    const opt = document.createElement("option");
                    opt.value = pet.id;
                    opt.textContent = pet.nome;
                    select.appendChild(opt);
                });
            })
            .catch(() => {});

        document.getElementById("agendar-data").min = new Date().toISOString().split("T")[0];

        document.getElementById("btn-agendar")?.addEventListener("click", async () => {
            const petId = document.getElementById("agendar-pet").value;
            const servico = document.getElementById("agendar-servico").value;
            const data = document.getElementById("agendar-data").value;
            const hora = document.getElementById("agendar-hora").value;
            const observacao = document.getElementById("agendar-observacao").value;

            if (!petId || !servico || !data || !hora) {
                toast("Preencha todos os campos obrigatórios.", "warning");
                return;
            }

            const body = { usuarioId, petId, servico, data, hora, observacao };

            try {
                // Endpoint esperado: POST /api/agendamentos
                const response = await authFetch(`${BASE_URL}/api/agendamentos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    window.location.href = "perfil.html#agendamentos";
                } else {
                    toast("Erro ao agendar. Tente novamente.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });
    }

});

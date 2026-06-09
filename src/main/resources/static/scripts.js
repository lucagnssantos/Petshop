(function () {
    const t = localStorage.getItem('petgo-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
})();

function previewImagem(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;
    const preview = document.getElementById(previewId || "preview-imagem");
    if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = "http://localhost:8080";

    function fmtData(data) {
        if (!data) return "—";
        const [a, m, d] = data.split("-");
        return `${d}/${m}/${a}`;
    }

    function tagStatus(status) {
        const cor = status === "Concluído" ? "is-success" : status === "Cancelado" ? "is-danger" : "is-primary";
        return `<span class="tag ${cor} is-light">${status || "Agendado"}</span>`;
    }

    function checados(name) {
        const els = [...document.querySelectorAll(`input[name="${name}"]:checked`)];
        return els.length ? els.map(e => e.value) : null;
    }

    function filtrarAgendamentos(lista, filtroId, statusName, dataId) {
        const q = (document.getElementById(filtroId)?.value || "").toLowerCase();
        const status = checados(statusName);
        const dataFiltro = document.getElementById(dataId)?.value;
        return lista.filter(ag => {
            if (q && ![ag.usuarioNome, ag.petNome, ag.servico, ag.status].some(v => (v || "").toLowerCase().includes(q))) return false;
            if (status && !status.includes(ag.status || "Agendado")) return false;
            if (dataFiltro && ag.data !== dataFiltro) return false;
            return true;
        }).sort((a, b) => (b.data + (b.hora || "")).localeCompare(a.data + (a.hora || "")));
    }

    const _paginaAtual = {};

    function paginar(items, renderRow, tbodyId, vazioId, navId, porPagina = 10) {
        const tbody = document.getElementById(tbodyId);
        const vazio = document.getElementById(vazioId);
        const nav   = document.getElementById(navId);
        tbody.innerHTML = "";
        vazio.classList.add("is-hidden");
        if (!items || items.length === 0) { vazio.classList.remove("is-hidden"); return; }

        const total = () => Math.ceil(items.length / porPagina);
        let pagina = Math.min(_paginaAtual[navId] || 1, total() || 1);

        function renderPagina() {
            _paginaAtual[navId] = pagina;
            tbody.innerHTML = "";
            const inicio = (pagina - 1) * porPagina;
            items.slice(inicio, inicio + porPagina).forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = renderRow(item);
                tbody.appendChild(tr);
            });
            renderNav();
        }

        function getJanela(p, t) {
            if (t <= 7) return Array.from({length: t}, (_, i) => i + 1);
            if (p <= 4)      return [1, 2, 3, 4, 5, "…", t];
            if (p >= t - 3)  return [1, "…", t-4, t-3, t-2, t-1, t];
            return [1, "…", p - 1, p, p + 1, "…", t];
        }

        function renderNav() {
            const t = total();
            if (t <= 1) { nav.classList.add("is-hidden"); return; }
            nav.classList.remove("is-hidden");
            nav.innerHTML = `
                <a class="pagination-previous" ${pagina === 1 ? "disabled" : ""}>Anterior</a>
                <a class="pagination-next" ${pagina === t ? "disabled" : ""}>Próximo</a>
                <ul class="pagination-list">
                  ${getJanela(pagina, t).map(p =>
                    p === "…"
                      ? `<li><span class="pagination-ellipsis">&hellip;</span></li>`
                      : `<li><a class="pagination-link ${p === pagina ? "is-current" : ""}" data-p="${p}">${p}</a></li>`
                  ).join("")}
                </ul>`;
            nav.querySelector(".pagination-previous").addEventListener("click", () => {
                if (pagina > 1) { pagina--; renderPagina(); }
            });
            nav.querySelector(".pagination-next").addEventListener("click", () => {
                if (pagina < t) { pagina++; renderPagina(); }
            });
            nav.querySelectorAll(".pagination-link[data-p]").forEach(a => {
                a.addEventListener("click", () => { pagina = +a.dataset.p; renderPagina(); });
            });
        }

        renderPagina();
    }

    function renderCheckboxes(containerId, servicos, selecionados, disabled) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";

        let lista = servicos;
        if (selecionados.length > 0) {
            const selObj = selecionados.map(n => servicos.find(s => s.nome === n)).filter(Boolean);
            if (selObj.length > 0) {
                const isVetSel = selObj.some(s => s.isVet);
                lista = servicos.filter(s => Boolean(s.isVet) === isVetSel);
            }
        }

        const normais = lista.filter(s => !s.isVet);
        const vets    = lista.filter(s =>  s.isVet);

        const renderGrupo = (titulo, grupo) => {
            if (grupo.length === 0) return;
            if (titulo) {
                const header = document.createElement("div");
                header.className = "column is-full pb-0 pt-2";
                header.innerHTML = `<p class="has-text-weight-semibold is-size-7 has-text-grey-dark">${titulo}</p>`;
                container.appendChild(header);
            }
            grupo.forEach(s => {
                const div = document.createElement("div");
                div.className = "column is-half py-1";
                const label = document.createElement("label");
                label.className = "checkbox";
                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.value = s.nome;
                cb.dataset.isVet = s.isVet ? "true" : "false";
                cb.checked = selecionados.includes(s.nome);
                cb.disabled = !!disabled;
                label.appendChild(cb);
                label.appendChild(document.createTextNode(" " + s.nome));
                div.appendChild(label);
                container.appendChild(div);
            });
        };

        renderGrupo("Serviços Gerais:", normais);
        renderGrupo("Serviços Veterinários:", vets);
    }

    // ================= AUTH FETCH =================

    function authFetch(url, options = {}) {
        const token = localStorage.getItem("petgo_token");
        const headers = { ...(options.headers || {}) };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return fetch(url, { ...options, headers });
    }

    // ================= LOGOUT =================

    function logout() {
        ["petgo_id", "petgo_nome", "petgo_role", "petgo_cargo", "petgo_token"]
            .forEach(k => localStorage.removeItem(k));
        window.location.href = "index.html";
    }

    // ================= SERVIÇOS (CACHE GLOBAL) =================

    let _servicosCache = null;
    async function getServicos() {
        if (_servicosCache) return _servicosCache;
        const r = await authFetch(`${BASE_URL}/api/servicos`);
        _servicosCache = r.ok ? await r.json() : [];
        return _servicosCache;
    }

    // ================= UTILITÁRIOS DE AGENDAMENTO =================

    async function verificarDisponibilidade({ dataId, horaId, servicosSelector, fetchServicos }) {
        const data = document.getElementById(dataId)?.value;
        const horaSelect = document.getElementById(horaId);
        if (!horaSelect) return;
        [...horaSelect.options].forEach(opt => { opt.disabled = false; if (opt.value) opt.text = opt.value; });
        const selecionados = [...document.querySelectorAll(`${servicosSelector} input[type=checkbox]:checked`)]
            .map(cb => cb.value);
        if (!data || selecionados.length === 0) return;
        const todosServicos = await fetchServicos();
        const isVet = selecionados.some(n => todosServicos.find(sv => sv.nome === n)?.isVet);
        const tipo = isVet ? "vet" : "normal";
        const totalDuracao = selecionados.reduce((sum, nome) => {
            const s = todosServicos.find(sv => sv.nome === nome);
            return sum + (s?.duracao || 60);
        }, 0);
        const slotsNeeded = Math.ceil(totalDuracao / 60);
        try {
            const resp = await authFetch(`${BASE_URL}/api/agendamentos/disponibilidade?data=${data}&tipo=${tipo}`);
            if (!resp.ok) return;
            const { slots } = await resp.json();
            [...horaSelect.options].forEach(opt => {
                if (!opt.value) return;
                const startH = parseInt(opt.value.split(":")[0]);
                let blocked = false;
                for (let i = 0; i < slotsNeeded; i++) {
                    const key = String(startH + i).padStart(2, "0") + ":00";
                    if ((slots[key] || 0) <= 0) { blocked = true; break; }
                }
                opt.disabled = blocked;
                opt.text = blocked ? opt.value + " (ocupado)" : opt.value;
            });
        } catch {}
    }

    function setupBloqueioVetGeral(containerId) {
        document.getElementById(containerId)?.addEventListener("change", e => {
            if (!e.target.matches("input[type=checkbox]")) return;
            const cbs = [...document.querySelectorAll(`#${containerId} input[type=checkbox]`)];
            const checked = cbs.filter(cb => cb.checked);
            if (checked.length === 0) { cbs.forEach(cb => cb.disabled = false); return; }
            const isVetSel = checked.some(cb => cb.dataset.isVet === "true");
            let algumBloqueado = false;
            cbs.forEach(cb => {
                if (!cb.checked) {
                    const deveBloqueado = (cb.dataset.isVet === "true") !== isVetSel;
                    if (deveBloqueado && !cb.disabled) algumBloqueado = true;
                    cb.disabled = deveBloqueado;
                }
            });
            if (algumBloqueado)
                toast("Serviços veterinários e gerais não podem ser combinados no mesmo agendamento.", "warning");
        });
    }

    function setupClientePetSelect(clienteSelectId, petSelectId) {
        document.getElementById(clienteSelectId)?.addEventListener("change", function() {
            const selectPet = document.getElementById(petSelectId);
            selectPet.innerHTML = "<option value=''>Carregando...</option>";
            selectPet.disabled = true;
            if (!this.value) { selectPet.innerHTML = "<option value=''>Selecione o cliente primeiro</option>"; return; }
            authFetch(`${BASE_URL}/api/pets/usuario/${this.value}`)
                .then(r => r.ok ? r.json() : [])
                .then(pets => {
                    selectPet.innerHTML = "<option value=''>Selecione o pet...</option>";
                    pets.forEach(p => {
                        const opt = document.createElement("option");
                        opt.value = p.id;
                        opt.textContent = p.nome;
                        selectPet.appendChild(opt);
                    });
                    selectPet.disabled = pets.length === 0;
                    if (pets.length === 0) selectPet.innerHTML = "<option value=''>Este cliente não tem pets</option>";
                });
        });
    }

    // ================= TOAST =================

    function toast(mensagem, tipo = "primary") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.cssText = "position:fixed;top:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;max-width:320px;";
            document.body.appendChild(container);
        }
        container.innerHTML = "";
        const notif = document.createElement("div");
        notif.className = `notification is-${tipo}`;
        notif.style.cssText = "position:relative;padding:1rem 3rem 1rem 1.25rem;min-height:3.5rem;display:flex;align-items:center;";
        notif.innerHTML = `<button class="delete" style="position:absolute;top:0.75rem;right:0.75rem;"></button>${mensagem}`;
        container.appendChild(notif);
        notif.querySelector(".delete").addEventListener("click", () => fecharToast(notif));
        setTimeout(() => fecharToast(notif), 4000);
    }

    function fecharToast(notif) {
        if (!notif.isConnected) return;
        notif.classList.add("toast-saindo");
        const fallback = setTimeout(() => notif.remove(), 400);
        notif.addEventListener("animationend", () => { clearTimeout(fallback); notif.remove(); }, { once: true });
    }

    // ================= NAVBAR USUÁRIO =================

    function inicializarNavUsuario() {
        const nome = localStorage.getItem("petgo_nome");
        const navNome = document.getElementById("nav-nome");
        const navAvatar = document.getElementById("nav-avatar");
        const navBtnEntrar = document.getElementById("nav-btn-entrar");
        const navUsuario = document.getElementById("nav-usuario");

        if (nome) {
            const id = localStorage.getItem("petgo_id");
            const role = Number(localStorage.getItem("petgo_role"));
            if (navNome) navNome.textContent = nome.split(" ")[0];
            if (navAvatar && id) {
                navAvatar.src = `${BASE_URL}/api/usuarios/${id}/imagem`;
                navAvatar.onerror = function() { this.onerror = null; this.src = `https://placehold.co/40x40?text=${nome[0].toUpperCase()}`; };
            } else if (navAvatar) {
                navAvatar.src = `https://placehold.co/40x40?text=${nome[0].toUpperCase()}`;
            }
            const btnPainel = document.getElementById("nav-btn-painel");
            if (btnPainel) {
                if (role === 1) {
                    btnPainel.textContent = "Painel Administrador";
                    btnPainel.href = "admin.html";
                    btnPainel.style.display = "";
                } else if (role === 3) {
                    btnPainel.textContent = "Painel Funcionário";
                    btnPainel.href = "funcionario.html";
                    btnPainel.style.display = "";
                }
            }
            if (navBtnEntrar) navBtnEntrar.style.display = "none";
            if (navUsuario) { navUsuario.classList.remove("is-hidden"); navUsuario.style.display = "flex"; }
        } else {
            if (navBtnEntrar) navBtnEntrar.style.display = "";
            if (navUsuario) { navUsuario.classList.add("is-hidden"); navUsuario.style.display = "none"; }
        }
    }

    inicializarNavUsuario();

    // ================= NAVBAR BURGER (MOBILE) =================

    function inicializarNavbarBurger() {
        document.querySelectorAll(".navbar-burger").forEach(burger => {
            const alvo = document.getElementById(burger.dataset.target);
            if (!alvo) return;
            burger.addEventListener("click", () => {
                const ativo = burger.classList.toggle("is-active");
                alvo.classList.toggle("is-active", ativo);
                burger.setAttribute("aria-expanded", String(ativo));
            });
            alvo.querySelectorAll("a.navbar-item").forEach(item => {
                item.addEventListener("click", () => {
                    burger.classList.remove("is-active");
                    alvo.classList.remove("is-active");
                    burger.setAttribute("aria-expanded", "false");
                });
            });
        });
    }

    inicializarNavbarBurger();

    // ================= SIDEBAR ADMIN/FUNCIONÁRIO (MOBILE) =================

    function inicializarSidebarMobile() {
        const sidebar = document.querySelector(".dashboard-sidebar");
        const toggle = document.getElementById("btn-toggle-sidebar");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (!sidebar || !toggle || !backdrop) return;

        function fechar() {
            sidebar.classList.remove("is-active");
            backdrop.classList.remove("is-active");
        }

        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("is-active");
            backdrop.classList.toggle("is-active");
        });
        backdrop.addEventListener("click", fechar);
        sidebar.querySelectorAll("a.navbar-item, button").forEach(item => {
            item.addEventListener("click", fechar);
        });
    }

    inicializarSidebarMobile();

    // ================= SERVIÇOS (HOME) =================

    document.querySelectorAll(".servico-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const destino = localStorage.getItem("petgo_id") ? "agendar.html" : "login.html";
            window.location.href = destino;
        });
    });

    // ================= MÁSCARAS E VALIDAÇÃO =================

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

    function validarNome(id) {
        const r = validarNomeValor(document.getElementById(id)?.value);
        if (!r.valido) { setErro(id, r.mensagem); return false; }
        setOk(id); return true;
    }

    function validarCpf(id) {
        const r = validarCpfValor(document.getElementById(id)?.value);
        if (!r.valido) { setErro(id, r.mensagem); return false; }
        setOk(id); return true;
    }

    function validarData(id) {
        const r = validarDataValor(document.getElementById(id)?.value);
        if (!r.valido) { setErro(id, r.mensagem); return false; }
        setOk(id); return true;
    }

    function validarCep(id) {
        const r = validarCepValor(document.getElementById(id)?.value);
        if (!r.valido) { setErro(id, r.mensagem); return false; }
        setOk(id); return true;
    }

    function validarObrigatorio(id, label) {
        const v = document.getElementById(id)?.value.trim() || "";
        if (!v) { setErro(id, `${label} obrigatório.`); return false; }
        setOk(id); return true;
    }

    function validarEmail(id) {
        const r = validarEmailValor(document.getElementById(id)?.value);
        if (!r.valido) { setErro(id, r.mensagem); return false; }
        setOk(id); return true;
    }

    function validarSenha(id) {
        const r = validarSenhaValor(document.getElementById(id)?.value);
        if (!r.valido) { setErro(id, r.mensagem); return false; }
        setOk(id); return true;
    }

    function validarTelefone(ap) {
        const r = validarTelefoneValor(document.getElementById(ap)?.value);
        if (!r.valido) { setErro(ap, r.mensagem); return false; }
        setOk(ap); return true;
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

    [
        ["cpf",                  "000.000.000-00"],
        ["dataNascimento",       "00/00/0000"],
        ["cep",                  "00000-000"],
        ["telefone",             "(00) 00000-0000"],
        ["func-cpf",             "000.000.000-00"],
        ["func-dataNascimento",  "00/00/0000"],
        ["func-telefone",        "(00) 00000-0000"],
        ["pet-idade",            "00/00/0000"],
        ["modal-u-cep",          "00000-000"],
        ["modal-u-func-cpf",         "000.000.000-00"],
        ["modal-u-func-telefone",    "(00) 00000-0000"],
        ["edit-cpf",             "000.000.000-00"],
        ["edit-dataNascimento",  "00/00/0000"],
        ["edit-cep",             "00000-000"],
        ["edit-telefone",        "(00) 00000-0000"],
        ["modal-func-cpf",             "000.000.000-00"],
        ["modal-func-dataNascimento",  "00/00/0000"],
        ["modal-func-telefone",        "(00) 00000-0000"],
    ].forEach(([id, mask]) => {
        const el = document.getElementById(id);
        if (el && window.IMask) IMask(el, { mask });
    });

    const blurRules = [
        ["nome",               () => validarNome("nome")],
        ["cpf",                () => validarCpf("cpf")],
        ["dataNascimento",     () => validarData("dataNascimento")],
        ["cep",                () => validarCep("cep")],
        ["endereco",           () => validarObrigatorio("endereco", "Endereço")],
        ["numero",             () => validarObrigatorio("numero", "Número")],
        ["email",              () => validarEmail("email")],
        ["telefone",           () => validarTelefone("telefone")],
        ["senha",              () => !document.getElementById("btnLogin") && validarSenha("senha")],
        ["senhaRepetida",      () => validarConfirmacaoSenha("senha", "senhaRepetida")],
        ["func-nome",          () => validarNome("func-nome")],
        ["func-cpf",           () => validarCpf("func-cpf")],
        ["func-dataNascimento",() => validarData("func-dataNascimento")],
        ["func-email",         () => validarEmail("func-email")],
        ["func-senha",         () => validarSenha("func-senha")],
        ["func-senhaRepetida", () => validarConfirmacaoSenha("func-senha", "func-senhaRepetida")],
        ["pet-nome",           () => validarNome("pet-nome")],
        ["pet-raca",           () => validarObrigatorio("pet-raca", "Raça")],
        ["edit-nome",                 () => validarNome("edit-nome")],
        ["edit-cpf",                  () => validarCpf("edit-cpf")],
        ["edit-dataNascimento",       () => validarData("edit-dataNascimento")],
        ["edit-cep",                  () => validarCep("edit-cep")],
        ["edit-email",                () => validarEmail("edit-email")],
        ["edit-telefone",             () => validarTelefone("edit-telefone")],
        ["modal-func-nome",           () => validarNome("modal-func-nome")],
        ["modal-func-cpf",            () => validarCpf("modal-func-cpf")],
        ["modal-func-dataNascimento", () => validarData("modal-func-dataNascimento")],
        ["modal-func-email",          () => validarEmail("modal-func-email")],
        ["modal-func-telefone",       () => validarTelefone("modal-func-telefone")],
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

            if (!document.getElementById("termos")?.checked) {
                toast("Você deve aceitar os termos de uso.", "warning");
                return;
            }

            const ok = [
                validarNome("nome"),
                validarCpf("cpf"),
                validarData("dataNascimento"),
                validarCep("cep"),
                validarObrigatorio("endereco", "Endereço"),
                validarObrigatorio("numero", "Número"),
                validarEmail("email"),
                validarTelefone("telefone"),
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
                telefone: document.getElementById("telefone").value,
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
                    const novoId = data.id;
                    const arquivo = document.getElementById("inputImagem")?.files[0];
                    if (arquivo && novoId) {
                        const fd = new FormData();
                        fd.append("imagem", arquivo);
                        const imgResp = await authFetch(`${BASE_URL}/api/usuarios/${novoId}/imagem`, { method: "POST", body: fd });
                        if (!imgResp.ok) {
                            const err = await imgResp.json().catch(() => ({}));
                            toast(err.mensagem || "Foto não foi salva. Tente novamente após o login.", "warning");
                        }
                    }
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

    function setupPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        if (!input || !button) return;
        button.addEventListener("click", () => {
            if (input.type === "password") {
                input.type = "text";
                button.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = "password";
                button.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }

    setupPasswordToggle("senha", "toggleSenha");
    setupPasswordToggle("senhaRepetida", "toggleSenhaRepetida");
    setupPasswordToggle("func-senha", "toggleFuncSenha");
    setupPasswordToggle("func-senhaRepetida", "toggleFuncSenhaRepetida");

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
        const perfilAvatar = document.getElementById("perfil-avatar");

        authFetch(`${BASE_URL}/api/usuarios/${usuarioId}`)
            .then(r => {
                if (r.status === 401) { window.location.href = "login.html"; return null; }
                return r.ok ? r.json() : null;
            })
            .then(usuario => {
                if (!usuario) return;
                if (perfilAvatar) perfilAvatar.src = usuario.imagemUrl || `https://placehold.co/96x96?text=${inicial}`;
                const navAvatarPerfil = document.getElementById("nav-avatar");
                if (navAvatarPerfil) navAvatarPerfil.src = usuario.imagemUrl || `https://placehold.co/40x40?text=${inicial}`;
                document.getElementById("perfil-nome").textContent = usuario.nome;
                document.getElementById("perfil-email").textContent = usuario.email;
                document.getElementById("campo-nome").textContent = usuario.nome || "—";
                document.getElementById("campo-cpf").textContent = usuario.cpf || "—";
                document.getElementById("campo-dataNascimento").textContent = usuario.dataNascimento || "—";
                document.getElementById("campo-cep").textContent = usuario.cep || "—";
                document.getElementById("campo-endereco").textContent = usuario.endereco || "—";
                document.getElementById("campo-numero").textContent = usuario.numero || "—";
                document.getElementById("campo-emailPerfil").textContent = usuario.email || "—";
                document.getElementById("campo-telefone").textContent = usuario.telefone || "—";
                localStorage.setItem("petgo_nome", usuario.nome);
            })
            .catch(() => { toast("Erro ao conectar com o servidor.", "danger"); });

        // Endpoint esperado: GET /api/pets/usuario/{id}
        let todosPets = [];

        function renderizarPets(pets) {
            const lista = document.getElementById("lista-pets");
            const vazio = document.getElementById("pets-vazio");
            lista.innerHTML = "";
            if (!pets || pets.length === 0) {
                vazio.classList.remove("is-hidden");
                return;
            }
            vazio.classList.add("is-hidden");
            pets.forEach(pet => {
                const col = document.createElement("div");
                col.className = "column is-one-quarter";
                col.innerHTML = `
                    <div class="box has-text-centered">
                      <figure class="image is-96x96 mx-auto mb-3">
                        <img class="is-rounded"
                          src="${pet.imagemUrl || `https://placehold.co/96x96?text=${pet.nome[0]}`}"
                          alt="${pet.nome}"
                          style="width:96px;height:96px;object-fit:cover;border-radius:50%;" />
                      </figure>
                      <p class="has-text-weight-bold">${pet.nome}</p>
                      <p class="is-size-7 has-text-grey">${pet.raca || ""} · ${pet.porte || ""}</p>
                      <a href="cadastro-pet.html?id=${pet.id}" class="button is-small is-light is-fullwidth mt-3">
                        <span class="icon"><i class="fas fa-pen"></i></span><span>Editar</span>
                      </a>
                    </div>`;
                lista.appendChild(col);
            });
        }

        authFetch(`${BASE_URL}/api/pets/usuario/${usuarioId}`)
            .then(r => r.ok ? r.json() : [])
            .then(pets => {
                todosPets = pets;
                renderizarPets(pets);
                document.getElementById("filtro-pets")?.addEventListener("input", function() {
                    const texto = this.value.toLowerCase();
                    renderizarPets(todosPets.filter(pet =>
                        [pet.nome, pet.raca, pet.porte, pet.sexo, pet.idade]
                            .some(v => (v || "").toLowerCase().includes(texto))
                    ));
                });
            })
            .catch(() => { toast("Erro ao conectar com o servidor.", "danger"); });

        // Endpoint esperado: GET /api/agendamentos/usuario/{id}
        function renderizarAgendamentos(agendamentos) {

            const lista = document.getElementById("lista-agendamentos");

            const vazio = document.getElementById("agendamentos-vazio");

            lista.innerHTML = "";

            vazio.classList.add("is-hidden");

            if (!agendamentos || agendamentos.length === 0) {

                vazio.classList.remove("is-hidden");

                return;
            }

            agendamentos.forEach(ag => {

                const item = document.createElement("div");

                item.className =
                    "box mb-3 is-flex is-align-items-center";

                item.style.gap = "1rem";

                item.innerHTML = `
                    <span class="icon is-large has-text-primary">
                      <i class="fas fa-calendar-check fa-2x"></i>
                    </span>

                    <div class="is-flex-grow-1">

                      <p class="has-text-weight-bold">
                        ${ag.servico || "Serviço"}
                      </p>

                      <p class="is-size-7 has-text-grey">
                        ${fmtData(ag.data)}
                        ${ag.hora || ""}
                        · Pet: ${ag.petNome || "-"}
                      </p>

                    </div>

                    ${tagStatus(ag.status)}

                    ${ag.status === "Agendado"
                        ? `
                        <a
                          href="agendar.html?id=${ag.id}"
                          class="button is-small is-light ml-2"
                        >
                          <span class="icon">
                            <i class="fas fa-pen"></i>
                          </span>
                        </a>
                        `
                        : ""
                    }
                `;

                lista.appendChild(item);
            });
        }
        let todosAgendamentos = [];
        function carregarMeusAgs() {
            authFetch(`${BASE_URL}/api/agendamentos/usuario/${usuarioId}`)
                .then(r => r.ok ? r.json() : [])
                .then(agendamentos => {
                    todosAgendamentos = agendamentos;
                    renderizarAgendamentos(agendamentos);
                })
                .catch(() => { toast("Erro ao conectar com o servidor.", "danger"); });
        }

        document.getElementById("filtro-agendamentos")
            .addEventListener("input", function () {

                const texto =
                    this.value.toLowerCase();

                const filtrados =
                    todosAgendamentos.filter(ag => {

                        return [

                            ag.servico,
                            ag.petNome,
                            ag.status,
                            ag.data,
                            ag.hora

                        ].some(valor =>

                            (valor || "")
                                .toLowerCase()
                                .includes(texto)
                        );
                    });

                renderizarAgendamentos(filtrados);
            });

        carregarMeusAgs();
        setInterval(carregarMeusAgs, 60000);

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

        document.getElementById("btn-sair")?.addEventListener("click", logout);
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
            document.getElementById("edit-telefone").value = usuario.telefone || "";
        };

        // Endpoint esperado: GET /api/usuarios/{id}
        authFetch(`${BASE_URL}/api/usuarios/${usuarioId}`)
            .then(r => r.ok ? r.json() : null)
            .then(usuario => { if (usuario) preencherCampos(usuario); })
            .catch(() => {
                preencherCampos({ nome: localStorage.getItem("petgo_nome") || "" });
            });

        document.getElementById("btn-salvar")?.addEventListener("click", async () => {
            const ok = [
                validarNome("edit-nome"),
                validarCpf("edit-cpf"),
                validarData("edit-dataNascimento"),
                validarCep("edit-cep"),
                validarObrigatorio("edit-endereco", "Endereço"),
                validarObrigatorio("edit-numero", "Número"),
                validarEmail("edit-email"),
                validarTelefone("edit-telefone"),
            ].every(Boolean);
            if (!ok) return;

            const arquivo = document.getElementById("edit-inputImagem")?.files[0];
            if (arquivo) {
                const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                if (!allowedTypes.includes(arquivo.type)) {
                    toast("Formato inválido. Envie JPEG, PNG, GIF ou WebP.", "warning");
                    return;
                }
                if (arquivo.size > 5 * 1024 * 1024) {
                    toast("Imagem muito grande. Máximo: 5MB.", "warning");
                    return;
                }
            }

            const body = {
                nome: document.getElementById("edit-nome").value,
                cpf: document.getElementById("edit-cpf").value,
                dataNascimento: document.getElementById("edit-dataNascimento").value,
                email: document.getElementById("edit-email").value,
                telefone: document.getElementById("edit-telefone").value,
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
                    if (arquivo) {
                        const fd = new FormData();
                        fd.append("imagem", arquivo);
                        const imgResp = await authFetch(`${BASE_URL}/api/usuarios/${usuarioId}/imagem`, { method: "POST", body: fd });
                        if (!imgResp.ok) {
                            const err = await imgResp.json().catch(() => ({}));
                            toast(err.mensagem || "Foto não foi salva. Verifique o formato e tente novamente.", "warning");
                            return;
                        }
                    }
                    localStorage.setItem("petgo_nome", body.nome);
                    window.location.href = "perfil.html";
                } else {
                    const err = await response.json().catch(() => ({}));
                    toast(err.mensagem || "Erro ao salvar. Tente novamente.", "danger");
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

        const loaded = new Set();
        let _agsDash = [], _ags = [], _clientes = [], _funcionarios = [], _pets = [], _servicos = [];
        let _chartStatus = null, _chartServicos = null, _chartDias = null, _chartPorte = null;

        let abaAtiva = "dashboard";

        function mostrarAba(id) {
            abaAtiva = id;
            document.querySelectorAll("[id^='section-']").forEach(s => s.classList.add("is-hidden"));
            document.getElementById(`section-${id}`)?.classList.remove("is-hidden");
            document.querySelectorAll("[data-aba]").forEach(l => l.classList.remove("is-active"));
            document.querySelector(`[data-aba="${id}"]`)?.classList.add("is-active");
            if (loaders[id] && !loaded.has(id)) {
                loaders[id]();
                loaded.add(id);
            }
        }

        function carregarDashboard() {
            authFetch(`${BASE_URL}/api/agendamentos`)
                .then(r => r.ok ? r.json() : [])
                .then(todos => { _agsDash = todos; renderDashboard(); })
                .catch(() => {});
        }

        function renderDashboard() {
            const q = (document.getElementById("filtro-dashboard")?.value || "").toLowerCase();
            const hoje = new Date().toLocaleDateString("en-CA");

            const tbodyHoje = document.getElementById("tabela-hoje");
            const vazioHoje = document.getElementById("hoje-vazio");
            tbodyHoje.innerHTML = "";
            vazioHoje.classList.add("is-hidden");
            const deHoje = _agsDash
                .filter(ag => ag.data === hoje)
                .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))
                .filter(ag => !q || [ag.hora, ag.usuarioNome, ag.petNome, ag.servico, ag.status].some(v => (v || "").toLowerCase().includes(q)));
            if (deHoje.length === 0) {
                vazioHoje.classList.remove("is-hidden");
            } else {
                deHoje.forEach(ag => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${ag.hora || "—"}</td>
                        <td>${ag.usuarioNome || "—"}</td>
                        <td>${ag.petNome || "—"}</td>
                        <td>${ag.servico || "—"}</td>
                        <td>${tagStatus(ag.status)}</td>
                        <td>${ag.status === "Agendado" ? `<button class="button is-success is-light is-small" data-concluir-dash="${ag.id}" title="Marcar como Concluído"><span class="icon"><i class="fas fa-check"></i></span></button>` : ""}</td>`;
                    tbodyHoje.appendChild(tr);
                });
            }

            const tbodyProx = document.getElementById("tabela-proximos");
            const vazioProx = document.getElementById("proximos-vazio");
            tbodyProx.innerHTML = "";
            vazioProx.classList.add("is-hidden");
            const proximos = _agsDash
                .filter(ag => ag.data > hoje && ag.status === "Agendado")
                .sort((a, b) => {
                    const cmp = (a.data || "").localeCompare(b.data || "");
                    return cmp !== 0 ? cmp : (a.hora || "").localeCompare(b.hora || "");
                })
                .filter(ag => !q || [ag.data, ag.hora, ag.usuarioNome, ag.petNome, ag.servico, ag.status].some(v => (v || "").toLowerCase().includes(q)));
            if (proximos.length === 0) {
                vazioProx.classList.remove("is-hidden");
            } else {
                proximos.forEach(ag => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${fmtData(ag.data)}</td>
                        <td>${ag.hora || "—"}</td>
                        <td>${ag.usuarioNome || "—"}</td>
                        <td>${ag.petNome || "—"}</td>
                        <td>${ag.servico || "—"}</td>
                        <td>${tagStatus(ag.status)}</td>`;
                    tbodyProx.appendChild(tr);
                });
            }
        }

        document.getElementById("tabela-hoje")?.addEventListener("click", async e => {
            const btn = e.target.closest("[data-concluir-dash]");
            if (!btn) return;
            if (!confirm("Tem certeza que deseja marcar como Concluído?\nEsta ação não pode ser revertida.")) return;
            const r = await authFetch(`${BASE_URL}/api/agendamentos/${btn.dataset.concluirDash}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Concluído" })
            });
            if (r.ok) { toast("Agendamento concluído."); loaded.delete("agendamentos"); carregarDashboard(); }
            else { const d = await r.json().catch(() => ({})); toast(d.mensagem || "Erro ao concluir.", "danger"); }
        });

        function carregarAgendamentos() {
            authFetch(`${BASE_URL}/api/agendamentos`)
                .then(r => r.ok ? r.json() : [])
                .then(ags => { _ags = ags; renderAgendamentos(); })
                .catch(() => {});
        }

        function renderAgendamentos() {
            const dados = filtrarAgendamentos(_ags, "filtro-ag", "chk-ag-status", "filtro-ag-data");
            paginar(dados, ag => `
                <td>${ag.id}</td>
                <td>${ag.usuarioNome || "—"}</td>
                <td>${ag.petNome || "—"}</td>
                <td>${ag.servico || "—"}</td>
                <td>${fmtData(ag.data)} ${ag.hora || ""}</td>
                <td>${tagStatus(ag.status)}</td>
                <td>
                  <div class="buttons are-small mb-0">
                    <button class="button is-light" title="${ag.status === "Agendado" ? "Ver / Editar" : "Detalhes"}" data-ag='${JSON.stringify(ag)}'><span class="icon"><i class="fas ${ag.status === "Agendado" ? "fa-pen" : "fa-eye"}"></i></span></button>
                    <a class="button is-light" href="pet.html?id=${ag.petId}" title="Ver pet" target="_blank"><span class="icon"><i class="fas fa-paw"></i></span></a>
                    ${ag.status === "Agendado" ? `<button class="button is-success is-light" title="Marcar como Concluído" data-concluir="${ag.id}"><span class="icon"><i class="fas fa-check"></i></span></button>` : ""}
                  </div>
                </td>`,
            "tabela-agendamentos", "agendamentos-vazio", "pag-agendamentos");
        }

        document.getElementById("tabela-agendamentos")?.addEventListener("click", async e => {
            const btnDet = e.target.closest("[data-ag]");
            if (btnDet) { abrirModalDetalheAg(JSON.parse(btnDet.dataset.ag)); return; }
            const btnCon = e.target.closest("[data-concluir]");
            if (btnCon) {
                if (!confirm("Tem certeza que deseja marcar como Concluído?\nEsta ação não pode ser revertida.")) return;
                const r = await authFetch(`${BASE_URL}/api/agendamentos/${btnCon.dataset.concluir}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "Concluído" })
                });
                if (r.ok) { toast("Agendamento concluído."); loaded.delete("agendamentos"); loaded.delete("dashboard"); carregarAgendamentos(); }
                else { const d = await r.json().catch(() => ({})); toast(d.mensagem || "Erro ao concluir.", "danger"); }
            }
        });

        // Modais
        const modalUsuario = document.getElementById("modal-editar-usuario");
        const modalPet = document.getElementById("modal-editar-pet");
        const fecharModalU = () => {
            modalUsuario.classList.remove("is-active");
            const fotoU = document.getElementById("modal-u-foto");
            if (fotoU) fotoU.value = "";
            const prevU = document.getElementById("modal-u-preview");
            if (prevU) { prevU.src = ""; prevU.style.display = "none"; }
        };
        const fecharModalP = () => {
            modalPet.classList.remove("is-active");
            const fotoP = document.getElementById("modal-p-foto");
            if (fotoP) fotoP.value = "";
            const prevP = document.getElementById("modal-p-preview");
            if (prevP) { prevP.src = ""; prevP.style.display = "none"; }
        };
        let usuarioAtivo = null;
        let petAtivo = null;
        document.getElementById("fechar-modal-u")?.addEventListener("click", fecharModalU);
        document.getElementById("cancelar-modal-u")?.addEventListener("click", fecharModalU);
        document.getElementById("fechar-modal-p")?.addEventListener("click", fecharModalP);
        document.getElementById("cancelar-modal-p")?.addEventListener("click", fecharModalP);

        const abrirModalUsuario = (u) => {
            usuarioAtivo = u;
            document.getElementById("modal-u-titulo").textContent = u.idRole === 3 ? "Editar Funcionário" : "Editar Cliente";
            document.getElementById("modal-u-id").value = u.id;
            document.getElementById("modal-u-nome").value = u.nome || "";
            document.getElementById("modal-u-cep").value = u.cep || "";
            document.getElementById("modal-u-endereco").value = u.endereco || "";
            document.getElementById("modal-u-numero").value = u.numero || "";

            const camposAddress = document.getElementById("campos-address-cliente");
            const camposFuncAdmin = document.getElementById("campos-func-admin");
            if (u.idRole === 3) {
                if (camposAddress) camposAddress.style.display = "none";
                if (camposFuncAdmin) camposFuncAdmin.style.display = "";
                document.getElementById("modal-u-func-email").value = u.email || "";
                document.getElementById("modal-u-func-telefone").value = u.telefone || "";
                document.getElementById("modal-u-func-cpf").value = u.cpf || "";
            } else {
                if (camposAddress) camposAddress.style.display = "";
                if (camposFuncAdmin) camposFuncAdmin.style.display = "none";
            }

            const fotoU = document.getElementById("modal-u-foto");
            if (fotoU) fotoU.value = "";
            const prevU = document.getElementById("modal-u-preview");
            if (prevU) {
                if (u.imagemUrl) { prevU.src = u.imagemUrl; prevU.style.display = "block"; }
                else { prevU.src = ""; prevU.style.display = "none"; }
            }

            const camposReadonly = document.getElementById("campos-readonly-cliente");
            if (u.idRole === 2) {
                document.getElementById("modal-u-cpf").value = u.cpf || "—";
                document.getElementById("modal-u-nascimento").value = u.dataNascimento || "—";
                camposReadonly.style.display = "";
            } else {
                camposReadonly.style.display = "none";
            }

            const campoCargo = document.getElementById("campo-modal-cargo");
            if (u.idRole === 3) {
                campoCargo.style.display = "";
                document.getElementById("modal-u-cargo").value = u.cargo || "";
            } else {
                campoCargo.style.display = "none";
            }
            modalUsuario.classList.add("is-active");
        };

        const abrirModalPet = (p) => {
            petAtivo = p;
            document.getElementById("modal-p-id").value = p.id;
            document.getElementById("modal-p-nome").value = p.nome || "";
            document.getElementById("modal-p-raca").value = p.raca || "";
            document.getElementById("modal-p-porte").value = p.porte || "Pequeno";
            document.getElementById("modal-p-sexo").value = p.sexo || "Macho";
            document.getElementById("modal-p-observacao").value = p.observacao || "";
            const fotoP = document.getElementById("modal-p-foto");
            if (fotoP) fotoP.value = "";
            const prevP = document.getElementById("modal-p-preview");
            if (prevP) {
                if (p.imagemUrl) { prevP.src = p.imagemUrl; prevP.style.display = "block"; }
                else { prevP.src = ""; prevP.style.display = "none"; }
            }
            modalPet.classList.add("is-active");
        };

        document.getElementById("tabela-clientes")?.addEventListener("click", e => {
            const btn = e.target.closest("[data-edit-u]");
            if (btn) abrirModalUsuario(JSON.parse(btn.dataset.editU));
        });
        document.getElementById("tabela-funcionarios")?.addEventListener("click", e => {
            const btn = e.target.closest("[data-edit-u]");
            if (btn) abrirModalUsuario(JSON.parse(btn.dataset.editU));
        });
        document.getElementById("tabela-pets")?.addEventListener("click", e => {
            const btn = e.target.closest("[data-edit-p]");
            if (btn) abrirModalPet(JSON.parse(btn.dataset.editP));
        });

        document.getElementById("btn-salvar-modal-usuario")?.addEventListener("click", async () => {
            const id = document.getElementById("modal-u-id").value;
            const cargo = document.getElementById("modal-u-cargo").value;
            const body = usuarioAtivo?.idRole === 3
                ? {
                    nome: document.getElementById("modal-u-nome").value,
                    email: document.getElementById("modal-u-func-email").value,
                    telefone: document.getElementById("modal-u-func-telefone").value,
                    cpf: document.getElementById("modal-u-func-cpf").value,
                    ...(cargo ? { cargo } : {})
                }
                : {
                    nome: document.getElementById("modal-u-nome").value,
                    cep: document.getElementById("modal-u-cep").value,
                    endereco: document.getElementById("modal-u-endereco").value,
                    numero: document.getElementById("modal-u-numero").value,
                };
            try {
                const r = await authFetch(`${BASE_URL}/api/usuarios/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                if (r.ok) {
                    const arquivo = document.getElementById("modal-u-foto")?.files[0];
                    if (arquivo) {
                        const fd = new FormData();
                        fd.append("imagem", arquivo);
                        await authFetch(`${BASE_URL}/api/usuarios/${id}/imagem`, { method: "POST", body: fd });
                    }
                    toast("Salvo com sucesso!"); fecharModalU(); setTimeout(() => location.reload(), 800);
                } else toast("Erro ao salvar.", "danger");
            } catch { toast("Erro ao conectar.", "danger"); }
        });

        document.getElementById("btn-salvar-modal-pet")?.addEventListener("click", async () => {
            const id = document.getElementById("modal-p-id").value;
            const body = {
                nome: document.getElementById("modal-p-nome").value,
                raca: document.getElementById("modal-p-raca").value,
                porte: document.getElementById("modal-p-porte").value,
                sexo: document.getElementById("modal-p-sexo").value,
                observacao: document.getElementById("modal-p-observacao").value
            };
            try {
                const r = await authFetch(`${BASE_URL}/api/pets/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                if (r.ok) {
                    const arquivo = document.getElementById("modal-p-foto")?.files[0];
                    if (arquivo) {
                        const fd = new FormData();
                        fd.append("imagem", arquivo);
                        await authFetch(`${BASE_URL}/api/pets/${id}/imagem`, { method: "POST", body: fd });
                    }
                    toast("Pet salvo com sucesso!"); fecharModalP(); setTimeout(() => location.reload(), 800);
                } else toast("Erro ao salvar.", "danger");
            } catch { toast("Erro ao conectar.", "danger"); }
        });

        document.getElementById("btn-excluir-usuario")?.addEventListener("click", async () => {
            if (!usuarioAtivo) return;
            const tipo = usuarioAtivo.idRole === 3 ? "funcionário" : "cliente";
            const aviso = usuarioAtivo.idRole === 2 ? " Todos os pets e histórico serão removidos." : "";
            if (!confirm(`Tem certeza que deseja excluir este ${tipo}?${aviso}`)) return;
            try {
                const r = await authFetch(`${BASE_URL}/api/usuarios/${usuarioAtivo.id}`, { method: "DELETE" });
                if (r.ok) {
                    toast(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} excluído com sucesso!`);
                    fecharModalU();
                    setTimeout(() => location.reload(), 800);
                } else {
                    const data = await r.json().catch(() => ({}));
                    toast(data.mensagem || "Erro ao excluir.", "danger");
                }
            } catch { toast("Erro ao conectar.", "danger"); }
        });

        document.getElementById("btn-excluir-pet")?.addEventListener("click", async () => {
            if (!petAtivo) return;
            if (!confirm(`Tem certeza que deseja excluir o pet "${petAtivo.nome}"?`)) return;
            try {
                const r = await authFetch(`${BASE_URL}/api/pets/${petAtivo.id}`, { method: "DELETE" });
                if (r.ok) {
                    toast("Pet excluído com sucesso!");
                    fecharModalP();
                    setTimeout(() => location.reload(), 800);
                } else {
                    const data = await r.json().catch(() => ({}));
                    toast(data.mensagem || "Erro ao excluir.", "danger");
                }
            } catch { toast("Erro ao conectar.", "danger"); }
        });

        function carregarClientes() {
            authFetch(`${BASE_URL}/api/usuarios/clientes`)
                .then(r => r.ok ? r.json() : [])
                .then(clientes => { _clientes = clientes; renderClientes(); })
                .catch(() => {});
        }

        function renderClientes() {
            const q = (document.getElementById("filtro-cl")?.value || "").toLowerCase();
            const dados = q ? _clientes.filter(u =>
                [u.nome, u.email].some(v => (v || "").toLowerCase().includes(q))
            ) : _clientes;
            paginar(dados, u => `
                <td>${u.nome || "—"}</td>
                <td>${u.email || "—"}</td>
                <td>${u.telefone || "—"}</td>
                <td>
                  <div class="buttons are-small mb-0">
                    <a class="button is-light" href="cliente.html?id=${u.id}" title="Detalhes" target="_blank"><span class="icon"><i class="fas fa-eye"></i></span></a>
                    <button class="button is-light" title="Editar" data-edit-u='${JSON.stringify(u)}'><span class="icon"><i class="fas fa-pen"></i></span></button>
                  </div>
                </td>`,
            "tabela-clientes", "clientes-vazio", "pag-clientes");
        }

        function carregarFuncionarios() {
            authFetch(`${BASE_URL}/api/usuarios/funcionarios`)
                .then(r => r.ok ? r.json() : [])
                .then(funcionarios => { _funcionarios = funcionarios; renderFuncionarios(); })
                .catch(() => {});
        }

        function renderFuncionarios() {
            const q = (document.getElementById("filtro-func")?.value || "").toLowerCase();
            const cargos = checados("chk-func-cargo");
            const dados = _funcionarios.filter(f => {
                if (q && ![f.nome, f.cargo, f.email].some(v => (v || "").toLowerCase().includes(q))) return false;
                if (cargos && !cargos.includes(f.cargo || "")) return false;
                return true;
            });
            paginar(dados, f => `
                <td>${f.nome || "—"}</td>
                <td>${f.cargo || "—"}</td>
                <td>${f.telefone || "—"}</td>
                <td>${f.email || "—"}</td>
                <td>
                  <div class="buttons are-small mb-0">
                    <a class="button is-light" href="func-detalhe.html?id=${f.id}" title="Detalhes" target="_blank"><span class="icon"><i class="fas fa-eye"></i></span></a>
                    <button class="button is-light" title="Editar" data-edit-u='${JSON.stringify(f)}'><span class="icon"><i class="fas fa-pen"></i></span></button>
                  </div>
                </td>`,
            "tabela-funcionarios", "funcionarios-vazio", "pag-funcionarios");
        }

        function carregarPets() {
            authFetch(`${BASE_URL}/api/pets`)
                .then(r => r.ok ? r.json() : [])
                .then(pets => { _pets = pets; renderPets(); })
                .catch(() => {});
        }

        function renderPets() {
            const q = (document.getElementById("filtro-pets")?.value || "").toLowerCase();
            const portes = checados("chk-pet-porte");
            const sexos  = checados("chk-pet-sexo");
            const dados = _pets.filter(p => {
                if (q && ![p.nome, p.raca, p.porte, p.sexo].some(v => (v || "").toLowerCase().includes(q))) return false;
                if (portes && !portes.includes(p.porte || "")) return false;
                if (sexos  && !sexos.includes(p.sexo || ""))  return false;
                return true;
            });
            paginar(dados, p => `
                <td>${p.id}</td>
                <td>${p.nome || "—"}</td>
                <td>${p.raca || "—"}</td>
                <td>${p.porte || "—"}</td>
                <td>${p.sexo || "—"}</td>
                <td>
                  <div class="buttons are-small mb-0">
                    <a class="button is-light" href="pet.html?id=${p.id}" title="Detalhes" target="_blank"><span class="icon"><i class="fas fa-eye"></i></span></a>
                    <button class="button is-light" title="Editar" data-edit-p='${JSON.stringify(p)}'><span class="icon"><i class="fas fa-pen"></i></span></button>
                  </div>
                </td>`,
            "tabela-pets", "pets-admin-vazio", "pag-pets");
        }

        function carregarServicos() {
            authFetch(`${BASE_URL}/api/servicos`)
                .then(r => r.ok ? r.json() : [])
                .then(servicos => { _servicos = servicos; renderServicos(); })
                .catch(() => {});
        }

        function renderServicos() {
            const q = (document.getElementById("filtro-serv")?.value || "").toLowerCase();
            const tipos = checados("chk-serv-tipo");
            const dados = _servicos.filter(s => {
                if (q && !(s.nome || "").toLowerCase().includes(q) && !(s.isVet ? "veterinário" : "geral").includes(q)) return false;
                if (tipos && !tipos.includes(s.isVet ? "Veterinário" : "Geral")) return false;
                return true;
            });
            const tbody = document.getElementById("tabela-servicos");
            const vazio = document.getElementById("servicos-vazio");
            tbody.innerHTML = "";
            if (!dados || dados.length === 0) { vazio.classList.remove("is-hidden"); return; }
            vazio.classList.add("is-hidden");
            dados.forEach(s => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${s.id}</td>
                    <td>${s.nome}</td>
                    <td>${s.duracao ? s.duracao + ' min' : '—'}</td>
                    <td>${s.isVet ? '<span class="tag is-info is-light is-small">Veterinário</span>' : '<span class="tag is-light is-small">Geral</span>'}</td>
                    <td><button class="button is-small is-danger is-outlined" data-del-serv="${s.id}" title="Excluir"><span class="icon"><i class="fas fa-trash"></i></span></button></td>`;
                tbody.appendChild(tr);
            });
        }

        function carregarInsights() {
            Promise.all([
                authFetch(`${BASE_URL}/api/agendamentos`).then(r => r.ok ? r.json() : []),
                authFetch(`${BASE_URL}/api/pets`).then(r => r.ok ? r.json() : [])
            ]).then(([ags, pets]) => renderInsights(ags, pets)).catch(() => {});
        }

        function renderInsights(ags, pets) {
            const total = ags.length;
            const concluidos = ags.filter(a => a.status === "Concluído").length;
            const taxa = total > 0 ? Math.round((concluidos / total) * 100) : 0;

            const contServico = {};
            ags.forEach(a => { if (a.servico) contServico[a.servico] = (contServico[a.servico] || 0) + 1; });
            const servicoTop = Object.entries(contServico).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

            const contPet = {};
            ags.forEach(a => { if (a.petNome) contPet[a.petNome] = (contPet[a.petNome] || 0) + 1; });
            const petTop = Object.entries(contPet).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

            document.getElementById("kpi-total-ags").textContent = total;
            document.getElementById("kpi-taxa-conclusao").textContent = taxa + "%";
            document.getElementById("kpi-servico-top").textContent = servicoTop;
            document.getElementById("kpi-pet-top").textContent = petTop;

            // Donut: status
            const statusLabels = ["Agendado", "Concluído", "Cancelado"];
            const statusData = statusLabels.map(s => ags.filter(a => a.status === s).length);
            _chartStatus?.destroy();
            _chartStatus = new Chart(document.getElementById("chart-status"), {
                type: "doughnut",
                data: {
                    labels: statusLabels,
                    datasets: [{ data: statusData, backgroundColor: ["#3273dc", "#48c774", "#ff3860"], borderWidth: 2 }]
                },
                options: { responsive: true, plugins: { legend: { position: "bottom" } } }
            });

            // Bar horizontal: serviços populares (top 6)
            const servicoEntries = Object.entries(contServico).sort((a, b) => b[1] - a[1]).slice(0, 6);
            _chartServicos?.destroy();
            _chartServicos = new Chart(document.getElementById("chart-servicos"), {
                type: "bar",
                data: {
                    labels: servicoEntries.map(e => e[0]),
                    datasets: [{ label: "Agendamentos", data: servicoEntries.map(e => e[1]), backgroundColor: "#3273dc99", borderColor: "#3273dc", borderWidth: 1 }]
                },
                options: { indexAxis: "y", responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { stepSize: 1 } } } }
            });

            // Bar: dias da semana
            const diasNomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            const diasData = Array(7).fill(0);
            ags.forEach(a => { if (a.data) diasData[new Date(a.data + "T12:00:00").getDay()]++; });
            _chartDias?.destroy();
            _chartDias = new Chart(document.getElementById("chart-dias"), {
                type: "bar",
                data: {
                    labels: diasNomes,
                    datasets: [{ label: "Agendamentos", data: diasData, backgroundColor: "#209cee99", borderColor: "#209cee", borderWidth: 1 }]
                },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1 }, beginAtZero: true } } }
            });

            // Donut: porte dos pets
            const porteCont = { "Pequeno": 0, "Médio": 0, "Grande": 0 };
            pets.forEach(p => { if (p.porte && porteCont[p.porte] !== undefined) porteCont[p.porte]++; });
            _chartPorte?.destroy();
            _chartPorte = new Chart(document.getElementById("chart-porte"), {
                type: "doughnut",
                data: {
                    labels: Object.keys(porteCont),
                    datasets: [{ data: Object.values(porteCont), backgroundColor: ["#ffdd57", "#48c774", "#3273dc"], borderWidth: 2 }]
                },
                options: { responsive: true, plugins: { legend: { position: "bottom" } } }
            });
        }

        document.getElementById("tabela-servicos")?.addEventListener("click", async e => {
            const btn = e.target.closest("[data-del-serv]");
            if (!btn) return;
            if (!confirm("Excluir este serviço? Agendamentos existentes não serão afetados.")) return;
            const r = await authFetch(`${BASE_URL}/api/servicos/${btn.dataset.delServ}`, { method: "DELETE" });
            if (r.ok) { _servicosCache = null; carregarServicos(); toast("Serviço excluído."); }
            else toast("Erro ao excluir.", "danger");
        });

        document.getElementById("btn-add-servico")?.addEventListener("click", async () => {
            const nomeInput = document.getElementById("novo-servico-nome");
            const duracaoInput = document.getElementById("novo-servico-duracao");
            const isVetInput = document.getElementById("novo-servico-isvet");
            const nome = nomeInput.value.trim();
            if (!nome) { toast("Digite o nome do serviço.", "warning"); return; }
            const duracao = parseInt(duracaoInput.value) || null;
            if (!duracao || duracao < 1) { toast("Informe o tempo estimado em minutos.", "warning"); return; }
            const isVet = isVetInput?.checked || false;
            const r = await authFetch(`${BASE_URL}/api/servicos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, duracao, isVet })
            });
            if (r.ok) {
                _servicosCache = null;
                nomeInput.value = "";
                duracaoInput.value = "";
                if (isVetInput) isVetInput.checked = false;
                carregarServicos();
                toast("Serviço adicionado!");
            } else {
                const d = await r.json().catch(() => ({}));
                toast(d.mensagem || "Erro ao adicionar.", "danger");
            }
        });

        document.getElementById("novo-servico-nome")?.addEventListener("keydown", e => {
            if (e.key === "Enter") document.getElementById("btn-add-servico").click();
        });

        const loaders = {
            dashboard:    carregarDashboard,
            agendamentos: carregarAgendamentos,
            clientes:     carregarClientes,
            funcionarios: carregarFuncionarios,
            pets:         carregarPets,
            servicos:     carregarServicos,
            insights:     carregarInsights,
        };

        document.getElementById("filtro-dashboard")?.addEventListener("input", renderDashboard);
        document.getElementById("filtro-ag")?.addEventListener("input", renderAgendamentos);
        document.getElementById("filtro-cl")?.addEventListener("input", renderClientes);
        document.getElementById("filtro-func")?.addEventListener("input", renderFuncionarios);
        document.getElementById("filtro-pets")?.addEventListener("input", renderPets);
        document.getElementById("filtro-serv")?.addEventListener("input", renderServicos);
        document.querySelectorAll("[name^='chk-ag-']").forEach(el => el.addEventListener("change", renderAgendamentos));
        document.getElementById("filtro-ag-data")?.addEventListener("change", e => {
            const hoje = new Date().toLocaleDateString("en-CA");
            const chk = document.getElementById("chk-ag-hoje");
            if (chk) chk.checked = (e.target.value === hoje);
            renderAgendamentos();
        });
        document.getElementById("chk-ag-hoje")?.addEventListener("change", e => {
            const input = document.getElementById("filtro-ag-data");
            if (input) input.value = e.target.checked ? new Date().toLocaleDateString("en-CA") : "";
            renderAgendamentos();
        });
        document.querySelectorAll("[name^='chk-func-']").forEach(el => el.addEventListener("change", renderFuncionarios));
        document.querySelectorAll("[name^='chk-pet-']").forEach(el => el.addEventListener("change", renderPets));
        document.querySelectorAll("[name^='chk-serv-']").forEach(el => el.addEventListener("change", renderServicos));

        // Modal: Novo Agendamento
        const modalAg = document.getElementById("modal-novo-agendamento");
        const fecharModalAg = () => {
            modalAg.classList.remove("is-active");
            document.querySelectorAll("#modal-ag-servicos input[type=checkbox]").forEach(cb => cb.checked = false);
            const horaSelect = document.getElementById("modal-ag-hora");
            [...horaSelect.options].forEach(opt => { opt.disabled = false; if (opt.value) opt.text = opt.value; });
        };
        document.getElementById("fechar-modal-ag")?.addEventListener("click", fecharModalAg);
        document.getElementById("cancelar-modal-ag")?.addEventListener("click", fecharModalAg);

        const _verificarAdmin = () => verificarDisponibilidade({
            dataId: "modal-ag-data", horaId: "modal-ag-hora",
            servicosSelector: "#modal-ag-servicos", fetchServicos: getServicos
        });

        setupBloqueioVetGeral("modal-ag-servicos");
        document.getElementById("modal-ag-data")?.addEventListener("change", _verificarAdmin);
        document.getElementById("modal-ag-servicos")?.addEventListener("change", _verificarAdmin);

        document.getElementById("btn-novo-agendamento")?.addEventListener("click", async () => {
            const selectCliente = document.getElementById("modal-ag-cliente");
            if (selectCliente.options.length === 1) {
                authFetch(`${BASE_URL}/api/usuarios`)
                    .then(r => r.ok ? r.json() : [])
                    .then(usuarios => {
                        usuarios.filter(u => u.idRole === 2).forEach(u => {
                            const opt = document.createElement("option");
                            opt.value = u.id;
                            opt.textContent = u.nome;
                            selectCliente.appendChild(opt);
                        });
                    });
            }
            const servicos = await getServicos();
            renderCheckboxes("modal-ag-servicos", servicos, [], false);
            document.getElementById("modal-ag-data").min = new Date().toISOString().split("T")[0];
            modalAg.classList.add("is-active");
            _verificarAdmin();
        });

        setupClientePetSelect("modal-ag-cliente", "modal-ag-pet");

        document.getElementById("btn-salvar-modal-ag")?.addEventListener("click", async () => {
            const usuarioId = document.getElementById("modal-ag-cliente").value;
            const petId = document.getElementById("modal-ag-pet").value;
            const servico = [...document.querySelectorAll("#modal-ag-servicos input[type=checkbox]:checked")].map(c => c.value).join(", ");
            const data = document.getElementById("modal-ag-data").value;
            const hora = document.getElementById("modal-ag-hora").value;
            const observacao = document.getElementById("modal-ag-observacao").value;

            if (!usuarioId || !petId || !servico || !data || !hora) {
                toast("Selecione pelo menos um serviço e preencha todos os campos.", "warning"); return;
            }

            try {
                const r = await authFetch(`${BASE_URL}/api/agendamentos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usuarioId: Number(usuarioId), petId: Number(petId), servico, data, hora, observacao })
                });
                if (r.ok) {
                    toast("Agendamento criado com sucesso!");
                    recarregarAgendamentos(fecharModalAg);
                } else {
                    const err = await r.json();
                    toast(err.mensagem || "Erro ao agendar.", "danger");
                }
            } catch { toast("Erro ao conectar.", "danger"); }
        });

        function recarregarAgendamentos(fecharModal) {
            fecharModal();
            document.getElementById("tabela-agendamentos").innerHTML = "";
            loaded.delete("agendamentos");
            loaded.delete("dashboard");
            carregarAgendamentos();
            loaded.add("agendamentos");
        }

        // Modal: Detalhe / Edição de Agendamento
        let agAtivo = null;
        const modalDet = document.getElementById("modal-ag-detalhe");

        const fecharModalDet = () => {
            modalDet.classList.remove("is-active");
            document.getElementById("ag-detalhe-form").classList.remove("is-hidden");
            document.getElementById("ag-cancel-confirm").classList.add("is-hidden");
            document.getElementById("ag-footer-esq").style.display      = "none";
            document.getElementById("ag-footer-dir").style.display      = "flex";
            document.getElementById("btn-ag-det-salvar").style.display  = "none";
            document.getElementById("btn-ag-det-fechar").style.display  = "none";
            document.getElementById("ag-det-footer-confirm").style.display = "none";
            document.getElementById("ag-cancel-motivo").value = "";
            document.getElementById("ag-det-motivo-section").style.display = "none";
        };

        document.getElementById("fechar-modal-ag-det")?.addEventListener("click", fecharModalDet);
        document.getElementById("btn-ag-det-fechar")?.addEventListener("click", fecharModalDet);

        async function abrirModalDetalheAg(ag) {
            agAtivo = ag;
            const editavel = ag.status === "Agendado";

            document.getElementById("modal-ag-det-titulo").textContent = `Agendamento #${ag.id}`;
            document.getElementById("ag-det-cliente").textContent = ag.usuarioNome || "—";
            document.getElementById("ag-det-pet").textContent = ag.petNome || "—";
            document.getElementById("ag-det-status").innerHTML = tagStatus(ag.status);

            const servicos = await getServicos();
            const servList = (ag.servico || "").split(",").map(s => s.trim());
            renderCheckboxes("ag-det-servicos", servicos, servList, !editavel);

            const inputData = document.getElementById("ag-det-data");
            inputData.value = ag.data || "";
            inputData.disabled = !editavel;

            const selHora = document.getElementById("ag-det-hora");
            selHora.value = ag.hora || "";
            selHora.disabled = !editavel;

            const txtObs = document.getElementById("ag-det-obs");
            txtObs.value = ag.observacao || "";
            txtObs.disabled = !editavel;

            const motivoSection = document.getElementById("ag-det-motivo-section");
            if (ag.status === "Cancelado" && ag.motivo) {
                document.getElementById("ag-det-motivo").textContent = ag.motivo;
                motivoSection.style.display = "block";
            } else {
                motivoSection.style.display = "none";
            }

            if (editavel) {
                document.getElementById("ag-footer-esq").style.display     = "flex";
                document.getElementById("btn-ag-det-salvar").style.display = "inline-flex";
                document.getElementById("btn-ag-det-fechar").style.display = "none";
            } else {
                document.getElementById("ag-footer-esq").style.display     = "none";
                document.getElementById("btn-ag-det-salvar").style.display = "none";
                document.getElementById("btn-ag-det-fechar").style.display = "inline-flex";
            }

            modalDet.classList.add("is-active");
        }

        document.getElementById("btn-ag-det-salvar")?.addEventListener("click", async () => {
            if (!agAtivo) return;
            const body = {
                servico:    [...document.querySelectorAll("#ag-det-servicos input[type=checkbox]:checked")].map(c => c.value).join(", "),
                data:       document.getElementById("ag-det-data").value,
                hora:       document.getElementById("ag-det-hora").value,
                observacao: document.getElementById("ag-det-obs").value,
            };
            try {
                const r = await authFetch(`${BASE_URL}/api/agendamentos/${agAtivo.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                if (r.ok) {
                    toast("Agendamento atualizado!");
                    recarregarAgendamentos(fecharModalDet);
                } else toast("Erro ao salvar.", "danger");
            } catch { toast("Erro ao conectar.", "danger"); }
        });

        document.getElementById("btn-ag-cancelar-inicio")?.addEventListener("click", () => {
            document.getElementById("ag-detalhe-form").classList.add("is-hidden");
            document.getElementById("ag-cancel-confirm").classList.remove("is-hidden");
            document.getElementById("ag-footer-esq").style.display         = "none";
            document.getElementById("ag-footer-dir").style.display         = "none";
            document.getElementById("ag-det-footer-confirm").style.display = "flex";
        });

        document.getElementById("btn-ag-voltar-form")?.addEventListener("click", () => {
            document.getElementById("ag-detalhe-form").classList.remove("is-hidden");
            document.getElementById("ag-cancel-confirm").classList.add("is-hidden");
            document.getElementById("ag-det-footer-confirm").style.display = "none";
            document.getElementById("ag-footer-esq").style.display         = "flex";
            document.getElementById("ag-footer-dir").style.display         = "flex";
            document.getElementById("btn-ag-det-salvar").style.display     = "inline-flex";
            document.getElementById("btn-ag-det-fechar").style.display     = "none";
        });

        document.getElementById("btn-ag-confirmar-cancel")?.addEventListener("click", async () => {
            const motivo = document.getElementById("ag-cancel-motivo").value.trim();
            if (!motivo) { toast("Informe o motivo do cancelamento.", "warning"); return; }
            if (!agAtivo) return;
            try {
                const r = await authFetch(`${BASE_URL}/api/agendamentos/${agAtivo.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "Cancelado", motivo: motivo })
                });
                if (r.ok) {
                    toast("Agendamento cancelado.");
                    recarregarAgendamentos(fecharModalDet);
                } else toast("Erro ao cancelar.", "danger");
            } catch { toast("Erro ao conectar.", "danger"); }
        });

        document.querySelectorAll("[data-aba]").forEach(link => {
            link.addEventListener("click", e => {
                e.preventDefault();
                mostrarAba(link.dataset.aba);
            });
        });

        mostrarAba("dashboard");

        setInterval(() => { if (loaders[abaAtiva]) loaders[abaAtiva](); }, 60000);

        document.getElementById("btn-sair-admin")?.addEventListener("click", logout);

        // Modal: Novo Funcionário
        const modalFunc = document.getElementById("modal-novo-funcionario");
        const fecharModalFunc = () => {
            modalFunc.classList.remove("is-active");
            ["func-nome","func-cpf","func-email","func-senha","func-senhaRepetida","func-dataNascimento"].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.value = ""; el.classList.remove("is-danger"); }
            });
            const cargo = document.getElementById("func-cargo");
            const wrapCargo = document.getElementById("wrap-func-cargo");
            if (cargo) cargo.value = "";
            if (wrapCargo) wrapCargo.classList.remove("is-danger");
            const fotoFunc = document.getElementById("func-foto");
            if (fotoFunc) fotoFunc.value = "";
            const prevFunc = document.getElementById("func-preview");
            if (prevFunc) { prevFunc.src = ""; prevFunc.style.display = "none"; }
        };
        document.getElementById("btn-abrir-modal-func")?.addEventListener("click", () => modalFunc.classList.add("is-active"));
        document.getElementById("fechar-modal-func")?.addEventListener("click", fecharModalFunc);
        document.getElementById("cancelar-modal-func")?.addEventListener("click", fecharModalFunc);

        document.getElementById("btn-cadastrar-func-modal")?.addEventListener("click", async () => {
            const ok = [
                validarNome("func-nome"),
                validarCpf("func-cpf"),
                validarSelect("wrap-func-cargo", "func-cargo", "Cargo"),
                validarData("func-dataNascimento"),
                validarEmail("func-email"),
                validarTelefone("func-telefone"),
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
                telefone: document.getElementById("func-telefone").value,
                senha: document.getElementById("func-senha").value
            };

            try {
                const response = await authFetch(`${BASE_URL}/api/usuarios/funcionario/cadastrar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if (response.ok) {
                    const arquivo = document.getElementById("func-foto")?.files[0];
                    if (arquivo && data.id) {
                        const fd = new FormData();
                        fd.append("imagem", arquivo);
                        await authFetch(`${BASE_URL}/api/usuarios/${data.id}/imagem`, { method: "POST", body: fd });
                    }
                    toast("Funcionário cadastrado com sucesso!");
                    fecharModalFunc();
                    loaded.delete("funcionarios");
                    mostrarAba("funcionarios");
                } else {
                    toast(data.mensagem || "Erro ao cadastrar.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });

    }

    // ================= CADASTRO FUNCIONÁRIO =================

    if (document.getElementById("pagina-cadastro-funcionario")) {
        if (!localStorage.getItem("petgo_id") || Number(localStorage.getItem("petgo_role")) !== 1) {
            window.location.href = "index.html";
        }

        document.getElementById("btn-sair-admin")?.addEventListener("click", logout);

        document.getElementById("btn-cadastrar-funcionario")?.addEventListener("click", async () => {
            const ok = [
                validarNome("func-nome"),
                validarCpf("func-cpf"),
                validarSelect("wrap-func-cargo", "func-cargo", "Cargo"),
                validarData("func-dataNascimento"),
                validarEmail("func-email"),
                validarTelefone("func-telefone"),
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
                telefone: document.getElementById("func-telefone").value,
                senha: document.getElementById("func-senha").value
            };

            try {
                const response = await authFetch(`${BASE_URL}/api/usuarios/funcionario/cadastrar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if (response.ok) {
                    const arquivo = document.getElementById("func-foto")?.files[0];
                    if (arquivo && data.id) {
                        const fd = new FormData();
                        fd.append("imagem", arquivo);
                        await authFetch(`${BASE_URL}/api/usuarios/${data.id}/imagem`, { method: "POST", body: fd });
                    }
                    toast("Funcionário cadastrado com sucesso!");
                    setTimeout(() => window.location.href = "admin.html", 1500);
                } else {
                    toast(data.mensagem || "Erro ao cadastrar.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });
    }

    // ================= FUNCIONÁRIO =================

    if (document.getElementById("funcionario-dashboard")) {
        const funcId    = localStorage.getItem("petgo_id");
        const funcRole  = Number(localStorage.getItem("petgo_role"));
        const funcCargo = localStorage.getItem("petgo_cargo") || "";
        if (!funcId || funcRole !== 3) { window.location.href = "index.html"; }

        const isAtendente = funcCargo === "Atendente";

        document.getElementById("func-agenda-filtro-data")?.classList.remove("is-hidden");

        if (isAtendente) {
            document.getElementById("btn-func-novo-ag")?.classList.remove("is-hidden");
            const sub = document.getElementById("func-agenda-subtitulo");
            if (sub) sub.textContent = "Todos os agendamentos";
        }

        // Navegação entre seções
        const secoes = { agenda: "section-func-agenda", perfil: "section-func-perfil" };
        document.querySelectorAll("[data-secao-func]").forEach(link => {
            link.addEventListener("click", e => {
                e.preventDefault();
                const alvo = link.dataset.secaoFunc;
                Object.values(secoes).forEach(id => document.getElementById(id)?.classList.add("is-hidden"));
                document.getElementById(secoes[alvo])?.classList.remove("is-hidden");
                document.querySelectorAll("[data-secao-func]").forEach(l => l.classList.remove("is-active"));
                link.classList.add("is-active");
            });
        });

        // Carrega dados do funcionário
        let _funcDados = null;

        function preencherPerfil(u) {
            _funcDados = u;
            const avatar = document.getElementById("func-avatar");
            if (avatar) {
                avatar.src = u.imagemUrl || `https://placehold.co/64x64?text=${u.nome[0]}`;
            }
            const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "—"; };
            setText("func-nome-nav",    u.nome?.split(" ")[0]);
            setText("func-cargo-nav",   u.cargo);
            setText("fp-nome",          u.nome);
            setText("fp-cargo",         u.cargo);
            setText("fp-cpf",           u.cpf);
            setText("fp-dataNascimento",u.dataNascimento);
            setText("fp-email",         u.email);
            setText("fp-telefone",      u.telefone);
        }

        authFetch(`${BASE_URL}/api/usuarios/${funcId}`)
            .then(r => r.ok ? r.json() : null)
            .then(u => { if (u) preencherPerfil(u); })
            .catch(() => {});

        // Modal editar perfil


        const modalEditarFunc = document.getElementById("modal-editar-func");
        const fecharModalEditarFunc = () => modalEditarFunc?.classList.remove("is-active");

        document.getElementById("btn-editar-func-perfil")?.addEventListener("click", () => {
            if (!_funcDados) return;
            const u = _funcDados;
            document.getElementById("modal-func-nome").value          = u.nome || "";
            document.getElementById("modal-func-cargo").value         = u.cargo || "";
            document.getElementById("modal-func-cpf").value           = u.cpf || "";
            document.getElementById("modal-func-dataNascimento").value = u.dataNascimento || "";
            document.getElementById("modal-func-email").value     = u.email    || "";
            document.getElementById("modal-func-telefone").value = u.telefone || "";
            const preview = document.getElementById("modal-func-avatar-preview");
            if (preview) { preview.src = u.imagemUrl || `https://placehold.co/80x80?text=${u.nome[0]}`; }
            document.getElementById("modal-func-foto").value = "";
            modalEditarFunc?.classList.add("is-active");
        });

        document.getElementById("fechar-modal-editar-func")?.addEventListener("click", fecharModalEditarFunc);
        document.getElementById("cancelar-modal-editar-func")?.addEventListener("click", fecharModalEditarFunc);

        document.getElementById("btn-salvar-func-perfil")?.addEventListener("click", async () => {
            const ok = [
                validarNome("modal-func-nome"),
                validarCpf("modal-func-cpf"),
                validarData("modal-func-dataNascimento"),
                validarEmail("modal-func-email"),
                validarTelefone("modal-func-telefone"),
            ].every(Boolean);
            if (!ok) return;

            const body = {
                nome:            document.getElementById("modal-func-nome").value.trim()            || null,
                email:           document.getElementById("modal-func-email").value.trim()           || null,
                telefone:        document.getElementById("modal-func-telefone").value.trim()        || null,
                cpf:             document.getElementById("modal-func-cpf").value.trim()             || null,
                dataNascimento:  document.getElementById("modal-func-dataNascimento").value.trim()  || null,
            };
            const r = await authFetch(`${BASE_URL}/api/usuarios/${funcId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (!r.ok) { toast("Erro ao salvar.", "danger"); return; }

            const foto = document.getElementById("modal-func-foto").files[0];
            if (foto) {
                const fd = new FormData();
                fd.append("imagem", foto);
                await authFetch(`${BASE_URL}/api/usuarios/${funcId}/imagem`, { method: "POST", body: fd });
            }

            toast("Perfil atualizado!");
            fecharModalEditarFunc();
            authFetch(`${BASE_URL}/api/usuarios/${funcId}`)
                .then(r => r.ok ? r.json() : null)
                .then(u => { if (u) preencherPerfil(u); });
        });

        // Agenda
        const tbodyFunc = document.getElementById("tabela-func-agenda");
        const vazioFunc = document.getElementById("func-agenda-vazio");

        // Read-only detail modal (Vet/Esteticista)
        const modalFuncAgDet = document.getElementById("modal-func-ag-det");
        const fecharModalFuncAgDet = () => modalFuncAgDet?.classList.remove("is-active");
        document.getElementById("fechar-modal-func-ag-det")?.addEventListener("click", fecharModalFuncAgDet);
        document.getElementById("btn-func-ag-det-fechar")?.addEventListener("click", fecharModalFuncAgDet);

        function abrirDetalheAgFunc(ag) {
            document.getElementById("func-ag-det-titulo").textContent  = `Agendamento #${ag.id}`;
            document.getElementById("func-ag-det-cliente").textContent = ag.usuarioNome || "—";
            document.getElementById("func-ag-det-pet").textContent     = ag.petNome     || "—";
            document.getElementById("func-ag-det-servico").textContent = ag.servico     || "—";
            document.getElementById("func-ag-det-data").textContent    = fmtData(ag.data);
            document.getElementById("func-ag-det-hora").textContent    = ag.hora        || "—";
            document.getElementById("func-ag-det-status").innerHTML    = tagStatus(ag.status);
            document.getElementById("func-ag-det-obs").textContent     = ag.observacao  || "Nenhuma observação.";
            const motivoSection = document.getElementById("func-ag-det-motivo-section");
            if (ag.status === "Cancelado" && ag.motivo) {
                document.getElementById("func-ag-det-motivo").textContent = ag.motivo;
                motivoSection.style.display = "block";
            } else {
                motivoSection.style.display = "none";
            }
            modalFuncAgDet?.classList.add("is-active");
        }

        let abrirModalFuncAgEdit = null;

        tbodyFunc.addEventListener("click", async e => {
            const btnDetEdit = e.target.closest("[data-ag-func-edit]");
            if (btnDetEdit && abrirModalFuncAgEdit) { await abrirModalFuncAgEdit(JSON.parse(btnDetEdit.dataset.agFuncEdit)); return; }
            const btnDet = e.target.closest("[data-ag-func]");
            if (btnDet) { abrirDetalheAgFunc(JSON.parse(btnDet.dataset.agFunc)); return; }
            const btn = e.target.closest("[data-concluir-func]");
            if (!btn) return;
            if (!confirm("Tem certeza que deseja marcar como Concluído?\nEsta ação não pode ser revertida.")) return;
            const r = await authFetch(`${BASE_URL}/api/agendamentos/${btn.dataset.concluirFunc}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Concluído" })
            });
            if (r.ok) { toast("Agendamento concluído."); carregarAgendaFunc(); }
            else { const d = await r.json().catch(() => ({})); toast(d.mensagem || "Erro ao concluir.", "danger"); }
        });

        let _agsFunc = [];

        function renderAgendaFunc() {
            let dados;

            if (isAtendente) {
                dados = filtrarAgendamentos(_agsFunc, "filtro-func-ag", "chk-func-ag-status", "filtro-func-ag-data");
            } else {
                  const q = (document.getElementById("filtro-func-ag")?.value || "").toLowerCase();
                  const status = checados("chk-func-ag-status") || [];
                  const dataFiltro = document.getElementById("filtro-func-ag-data")?.value;

                  dados = _agsFunc.filter(ag => {

                      // converte DD/MM/AAAA -> AAAA-MM-DD
                      const dataAg = ag.data.includes("/")
                          ? ag.data.split("/").reverse().join("-")
                          : ag.data;

                      if (dataFiltro && dataAg !== dataFiltro) return false;

                      if (funcCargo === "Veterinário" && !ag.isVet) return false;

                      if (funcCargo === "Esteticista" && ag.isVet) return false;

                      if (
                          q &&
                          ![ag.usuarioNome, ag.petNome, ag.servico, ag.status]
                              .some(v => (v || "").toLowerCase().includes(q))
                      ) return false;

                      if (
                          status.length > 0 &&
                          !status.includes(ag.status || "Agendado")
                      ) return false;

                      return true;

                  }).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
              }

            if (isAtendente) {
                paginar(dados, ag => `
                    <td>${fmtData(ag.data)} ${ag.hora || ""}</td>
                    <td>${ag.usuarioNome || "—"}</td>
                    <td>${ag.petNome || "—"}</td>
                    <td>${ag.servico || "—"}</td>
                    <td>${tagStatus(ag.status)}</td>
                    <td>
                      <div class="buttons are-small mb-0">
                        <button class="button is-light" title="Detalhes" data-ag-func-edit='${JSON.stringify(ag)}'><span class="icon"><i class="fas fa-eye"></i></span></button>
                        <a class="button is-light" href="pet.html?id=${ag.petId}" title="Ver pet" target="_blank"><span class="icon"><i class="fas fa-paw"></i></span></a>
                        ${ag.status === "Agendado" ? `<button class="button is-success is-light" data-concluir-func="${ag.id}" title="Marcar como Concluído"><span class="icon"><i class="fas fa-check"></i></span></button>` : ""}
                      </div>
                    </td>`,
                "tabela-func-agenda", "func-agenda-vazio", "pag-func-agenda");
            } else {
                const usaEdit = funcCargo === "Esteticista";
                paginar(dados, ag => `
                    <td>${fmtData(ag.data)} ${ag.hora || "—"}</td>
                    <td>${ag.usuarioNome || "—"}</td>
                    <td>${ag.petNome || "—"}</td>
                    <td>${ag.servico || "—"}</td>
                    <td>${tagStatus(ag.status)}</td>
                    <td>
                      <div class="buttons are-small mb-0">
                        ${usaEdit
                            ? `<button class="button is-light" title="${ag.status === "Agendado" ? "Ver / Editar" : "Detalhes"}" data-ag-func-edit='${JSON.stringify(ag)}'><span class="icon"><i class="fas ${ag.status === "Agendado" ? "fa-pen" : "fa-eye"}"></i></span></button>`
                            : `<button class="button is-light" title="Detalhes" data-ag-func='${JSON.stringify(ag)}'><span class="icon"><i class="fas fa-eye"></i></span></button>`
                        }
                        <a class="button is-light" href="cliente.html?id=${ag.usuarioId}" title="Ver cliente" target="_blank"><span class="icon"><i class="fas fa-user"></i></span></a>
                        <a class="button is-light" href="pet.html?id=${ag.petId}" title="Ver pet" target="_blank"><span class="icon"><i class="fas fa-paw"></i></span></a>
                        ${ag.status === "Agendado" ? `<button class="button is-success is-light" data-concluir-func="${ag.id}" title="Marcar como Concluído"><span class="icon"><i class="fas fa-check"></i></span><span>Concluir</span></button>` : ""}
                      </div>
                    </td>`,
                "tabela-func-agenda", "func-agenda-vazio", "pag-func-agenda");
            }
        }

        function carregarAgendaFunc() {
            const endpoint = isAtendente
                ? `${BASE_URL}/api/agendamentos`
                : `${BASE_URL}/api/agendamentos/funcionario/${funcId}`;
            authFetch(endpoint)
                .then(r => r.ok ? r.json() : [])
                .then(ags => { _agsFunc = ags; renderAgendaFunc(); })
                .catch(() => {});
        }

        document.getElementById("filtro-func-ag")?.addEventListener("input", renderAgendaFunc);

        document.getElementById("filtro-func-ag-data")?.addEventListener("change", e => {
            if (isAtendente) {
                const chk = document.getElementById("chk-func-ag-hoje");
                if (chk) chk.checked = (e.target.value === new Date().toLocaleDateString("en-CA"));
            }
            renderAgendaFunc();
        });

        document.getElementById("chk-func-ag-hoje")?.addEventListener("change", e => {
            const input = document.getElementById("filtro-func-ag-data");
            if (input) input.value = e.target.checked ? new Date().toLocaleDateString("en-CA") : "";
            renderAgendaFunc();
        });

        document.querySelectorAll("[name='chk-func-ag-status']")
            .forEach(el => el.addEventListener("change", renderAgendaFunc));

        if (isAtendente || funcCargo === "Esteticista") {

            // Editable detail modal
            const modalFuncAgEdit = document.getElementById("modal-func-ag-edit");
            let agAtivoFunc = null;

            const fecharModalFuncAgEdit = () => {
                modalFuncAgEdit.classList.remove("is-active");
                document.getElementById("func-ag-edit-form").classList.remove("is-hidden");
                document.getElementById("func-ag-edit-cancel-confirm").classList.add("is-hidden");
                document.getElementById("func-ag-footer-esq").style.display = "none";
                document.getElementById("func-ag-footer-dir").style.display = "flex";
                document.getElementById("btn-func-ag-edit-salvar").style.display = "none";
                document.getElementById("btn-func-ag-edit-fechar").style.display = "none";
                document.getElementById("func-ag-edit-footer-confirm").style.display = "none";
                document.getElementById("func-ag-cancel-motivo").value = "";
                document.getElementById("func-ag-edit-motivo-section").style.display = "none";
            };

            document.getElementById("fechar-modal-func-ag-edit")?.addEventListener("click", fecharModalFuncAgEdit);
            document.getElementById("btn-func-ag-edit-fechar")?.addEventListener("click", fecharModalFuncAgEdit);

            abrirModalFuncAgEdit = async function(ag) {
                agAtivoFunc = ag;
                const editavel = ag.status === "Agendado";
                document.getElementById("func-ag-edit-titulo").textContent = `Agendamento #${ag.id}`;
                document.getElementById("func-ag-edit-cliente").textContent = ag.usuarioNome || "—";
                document.getElementById("func-ag-edit-pet").textContent = ag.petNome || "—";
                const servicos = await getServicos();
                const servList = (ag.servico || "").split(",").map(s => s.trim());
                renderCheckboxes("func-ag-edit-servicos", servicos, servList, !editavel);
                const inputData = document.getElementById("func-ag-edit-data");
                inputData.value = ag.data || "";
                inputData.disabled = !editavel;
                const selHora = document.getElementById("func-ag-edit-hora");
                selHora.value = ag.hora || "";
                selHora.disabled = !editavel;
                const txtObs = document.getElementById("func-ag-edit-obs");
                txtObs.value = ag.observacao || "";
                txtObs.disabled = !editavel;
                const motivoSection = document.getElementById("func-ag-edit-motivo-section");
                if (ag.status === "Cancelado" && ag.motivo) {
                    document.getElementById("func-ag-edit-motivo").textContent = ag.motivo;
                    motivoSection.style.display = "block";
                } else {
                    motivoSection.style.display = "none";
                }
                if (editavel) {
                    document.getElementById("func-ag-footer-esq").style.display = "flex";
                    document.getElementById("btn-func-ag-edit-salvar").style.display = "inline-flex";
                    document.getElementById("btn-func-ag-edit-fechar").style.display = "none";
                } else {
                    document.getElementById("func-ag-footer-esq").style.display = "none";
                    document.getElementById("btn-func-ag-edit-salvar").style.display = "none";
                    document.getElementById("btn-func-ag-edit-fechar").style.display = "inline-flex";
                }
                modalFuncAgEdit.classList.add("is-active");
            };

            document.getElementById("btn-func-ag-edit-salvar")?.addEventListener("click", async () => {
                if (!agAtivoFunc) return;
                const body = {
                    servico: [...document.querySelectorAll("#func-ag-edit-servicos input[type=checkbox]:checked")].map(c => c.value).join(", "),
                    data: document.getElementById("func-ag-edit-data").value,
                    hora: document.getElementById("func-ag-edit-hora").value,
                    observacao: document.getElementById("func-ag-edit-obs").value,
                };
                const r = await authFetch(`${BASE_URL}/api/agendamentos/${agAtivoFunc.id}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                if (r.ok) { toast("Agendamento atualizado!"); fecharModalFuncAgEdit(); carregarAgendaFunc(); }
                else toast("Erro ao salvar.", "danger");
            });

            document.getElementById("btn-func-ag-cancelar-inicio")?.addEventListener("click", () => {
                document.getElementById("func-ag-edit-form").classList.add("is-hidden");
                document.getElementById("func-ag-edit-cancel-confirm").classList.remove("is-hidden");
                document.getElementById("func-ag-footer-esq").style.display = "none";
                document.getElementById("func-ag-footer-dir").style.display = "none";
                document.getElementById("func-ag-edit-footer-confirm").style.display = "flex";
            });

            document.getElementById("btn-func-ag-voltar-form")?.addEventListener("click", () => {
                document.getElementById("func-ag-edit-form").classList.remove("is-hidden");
                document.getElementById("func-ag-edit-cancel-confirm").classList.add("is-hidden");
                document.getElementById("func-ag-edit-footer-confirm").style.display = "none";
                document.getElementById("func-ag-footer-esq").style.display = "flex";
                document.getElementById("func-ag-footer-dir").style.display = "flex";
                document.getElementById("btn-func-ag-edit-salvar").style.display = "inline-flex";
                document.getElementById("btn-func-ag-edit-fechar").style.display = "none";
            });

            document.getElementById("btn-func-ag-confirmar-cancel")?.addEventListener("click", async () => {
                const motivo = document.getElementById("func-ag-cancel-motivo").value.trim();
                if (!motivo) { toast("Informe o motivo do cancelamento.", "warning"); return; }
                if (!agAtivoFunc) return;
                const r = await authFetch(`${BASE_URL}/api/agendamentos/${agAtivoFunc.id}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "Cancelado", motivo })
                });
                if (r.ok) { toast("Agendamento cancelado."); fecharModalFuncAgEdit(); carregarAgendaFunc(); }
                else toast("Erro ao cancelar.", "danger");
            });

            if (isAtendente) {
            // Novo Agendamento modal
            const modalFuncNovoAg = document.getElementById("modal-func-novo-ag");
            const fecharModalFuncNovoAg = () => {
                modalFuncNovoAg.classList.remove("is-active");
                document.querySelectorAll("#func-novo-ag-servicos input[type=checkbox]").forEach(cb => cb.checked = false);
                const horaSelect = document.getElementById("func-novo-ag-hora");
                [...horaSelect.options].forEach(opt => { opt.disabled = false; if (opt.value) opt.text = opt.value; });
            };

            document.getElementById("fechar-modal-func-novo-ag")?.addEventListener("click", fecharModalFuncNovoAg);
            document.getElementById("cancelar-modal-func-novo-ag")?.addEventListener("click", fecharModalFuncNovoAg);

            setupBloqueioVetGeral("func-novo-ag-servicos");

            const _verificarFunc = () => verificarDisponibilidade({
                dataId: "func-novo-ag-data", horaId: "func-novo-ag-hora",
                servicosSelector: "#func-novo-ag-servicos", fetchServicos: getServicos
            });

            document.getElementById("func-novo-ag-data")?.addEventListener("change", _verificarFunc);
            document.getElementById("func-novo-ag-servicos")?.addEventListener("change", _verificarFunc);

            document.getElementById("btn-func-novo-ag")?.addEventListener("click", async () => {
                const selectCliente = document.getElementById("func-novo-ag-cliente");
                if (selectCliente.options.length === 1) {
                    authFetch(`${BASE_URL}/api/usuarios`)
                        .then(r => r.ok ? r.json() : [])
                        .then(usuarios => {
                            usuarios.filter(u => u.idRole === 2).forEach(u => {
                                const opt = document.createElement("option");
                                opt.value = u.id;
                                opt.textContent = u.nome;
                                selectCliente.appendChild(opt);
                            });
                        });
                }
                const servicos = await getServicos();
                renderCheckboxes("func-novo-ag-servicos", servicos, [], false);
                document.getElementById("func-novo-ag-data").min = new Date().toISOString().split("T")[0];
                modalFuncNovoAg.classList.add("is-active");
                _verificarFunc();
            });

            setupClientePetSelect("func-novo-ag-cliente", "func-novo-ag-pet");

            document.getElementById("btn-salvar-func-novo-ag")?.addEventListener("click", async () => {
                const usuarioId = document.getElementById("func-novo-ag-cliente").value;
                const petId = document.getElementById("func-novo-ag-pet").value;
                const servico = [...document.querySelectorAll("#func-novo-ag-servicos input[type=checkbox]:checked")].map(c => c.value).join(", ");
                const data = document.getElementById("func-novo-ag-data").value;
                const hora = document.getElementById("func-novo-ag-hora").value;
                const observacao = document.getElementById("func-novo-ag-observacao").value;
                if (!usuarioId || !petId || !servico || !data || !hora) {
                    toast("Selecione pelo menos um serviço e preencha todos os campos.", "warning"); return;
                }
                const r = await authFetch(`${BASE_URL}/api/agendamentos`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usuarioId: Number(usuarioId), petId: Number(petId), servico, data, hora, observacao })
                });
                if (r.ok) { toast("Agendamento criado com sucesso!"); fecharModalFuncNovoAg(); carregarAgendaFunc(); }
                else { const err = await r.json().catch(() => ({})); toast(err.mensagem || "Erro ao agendar.", "danger"); }
            });
            }
        }

        carregarAgendaFunc();
        setInterval(carregarAgendaFunc, 60000);

        document.getElementById("btn-sair-funcionario")?.addEventListener("click", logout);
    }

    // ================= CADASTRO PET =================

    if (document.getElementById("btn-cadastrar-pet")) {
        const usuarioId = localStorage.getItem("petgo_id");
        if (!usuarioId) { window.location.href = "login.html"; }

        const petEditId = new URLSearchParams(window.location.search).get("id");

        if (petEditId) {
            document.querySelector("h1.title").textContent = "Editar Pet";
            document.getElementById("btn-cadastrar-pet").textContent = "Salvar alterações";

            authFetch(`${BASE_URL}/api/pets/${petEditId}`)
                .then(r => r.ok ? r.json() : null)
                .then(pet => {
                    if (!pet) return;
                    document.getElementById("pet-nome").value = pet.nome || "";
                    document.getElementById("pet-raca").value = pet.raca || "";
                    document.getElementById("pet-porte").value = pet.porte || "";
                    document.getElementById("pet-sexo").value = pet.sexo || "";
                    document.getElementById("pet-idade").value = pet.idade || "";
                    document.getElementById("pet-observacao").value = pet.observacao || "";
                })
                .catch(() => {});

            const btnExcluirPet = document.createElement("button");
            btnExcluirPet.type = "button";
            btnExcluirPet.className = "button is-danger is-outlined";
            btnExcluirPet.textContent = "Excluir pet";
            const footerPet = document.getElementById("btn-cadastrar-pet").closest(".is-flex");
            footerPet.insertBefore(btnExcluirPet, document.getElementById("btn-cadastrar-pet"));

            btnExcluirPet.addEventListener("click", async () => {
                if (!confirm("Tem certeza que deseja excluir este pet?\nEsta ação não pode ser desfeita.")) return;
                try {
                    const r = await authFetch(`${BASE_URL}/api/pets/${petEditId}`, { method: "DELETE" });
                    if (r.ok) {
                        toast("Pet excluído com sucesso!");
                        setTimeout(() => window.location.href = "perfil.html#pets", 1500);
                    } else {
                        const err = await r.json().catch(() => ({}));
                        toast(err.mensagem || "Erro ao excluir pet.", "danger");
                    }
                } catch { toast("Erro ao conectar com o servidor.", "danger"); }
            });
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
                const url = petEditId ? `${BASE_URL}/api/pets/${petEditId}` : `${BASE_URL}/api/pets`;
                const method = petEditId ? "PUT" : "POST";
                const response = await authFetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    const petId = petEditId ? Number(petEditId) : (await response.json()).id;
                    const arquivo = document.getElementById("pet-inputImagem")?.files[0];
                    if (arquivo && petId) {
                        const fd = new FormData();
                        fd.append("imagem", arquivo);
                        await authFetch(`${BASE_URL}/api/pets/${petId}/imagem`, { method: "POST", body: fd });
                    }
                    toast(petEditId ? "Pet atualizado com sucesso!" : "Pet cadastrado com sucesso!");
                    setTimeout(() => window.location.href = "perfil.html#pets", 1500);
                } else {
                    const err = await response.json().catch(() => ({}));
                    toast(err.mensagem || "Erro ao salvar pet. Tente novamente.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });
    }

    // ================= AGENDAR =================

    if (document.getElementById("agendar-pet")) {
        const usuarioId = localStorage.getItem("petgo_id");
        if (!usuarioId) { window.location.href = "login.html"; }

        const agEditId = new URLSearchParams(window.location.search).get("id");

        if (agEditId) {
            document.querySelector("h1.title").textContent = "Editar Agendamento";
            document.getElementById("btn-agendar").textContent = "Salvar alterações";

            const btnCancelarAg = document.createElement("button");
            btnCancelarAg.type = "button";
            btnCancelarAg.className = "button is-danger is-outlined";
            btnCancelarAg.textContent = "Cancelar agendamento";
            const footerAg = document.getElementById("btn-agendar").closest(".is-flex");
            footerAg.insertBefore(btnCancelarAg, document.getElementById("btn-agendar"));

            btnCancelarAg.addEventListener("click", async () => {
                const motivo = prompt("Informe o motivo do cancelamento:");
                if (motivo === null) return;
                if (!motivo.trim()) { toast("Informe o motivo do cancelamento.", "warning"); return; }
                try {
                    const r = await authFetch(`${BASE_URL}/api/agendamentos/${agEditId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "Cancelado", motivo: motivo.trim() })
                    });
                    if (r.ok) {
                        toast("Agendamento cancelado.");
                        setTimeout(() => window.location.href = "perfil.html#agendamentos", 1500);
                    } else {
                        const err = await r.json().catch(() => ({}));
                        toast(err.mensagem || "Erro ao cancelar.", "danger");
                    }
                } catch { toast("Erro ao conectar com o servidor.", "danger"); }
            });
        }

        document.getElementById("agendar-data").min = new Date().toISOString().split("T")[0];

        let servicosAgendar = [];

        const petsP     = authFetch(`${BASE_URL}/api/pets/usuario/${usuarioId}`).then(r => r.ok ? r.json() : []).catch(() => []);
        const servicosP = fetch(`${BASE_URL}/api/servicos`).then(r => r.ok ? r.json() : []).catch(() => []);
        const agP       = agEditId
            ? authFetch(`${BASE_URL}/api/agendamentos/usuario/${usuarioId}`).then(r => r.ok ? r.json() : []).catch(() => [])
            : Promise.resolve(null);

        Promise.all([petsP, servicosP, agP]).then(([pets, servicos, ags]) => {
            const select = document.getElementById("agendar-pet");
            pets.forEach(pet => {
                const opt = document.createElement("option");
                opt.value = pet.id;
                opt.textContent = pet.nome;
                select.appendChild(opt);
            });

            servicosAgendar = servicos;
            renderCheckboxes("agendar-servicos", servicos, [], false);

            if (agEditId && ags) {
                const ag = ags.find(a => a.id === Number(agEditId));
                if (ag) {
                    select.value = ag.petId;
                    (ag.servico || "").split(",").map(s => s.trim()).forEach(nome => {
                        const cb = document.querySelector(`#agendar-servicos input[value="${nome}"]`);
                        if (cb) cb.checked = true;
                    });
                    const cbs = [...document.querySelectorAll("#agendar-servicos input[type=checkbox]")];
                    const checked = cbs.filter(cb => cb.checked);
                    if (checked.length > 0) {
                        const isVetSel = checked.some(cb => cb.dataset.isVet === "true");
                        cbs.forEach(cb => { if (!cb.checked) cb.disabled = (cb.dataset.isVet === "true") !== isVetSel; });
                    }
                    document.getElementById("agendar-data").value = ag.data;
                    document.getElementById("agendar-hora").value = ag.hora;
                    document.getElementById("agendar-observacao").value = ag.observacao || "";
                    _verificarAgendar();
                    atualizarDuracaoInfo();
                }
            }
        });

        const _verificarAgendar = () => verificarDisponibilidade({
            dataId: "agendar-data", horaId: "agendar-hora",
            servicosSelector: "#agendar-servicos",
            fetchServicos: () => Promise.resolve(servicosAgendar)
        });

        function atualizarDuracaoInfo() {
            const info = document.getElementById("agendar-duracao-info");
            if (!info) return;
            const selecionados = [...document.querySelectorAll("#agendar-servicos input[type=checkbox]:checked")].map(c => c.value);
            if (selecionados.length === 0) { info.classList.add("is-hidden"); return; }
            const totalDuracao = selecionados.reduce((sum, nome) => {
                const s = servicosAgendar.find(sv => sv.nome === nome);
                return sum + (s?.duracao || 60);
            }, 0);
            info.textContent = `Tempo estimado: ${totalDuracao} min`;
            info.classList.remove("is-hidden");
        }

        setupBloqueioVetGeral("agendar-servicos");
        document.getElementById("agendar-data")?.addEventListener("change", _verificarAgendar);
        document.getElementById("agendar-servicos")?.addEventListener("change", () => { _verificarAgendar(); atualizarDuracaoInfo(); });

        document.getElementById("btn-agendar")?.addEventListener("click", async () => {
            const petId = document.getElementById("agendar-pet").value;
            const servico = [...document.querySelectorAll("#agendar-servicos input[type=checkbox]:checked")].map(c => c.value).join(", ");
            const data = document.getElementById("agendar-data").value;
            const hora = document.getElementById("agendar-hora").value;
            const observacao = document.getElementById("agendar-observacao").value;

            if (!petId) { toast("Selecione um pet.", "warning"); return; }
            if (!servico) { toast("Selecione pelo menos um serviço.", "warning"); return; }
            if (!data || !hora) { toast("Informe a data e o horário.", "warning"); return; }

            const body = { usuarioId: Number(usuarioId), petId: Number(petId), servico, data, hora, observacao };

            try {
                const url = agEditId ? `${BASE_URL}/api/agendamentos/${agEditId}` : `${BASE_URL}/api/agendamentos`;
                const method = agEditId ? "PUT" : "POST";
                const response = await authFetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    window.location.href = "/perfil.html#agendamentos";
                } else {
                    const err = await response.json().catch(() => ({}));
                    toast(err.mensagem || "Erro ao salvar. Tente novamente.", "danger");
                }
            } catch {
                toast("Erro ao conectar com o servidor.", "danger");
            }
        });
    }

    // ================= CLIENTE DETALHE =================

    if (document.getElementById("cli-nome")) {
        const params = new URLSearchParams(window.location.search);
        const clienteId = params.get("id");
        if (!clienteId) window.location.href = "/admin.html";

        authFetch(`${BASE_URL}/api/usuarios/${clienteId}`)
            .then(r => r.ok ? r.json() : null)
            .then(u => {
                if (!u) {
                    document.getElementById("cli-nome").textContent = "Cliente não encontrado";
                    return;
                }
                document.title = `PetGO - ${u.nome}`;
                document.getElementById("cli-nome").textContent = u.nome || "—";
                document.getElementById("cli-email").textContent = u.email || "—";
                document.getElementById("cli-cpf").textContent = u.cpf || "—";
                document.getElementById("cli-nascimento").textContent = u.dataNascimento || "—";
                document.getElementById("cli-cep").textContent = u.cep || "—";
                document.getElementById("cli-numero").textContent = u.numero || "—";
                document.getElementById("cli-endereco").textContent = u.endereco || "—";
                document.getElementById("cli-telefone").textContent = u.telefone || "—";
                const foto = document.getElementById("cli-foto");
                foto.src = u.imagemUrl || `https://placehold.co/96x96?text=${(u.nome||"?")[0].toUpperCase()}`;
            });

        authFetch(`${BASE_URL}/api/pets/usuario/${clienteId}`)
            .then(r => r.ok ? r.json() : [])
            .then(pets => {
                const lista = document.getElementById("cli-pets-lista");
                const vazio = document.getElementById("cli-pets-vazio");
                if (!pets || pets.length === 0) { vazio.classList.remove("is-hidden"); return; }
                pets.forEach(p => {
                    const div = document.createElement("div");
                    div.className = "is-flex is-align-items-center mb-2";
                    div.style.gap = "0.75rem";
                    const img = document.createElement("img");
                    img.className = "is-rounded";
                    img.style.cssText = "width:40px;height:40px;object-fit:cover;border-radius:50%;flex-shrink:0;";
                    img.src = p.imagemUrl || `https://placehold.co/40x40?text=${(p.nome||"?")[0].toUpperCase()}`;
                    const info = document.createElement("span");
                    info.innerHTML = `<strong>${p.nome}</strong> <span class="has-text-grey">${p.raca || ""} · ${p.porte || ""} · ${p.sexo || ""}</span>`;
                    const link = document.createElement("a");
                    link.href = `/pet.html?id=${p.id}`;
                    link.className = "button is-small is-light ml-auto";
                    link.title = "Ver pet";
                    link.target = "_blank";
                    link.innerHTML = `<span class="icon"><i class="fas fa-eye"></i></span>`;
                    div.appendChild(img);
                    div.appendChild(info);
                    div.appendChild(link);
                    lista.appendChild(div);
                });
            });

        authFetch(`${BASE_URL}/api/agendamentos/usuario/${clienteId}`)
            .then(r => r.ok ? r.json() : [])
            .then(ags => {
                const tbody = document.getElementById("cli-ags-tbody");
                const vazio = document.getElementById("cli-ags-vazio");
                const hoje = new Date().toLocaleDateString("en-CA");
                const futuros = (ags || []).filter(ag => ag.data >= hoje);
                if (futuros.length === 0) { vazio.classList.remove("is-hidden"); return; }
                futuros.sort((a, b) => a.data.localeCompare(b.data) || (a.hora || "").localeCompare(b.hora || "")).forEach(ag => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${fmtData(ag.data)} ${ag.hora || ""}</td><td>${ag.petNome || "—"}</td><td>${ag.servico || "—"}</td><td>${tagStatus(ag.status)}</td>`;
                    tbody.appendChild(tr);
                });
            });
    }

    // ================= PET DETALHE =================

    if (document.getElementById("pet-foto") && !document.getElementById("admin-dashboard")) {
        const params = new URLSearchParams(window.location.search);
        const petId = params.get("id");
        if (!petId) window.location.href = "/admin.html";

        authFetch(`${BASE_URL}/api/pets/${petId}`)
            .then(r => r.ok ? r.json() : null)
            .then(pet => {
                if (!pet) return;
                document.title = `PetGO - ${pet.nome}`;
                document.getElementById("pet-nome").textContent = pet.nome || "—";
                document.getElementById("pet-raca").textContent = pet.raca || "—";
                document.getElementById("pet-porte").textContent = pet.porte || "—";
                document.getElementById("pet-sexo").textContent = pet.sexo || "—";
                document.getElementById("pet-idade").textContent = pet.idade || "—";
                document.getElementById("pet-obs").textContent = pet.observacao || "Nenhuma observação registrada.";
                const foto = document.getElementById("pet-foto");
                foto.src = pet.imagemUrl || `https://placehold.co/128x128?text=${(pet.nome||"?")[0].toUpperCase()}`;
                if (pet.usuarioId) {
                    authFetch(`${BASE_URL}/api/usuarios/${pet.usuarioId}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(u => {
                            if (u) {
                                document.getElementById("pet-tutor").textContent = u.nome;
                                const link = document.getElementById("pet-tutor-link");
                                link.href = `/cliente.html?id=${pet.usuarioId}`;
                                link.classList.remove("is-hidden");
                            }
                        });
                }
            });
    }

    // ================= FUNC DETALHE =================

    if (document.getElementById("func-ags-tbody")) {
        const params = new URLSearchParams(window.location.search);
        const funcDetId = params.get("id");
        if (!funcDetId) window.location.href = "/admin.html";

        authFetch(`${BASE_URL}/api/usuarios/${funcDetId}`)
            .then(r => r.ok ? r.json() : null)
            .then(u => {
                if (!u) return;
                document.title = `PetGO - ${u.nome}`;
                document.getElementById("func-nome").textContent = u.nome || "—";
                document.getElementById("func-cargo").textContent = u.cargo || "—";
                document.getElementById("func-email").textContent = u.email || "—";
                document.getElementById("func-cpf").textContent = u.cpf || "—";
                document.getElementById("func-nascimento").textContent = u.dataNascimento || "—";
                document.getElementById("func-telefone").textContent = u.telefone || "—";
                const foto = document.getElementById("func-foto");
                foto.src = u.imagemUrl || `https://placehold.co/96x96?text=${(u.nome||"?")[0].toUpperCase()}`;
            });

        authFetch(`${BASE_URL}/api/agendamentos/funcionario/${funcDetId}`)
            .then(r => r.ok ? r.json() : [])
            .then(ags => {
                const tbody = document.getElementById("func-ags-tbody");
                const vazio = document.getElementById("func-ags-vazio");
                if (!ags || ags.length === 0) { vazio.classList.remove("is-hidden"); return; }
                ags.sort((a, b) => b.data.localeCompare(a.data)).forEach(ag => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${fmtData(ag.data)} ${ag.hora || ""}</td><td>${ag.petNome || "—"}</td><td>${ag.servico || "—"}</td><td>${tagStatus(ag.status)}</td>`;
                    tbody.appendChild(tr);
                });
            });
    }

    // Dark mode toggle
    const LOGO_LIGHT = 'https://pub-ff62bf51a3fa432ab455c83ccd93e3a1.r2.dev/logo-vertical.png';
    const LOGO_DARK  = 'https://pub-ff62bf51a3fa432ab455c83ccd93e3a1.r2.dev/logo-vertical-branca.png';
    function aplicarTema(tema) {
        document.querySelectorAll('.btn-tema .icon-tema').forEach(el => {
            el.className = 'icon-tema fas ' + (tema === 'dark' ? 'fa-sun' : 'fa-moon');
        });
        document.querySelectorAll('.btn-tema .btn-tema-label').forEach(el => {
            el.textContent = tema === 'dark' ? 'Modo claro' : 'Modo escuro';
        });
        document.querySelectorAll('.petgo-logo').forEach(img => {
            img.src = tema === 'dark' ? LOGO_DARK : LOGO_LIGHT;
        });
    }
    aplicarTema(localStorage.getItem('petgo-theme') || 'light');
    document.querySelectorAll('.btn-tema').forEach(btn => {
        btn.addEventListener('click', () => {
            const novo = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', novo);
            localStorage.setItem('petgo-theme', novo);
            aplicarTema(novo);
        });
    });

});
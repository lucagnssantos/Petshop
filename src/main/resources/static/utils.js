function fmtData(data) {
    if (!data) return "—";
    const [a, m, d] = data.split("-");
    return `${d}/${m}/${a}`;
}

function tagStatus(status) {
    const cor = status === "Concluído" ? "is-success" : status === "Cancelado" ? "is-danger" : "is-primary";
    return `<span class="tag ${cor} is-light">${status || "Agendado"}</span>`;
}

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

function validarNomeValor(nome) {
    const v = (nome || "").trim();
    if (!v) return { valido: false, mensagem: "Nome obrigatório." };
    if (v.length < 3) return { valido: false, mensagem: "Nome muito curto." };
    return { valido: true, mensagem: "" };
}

function validarCpfValor(cpf) {
    const v = cpf || "";
    if (!v) return { valido: false, mensagem: "CPF obrigatório." };
    if (!cpfValido(v)) return { valido: false, mensagem: "CPF inválido." };
    return { valido: true, mensagem: "" };
}

function validarEmailValor(email) {
    const v = (email || "").trim();
    if (!v) return { valido: false, mensagem: "E-mail obrigatório." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { valido: false, mensagem: "E-mail inválido." };
    return { valido: true, mensagem: "" };
}

function validarSenhaValor(senha) {
    const v = senha || "";
    if (!v) return { valido: false, mensagem: "Senha obrigatória." };
    if (v.length < 6) return { valido: false, mensagem: "Mínimo 6 caracteres." };
    if (!/[A-Z]/.test(v)) return { valido: false, mensagem: "Deve conter letra maiúscula." };
    if (!/[0-9]/.test(v)) return { valido: false, mensagem: "Deve conter um número." };
    if (!/[^A-Za-z0-9]/.test(v)) return { valido: false, mensagem: "Deve conter um símbolo." };
    return { valido: true, mensagem: "" };
}

function validarTelefoneValor(telefone) {
    const v = (telefone || "").replace(/\D/g, "");
    if (!v) return { valido: false, mensagem: "Telefone obrigatório." };
    if (v.length < 10) return { valido: false, mensagem: "Telefone inválido." };
    return { valido: true, mensagem: "" };
}

function validarDataValor(data) {
    const v = data || "";
    if (!v) return { valido: false, mensagem: "Data obrigatória." };
    const [d, m, a] = v.split("/").map(Number);
    const dt = new Date(a, m - 1, d);
    if (isNaN(dt) || dt.getDate() !== d || dt.getMonth() !== m - 1 || a < 1900 || a > new Date().getFullYear()) {
        return { valido: false, mensagem: "Data inválida." };
    }
    return { valido: true, mensagem: "" };
}

function validarCepValor(cep) {
    const v = (cep || "").replace(/\D/g, "");
    if (!v) return { valido: false, mensagem: "CEP obrigatório." };
    if (v.length !== 8) return { valido: false, mensagem: "CEP inválido." };
    return { valido: true, mensagem: "" };
}

if (typeof module !== "undefined") {
    module.exports = {
        fmtData, tagStatus, cpfValido,
        validarNomeValor, validarCpfValor, validarEmailValor,
        validarSenhaValor, validarTelefoneValor, validarDataValor, validarCepValor
    };
}

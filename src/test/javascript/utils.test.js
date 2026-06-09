const {
    fmtData, tagStatus, cpfValido,
    validarNomeValor, validarCpfValor, validarEmailValor,
    validarSenhaValor, validarTelefoneValor, validarDataValor, validarCepValor
} = require("../../main/resources/static/utils.js");

// ── fmtData ──────────────────────────────────────────────────────────────────
describe("fmtData", () => {
    test("converte yyyy-MM-dd para dd/MM/yyyy", () => {
        expect(fmtData("2024-07-15")).toBe("15/07/2024");
    });
    test("retorna '—' para valor nulo", () => {
        expect(fmtData(null)).toBe("—");
    });
    test("retorna '—' para string vazia", () => {
        expect(fmtData("")).toBe("—");
    });
    test("mantém zeros à esquerda", () => {
        expect(fmtData("2024-01-05")).toBe("05/01/2024");
    });
});

// ── tagStatus ─────────────────────────────────────────────────────────────────
describe("tagStatus", () => {
    test("status Concluído usa cor is-success", () => {
        expect(tagStatus("Concluído")).toContain("is-success");
        expect(tagStatus("Concluído")).toContain("Concluído");
    });
    test("status Cancelado usa cor is-danger", () => {
        expect(tagStatus("Cancelado")).toContain("is-danger");
        expect(tagStatus("Cancelado")).toContain("Cancelado");
    });
    test("status Agendado usa cor is-primary", () => {
        expect(tagStatus("Agendado")).toContain("is-primary");
    });
    test("status vazio exibe 'Agendado'", () => {
        expect(tagStatus("")).toContain("Agendado");
    });
    test("status nulo exibe 'Agendado'", () => {
        expect(tagStatus(null)).toContain("Agendado");
    });
});

// ── cpfValido ─────────────────────────────────────────────────────────────────
describe("cpfValido", () => {
    test("aceita CPF válido formatado", () => {
        expect(cpfValido("529.982.247-25")).toBe(true);
    });
    test("aceita CPF válido sem formatação", () => {
        expect(cpfValido("52998224725")).toBe(true);
    });
    test("rejeita CPF com todos dígitos iguais", () => {
        expect(cpfValido("111.111.111-11")).toBe(false);
    });
    test("rejeita CPF com tamanho errado", () => {
        expect(cpfValido("123.456.789")).toBe(false);
    });
    test("rejeita CPF com dígito verificador errado", () => {
        expect(cpfValido("529.982.247-26")).toBe(false);
    });
});

// ── validarNomeValor ──────────────────────────────────────────────────────────
describe("validarNomeValor", () => {
    test("aceita nome válido", () => {
        expect(validarNomeValor("João Silva").valido).toBe(true);
    });
    test("rejeita nome vazio", () => {
        const r = validarNomeValor("");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Nome obrigatório.");
    });
    test("rejeita nome muito curto", () => {
        const r = validarNomeValor("Ab");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Nome muito curto.");
    });
    test("rejeita nome nulo", () => {
        expect(validarNomeValor(null).valido).toBe(false);
    });
    test("aceita nome com exatamente 3 caracteres", () => {
        expect(validarNomeValor("Ana").valido).toBe(true);
    });
});

// ── validarCpfValor ───────────────────────────────────────────────────────────
describe("validarCpfValor", () => {
    test("aceita CPF válido", () => {
        expect(validarCpfValor("529.982.247-25").valido).toBe(true);
    });
    test("rejeita CPF vazio", () => {
        const r = validarCpfValor("");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("CPF obrigatório.");
    });
    test("rejeita CPF inválido", () => {
        const r = validarCpfValor("111.111.111-11");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("CPF inválido.");
    });
    test("rejeita CPF nulo", () => {
        expect(validarCpfValor(null).valido).toBe(false);
    });
});

// ── validarEmailValor ─────────────────────────────────────────────────────────
describe("validarEmailValor", () => {
    test("aceita e-mail válido", () => {
        expect(validarEmailValor("joao@email.com").valido).toBe(true);
    });
    test("rejeita e-mail sem @", () => {
        expect(validarEmailValor("joaoemail.com").valido).toBe(false);
    });
    test("rejeita e-mail sem domínio", () => {
        expect(validarEmailValor("joao@").valido).toBe(false);
    });
    test("rejeita e-mail vazio", () => {
        const r = validarEmailValor("");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("E-mail obrigatório.");
    });
    test("rejeita e-mail nulo", () => {
        expect(validarEmailValor(null).valido).toBe(false);
    });
    test("aceita e-mail com subdomínio", () => {
        expect(validarEmailValor("teste@mail.empresa.com").valido).toBe(true);
    });
});

// ── validarSenhaValor ─────────────────────────────────────────────────────────
describe("validarSenhaValor", () => {
    test("aceita senha válida", () => {
        expect(validarSenhaValor("Senha1!").valido).toBe(true);
    });
    test("rejeita senha vazia", () => {
        expect(validarSenhaValor("").valido).toBe(false);
    });
    test("rejeita senha curta", () => {
        const r = validarSenhaValor("Ab1!");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Mínimo 6 caracteres.");
    });
    test("rejeita senha sem maiúscula", () => {
        const r = validarSenhaValor("senha1!");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Deve conter letra maiúscula.");
    });
    test("rejeita senha sem número", () => {
        const r = validarSenhaValor("SenhaSem!");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Deve conter um número.");
    });
    test("rejeita senha sem símbolo", () => {
        const r = validarSenhaValor("Senha123");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Deve conter um símbolo.");
    });
    test("rejeita senha nula", () => {
        expect(validarSenhaValor(null).valido).toBe(false);
    });
});

// ── validarTelefoneValor ──────────────────────────────────────────────────────
describe("validarTelefoneValor", () => {
    test("aceita telefone celular formatado", () => {
        expect(validarTelefoneValor("(11) 99999-9999").valido).toBe(true);
    });
    test("aceita telefone fixo", () => {
        expect(validarTelefoneValor("(11) 3333-3333").valido).toBe(true);
    });
    test("rejeita telefone vazio", () => {
        const r = validarTelefoneValor("");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Telefone obrigatório.");
    });
    test("rejeita telefone curto", () => {
        const r = validarTelefoneValor("(11) 999");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Telefone inválido.");
    });
    test("rejeita telefone nulo", () => {
        expect(validarTelefoneValor(null).valido).toBe(false);
    });
});

// ── validarDataValor ──────────────────────────────────────────────────────────
describe("validarDataValor", () => {
    test("aceita data válida", () => {
        expect(validarDataValor("15/03/1990").valido).toBe(true);
    });
    test("rejeita data vazia", () => {
        const r = validarDataValor("");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("Data obrigatória.");
    });
    test("rejeita data com mês inválido", () => {
        expect(validarDataValor("01/13/1990").valido).toBe(false);
    });
    test("rejeita data com ano anterior a 1900", () => {
        expect(validarDataValor("01/01/1899").valido).toBe(false);
    });
    test("rejeita dia 31 em mês com 30 dias", () => {
        expect(validarDataValor("31/04/2000").valido).toBe(false);
    });
    test("rejeita data nula", () => {
        expect(validarDataValor(null).valido).toBe(false);
    });
});

// ── validarCepValor ───────────────────────────────────────────────────────────
describe("validarCepValor", () => {
    test("aceita CEP formatado", () => {
        expect(validarCepValor("12345-678").valido).toBe(true);
    });
    test("aceita CEP sem formatação", () => {
        expect(validarCepValor("12345678").valido).toBe(true);
    });
    test("rejeita CEP vazio", () => {
        const r = validarCepValor("");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("CEP obrigatório.");
    });
    test("rejeita CEP com dígitos insuficientes", () => {
        const r = validarCepValor("1234-567");
        expect(r.valido).toBe(false);
        expect(r.mensagem).toBe("CEP inválido.");
    });
    test("rejeita CEP nulo", () => {
        expect(validarCepValor(null).valido).toBe(false);
    });
});

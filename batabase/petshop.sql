
-- =====================================
-- CRIAÇÃO DO BANCO
-- =====================================

CREATE DATABASE petshop3;
USE petshop3;

-- =====================================
-- TABELA ROLE
-- =====================================

CREATE TABLE role (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

-- =====================================
-- TABELA USUARIO
-- =====================================

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(15),
    endereco VARCHAR(200),
    foto VARCHAR(255),

    id_role INT NOT NULL,

    FOREIGN KEY (id_role)
    REFERENCES role(id_role)
    ON UPDATE CASCADE
);

-- =====================================
-- TABELA PET
-- =====================================

CREATE TABLE pet (
    id_pet INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(50),
    idade INT,
    peso DECIMAL(5,2),

    id_dono INT NOT NULL,

    FOREIGN KEY (id_dono)
    REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =====================================
-- TABELA SERVICO
-- =====================================

CREATE TABLE servico (
    id_servico INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL
);

-- =====================================
-- TABELA AGENDAMENTO
-- =====================================

CREATE TABLE agendamento (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    hora TIME NOT NULL,

    id_pet INT NOT NULL,
    id_funcionario INT NOT NULL,

    FOREIGN KEY (id_pet)
    REFERENCES pet(id_pet)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (id_funcionario)
    REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =====================================
-- TABELA AGENDAMENTO_SERVICO
-- =====================================

CREATE TABLE agendamento_servico (
    id_agendamento INT NOT NULL,
    id_servico INT NOT NULL,

    PRIMARY KEY (id_agendamento, id_servico),

    FOREIGN KEY (id_agendamento)
    REFERENCES agendamento(id_agendamento)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (id_servico)
    REFERENCES servico(id_servico)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =====================================
-- TABELA PRODUTO
-- =====================================

CREATE TABLE produto (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0
);

-- =====================================
-- TABELA VENDA
-- =====================================

CREATE TABLE venda (
    id_venda INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,

    id_usuario INT NOT NULL,

    FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =====================================
-- TABELA ITEM_VENDA
-- =====================================

CREATE TABLE item_venda (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_venda INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,

    FOREIGN KEY (id_venda)
    REFERENCES venda(id_venda)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (id_produto)
    REFERENCES produto(id_produto)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

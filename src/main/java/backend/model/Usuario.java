package backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nome;
    private String cpf;
    private String dataNascimento;
    private String cep;
    private String endereco;
    private String numero;
    private String email;
    private String senha;

    // Nível de acesso: 1 = Admin, 2 = Cliente, 3 = Funcionário
    @Column(name = "id_role")
    private Integer idRole = 2;

    private String cargo;

    @Lob
    @Column(name = "imagem")
    @JsonIgnore
    private byte[] imagem;

    // Construtor vazio (obrigatório para o JPA)
    public Usuario() {}

    // Getters e Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public String getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(String dataNascimento) { this.dataNascimento = dataNascimento; }

    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }

    public Integer getIdRole() { return idRole; }
    public void setIdRole(Integer idRole) { this.idRole = idRole; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public byte[] getImagem() { return imagem; }
    public void setImagem(byte[] imagem) { this.imagem = imagem; }
}
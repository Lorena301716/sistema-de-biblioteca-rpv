import { useEffect, useState } from "react";
import Link from "next/link";

interface Estatisticas {
  totalLivros: number;
  totalUsuarios: number;
  totalEmprestimos: number;
  emprestimosAtivos: number;
  livrosDisponiveis: number;
}

export default function Home() {
  const [stats, setStats] = useState<Estatisticas>({
    totalLivros: 0,
    totalUsuarios: 0,
    totalEmprestimos: 0,
    emprestimosAtivos: 0,
    livrosDisponiveis: 0,
  });
  const [loading, setLoading] = useState(true);
  const [novoLivro, setNovoLivro] = useState({
    titulo: "",
    autor: "",
    genero: "",
    quantidade: "",
  });
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    telefone: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro" | "">("");

  // Buscar estatísticas
  useEffect(() => {
    const buscarEstatisticas = async () => {
      try {
        const [resLivros, resUsuarios, resEmprestimos] = await Promise.all([
          fetch("/api/list/livros"),
          fetch("/api/list/usuarios"),
          fetch("/api/list/emprestimos"),
        ]);

        const dataLivros = await resLivros.json();
        const dataUsuarios = await resUsuarios.json();
        const dataEmprestimos = await resEmprestimos.json();

        const livros = dataLivros.livros || [];
        const usuarios = dataUsuarios.usuarios || [];
        const emprestimos = dataEmprestimos.emprestimos || [];

        const livrosDisponiveis = livros.reduce(
          (acc, livro) => acc + (livro.quantidade - livro.qtdEmprestados),
          0
        );

        const emprestimosAtivos = emprestimos.filter(
          (e) => e.status === "ativo"
        ).length;

        setStats({
          totalLivros: livros.length,
          totalUsuarios: usuarios.length,
          totalEmprestimos: emprestimos.length,
          emprestimosAtivos,
          livrosDisponiveis,
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarEstatisticas();
  }, []);

  const handleAdicionarLivro = async (e) => {
    e.preventDefault();

    if (!novoLivro.titulo || !novoLivro.autor || !novoLivro.genero || !novoLivro.quantidade) {
      setMensagem("Preencha todos os campos do livro");
      setTipoMensagem("erro");
      return;
    }

    try {
      const response = await fetch("/api/create/livros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: novoLivro.titulo,
          autor: novoLivro.autor,
          genero: novoLivro.genero,
          quantidade: parseInt(novoLivro.quantidade),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem(data.mensagem || "Erro ao adicionar livro");
        setTipoMensagem("erro");
      } else {
        setMensagem("Livro adicionado com sucesso!");
        setTipoMensagem("sucesso");
        setNovoLivro({ titulo: "", autor: "", genero: "", quantidade: "" });

        // Atualizar estatísticas
        const resLivros = await fetch("/api/list/livros");
        const dataLivros = await resLivros.json();
        const livros = dataLivros.livros || [];
        const livrosDisponiveis = livros.reduce(
          (acc, livro) => acc + (livro.quantidade - livro.qtdEmprestados),
          0
        );

        setStats((prev) => ({
          ...prev,
          totalLivros: livros.length,
          livrosDisponiveis,
        }));
      }
    } catch (error) {
      console.error("Erro ao adicionar livro:", error);
      setMensagem("Erro ao adicionar livro");
      setTipoMensagem("erro");
    }

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  };

  const handleAdicionarUsuario = async (e) => {
    e.preventDefault();

    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.telefone) {
      setMensagem("Preencha todos os campos do usuário");
      setTipoMensagem("erro");
      return;
    }

    try {
      const response = await fetch("/api/create/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUsuario),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem(data.mensagem || "Erro ao adicionar usuário");
        setTipoMensagem("erro");
      } else {
        setMensagem("Usuário adicionado com sucesso!");
        setTipoMensagem("sucesso");
        setNovoUsuario({ nome: "", email: "", telefone: "" });

        // Atualizar estatísticas
        const resUsuarios = await fetch("/api/list/usuarios");
        const dataUsuarios = await resUsuarios.json();
        const usuarios = dataUsuarios.usuarios || [];

        setStats((prev) => ({
          ...prev,
          totalUsuarios: usuarios.length,
        }));
      }
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      setMensagem("Erro ao adicionar usuário");
      setTipoMensagem("erro");
    }

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  };

  return (
    <div className="container-home">
      <header className="header">
        <h1>📚 Sistema de Biblioteca</h1>
        <p>Gerenciamento completo de empréstimos e devoluções</p>
      </header>

      {mensagem && (
        <div className={`mensagem ${tipoMensagem}`}>
          {mensagem}
          <button
            onClick={() => {
              setMensagem("");
              setTipoMensagem("");
            }}
            className="fechar-mensagem"
          >
            ✕
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <section className="stats">
        <div className="stat-card">
          <h3>{stats.totalLivros}</h3>
          <p>Livros Cadastrados</p>
        </div>
        <div className="stat-card">
          <h3>{stats.livrosDisponiveis}</h3>
          <p>Livros Disponíveis</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalUsuarios}</h3>
          <p>Usuários Registrados</p>
        </div>
        <div className="stat-card">
          <h3>{stats.emprestimosAtivos}</h3>
          <p>Empréstimos Ativos</p>
        </div>
      </section>

      {/* Botão Principal */}
      <div className="acesso-rapido">
        <Link href="/emprestimos" className="btn btn-grande btn-primary">
          Gerenciar Empréstimos e Devoluções
        </Link>
      </div>

      {/* Seção de Cadastros */}
      <section className="secao-cadastros">
        <div className="cadastro-box">
          <h2>📖 Adicionar Novo Livro</h2>
          <form onSubmit={handleAdicionarLivro} className="formulario">
            <input
              type="text"
              placeholder="Título"
              value={novoLivro.titulo}
              onChange={(e) =>
                setNovoLivro({ ...novoLivro, titulo: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Autor"
              value={novoLivro.autor}
              onChange={(e) =>
                setNovoLivro({ ...novoLivro, autor: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Gênero"
              value={novoLivro.genero}
              onChange={(e) =>
                setNovoLivro({ ...novoLivro, genero: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Quantidade"
              min="1"
              value={novoLivro.quantidade}
              onChange={(e) =>
                setNovoLivro({ ...novoLivro, quantidade: e.target.value })
              }
              required
            />
            <button type="submit" className="btn btn-sucesso">
              Adicionar Livro
            </button>
          </form>
        </div>

        <div className="cadastro-box">
          <h2>👤 Adicionar Novo Usuário</h2>
          <form onSubmit={handleAdicionarUsuario} className="formulario">
            <input
              type="text"
              placeholder="Nome Completo"
              value={novoUsuario.nome}
              onChange={(e) =>
                setNovoUsuario({ ...novoUsuario, nome: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="E-mail"
              value={novoUsuario.email}
              onChange={(e) =>
                setNovoUsuario({ ...novoUsuario, email: e.target.value })
              }
              required
            />
            <input
              type="tel"
              placeholder="Telefone"
              value={novoUsuario.telefone}
              onChange={(e) =>
                setNovoUsuario({ ...novoUsuario, telefone: e.target.value })
              }
              required
            />
            <button type="submit" className="btn btn-sucesso">
              Adicionar Usuário
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

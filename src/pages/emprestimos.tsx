import { useEffect, useState } from "react";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

interface Livro {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  quantidade: number;
  qtdEmprestados: number;
}

interface Emprestimo {
  id: string;
  usuarioId: string;
  livrosIds: string[];
  dataEmprestimo: string;
  dataDevolucao: string | null;
  status: "ativo" | "concluído";
}

export default function Emprestimos() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>("");
  const [livrosSelecionados, setLivrosSelecionados] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro" | "">("");
  const [aba, setAba] = useState<"emprestar" | "devolver">("emprestar");

  // Buscar dados iniciais
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const [resUsuarios, resLivros, resEmprestimos] = await Promise.all([
          fetch("/api/list/usuarios"),
          fetch("/api/list/livros"),
          fetch("/api/list/emprestimos"),
        ]);

        const dataUsuarios = await resUsuarios.json();
        const dataLivros = await resLivros.json();
        const dataEmprestimos = await resEmprestimos.json();

        setUsuarios(dataUsuarios.usuarios || []);
        setLivros(dataLivros.livros || []);
        setEmprestimos(dataEmprestimos.emprestimos || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setMensagem("Erro ao carregar dados");
        setTipoMensagem("erro");
      }
    };

    buscarDados();
  }, []);

  const handleSelecionarLivro = (livroId: string) => {
    const novo = new Set(livrosSelecionados);
    if (novo.has(livroId)) {
      novo.delete(livroId);
    } else {
      novo.add(livroId);
    }
    setLivrosSelecionados(novo);
  };

  const handleEmprestar = async () => {
    if (!usuarioSelecionado) {
      setMensagem("Selecione um usuário");
      setTipoMensagem("erro");
      return;
    }

    if (livrosSelecionados.size === 0) {
      setMensagem("Selecione pelo menos um livro");
      setTipoMensagem("erro");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/emprestar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuarioSelecionado,
          livrosIds: Array.from(livrosSelecionados),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem(data.mensagem || "Erro ao emprestar livros");
        setTipoMensagem("erro");
      } else {
        setMensagem("Livros emprestados com sucesso!");
        setTipoMensagem("sucesso");
        setUsuarioSelecionado("");
        setLivrosSelecionados(new Set());

        // Atualizar dados
        const [resLivros, resEmprestimos] = await Promise.all([
          fetch("/api/list/livros"),
          fetch("/api/list/emprestimos"),
        ]);

        const dataLivros = await resLivros.json();
        const dataEmprestimos = await resEmprestimos.json();

        setLivros(dataLivros.livros || []);
        setEmprestimos(dataEmprestimos.emprestimos || []);
      }
    } catch (error) {
      console.error("Erro ao emprestar:", error);
      setMensagem("Erro ao emprestar livros");
      setTipoMensagem("erro");
    } finally {
      setLoading(false);
    }
  };

  const handleDevolver = async (emprestimoId: string) => {
    const emprestimo = emprestimos.find((e) => e.id === emprestimoId);
    if (!emprestimo) return;

    setLoading(true);

    try {
      const response = await fetch("/api/devolver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emprestimoId,
          livrosIds: emprestimo.livrosIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem(data.mensagem || "Erro ao devolver livros");
        setTipoMensagem("erro");
      } else {
        setMensagem("Livros devolvidos com sucesso!");
        setTipoMensagem("sucesso");

        // Atualizar dados
        const [resLivros, resEmprestimos] = await Promise.all([
          fetch("/api/list/livros"),
          fetch("/api/list/emprestimos"),
        ]);

        const dataLivros = await resLivros.json();
        const dataEmprestimos = await resEmprestimos.json();

        setLivros(dataLivros.livros || []);
        setEmprestimos(dataEmprestimos.emprestimos || []);
      }
    } catch (error) {
      console.error("Erro ao devolver:", error);
      setMensagem("Erro ao devolver livros");
      setTipoMensagem("erro");
    } finally {
      setLoading(false);
    }
  };

  const obterNomeUsuario = (usuarioId: string) => {
    return usuarios.find((u) => u.id === usuarioId)?.nome || "Usuário desconhecido";
  };

  const obterLivrosEmprestimo = (livrosIds: string[]) => {
    return livrosIds
      .map((id) => livros.find((l) => l.id === id)?.titulo || "Livro desconhecido")
      .join(", ");
  };

  const emprestimosAtivos = emprestimos.filter((e) => e.status === "ativo");

  return (
    <div className="container">
      <h1>Sistema de Biblioteca</h1>

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

      <div className="abas">
        <button
          className={`aba ${aba === "emprestar" ? "ativa" : ""}`}
          onClick={() => setAba("emprestar")}
        >
          Emprestar Livros
        </button>
        <button
          className={`aba ${aba === "devolver" ? "ativa" : ""}`}
          onClick={() => setAba("devolver")}
        >
          Devolver Livros
        </button>
      </div>

      {aba === "emprestar" && (
        <div className="secao emprestar">
          <h2>Emprestar Livros</h2>

          <div className="formulario">
            <div className="grupo">
              <label htmlFor="usuario">Selecione um usuário:</label>
              <select
                id="usuario"
                value={usuarioSelecionado}
                onChange={(e) => setUsuarioSelecionado(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Selecione um usuário --</option>
                {usuarios.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grupo">
              <label>Selecione os livros:</label>
              <div className="lista-livros">
                {livros.map((livro) => {
                  const disponivel = livro.quantidade - livro.qtdEmprestados;
                  return (
                    <div key={livro.id} className="livro-item">
                      <input
                        type="checkbox"
                        id={`livro-${livro.id}`}
                        checked={livrosSelecionados.has(livro.id)}
                        onChange={() => handleSelecionarLivro(livro.id)}
                        disabled={disponivel <= 0 || loading}
                      />
                      <label htmlFor={`livro-${livro.id}`} className="livro-label">
                        <strong>{livro.titulo}</strong>
                        <p>Autor: {livro.autor}</p>
                        <p>Gênero: {livro.genero}</p>
                        <p className={disponivel <= 0 ? "indisponivel" : "disponivel"}>
                          Disponível: {disponivel} de {livro.quantidade}
                        </p>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              className="btn btn-emprestar"
              onClick={handleEmprestar}
              disabled={loading || !usuarioSelecionado || livrosSelecionados.size === 0}
            >
              {loading ? "Processando..." : "Emprestar Livros Selecionados"}
            </button>
          </div>
        </div>
      )}

      {aba === "devolver" && (
        <div className="secao devolver">
          <h2>Devolver Livros</h2>

          {emprestimosAtivos.length === 0 ? (
            <p className="sem-emprestimos">Nenhum empréstimo ativo no momento.</p>
          ) : (
            <div className="lista-emprestimos">
              {emprestimosAtivos.map((emprestimo) => (
                <div key={emprestimo.id} className="emprestimo-item">
                  <div className="emprestimo-info">
                    <h3>{obterNomeUsuario(emprestimo.usuarioId)}</h3>
                    <p>
                      <strong>Livros:</strong> {obterLivrosEmprestimo(emprestimo.livrosIds)}
                    </p>
                    <p>
                      <strong>Data de Empréstimo:</strong>{" "}
                      {new Date(emprestimo.dataEmprestimo).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    className="btn btn-devolver"
                    onClick={() => handleDevolver(emprestimo.id)}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Devolver Livros"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

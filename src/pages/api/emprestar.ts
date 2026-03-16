import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextApiRequest, NextApiResponse } from "next";

const filePath = path.join(process.cwd(), "src", "pages", "api", "bd.json");

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ mensagem: "Método não permitido." });
  }

  const jsonData = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(jsonData);

  const usuarios: Usuario[] = parsed.usuarios || [];
  const livros: Livro[] = parsed.livros || [];
  const emprestimos: Emprestimo[] = parsed.emprestimos || [];

  const { usuarioId, livrosIds } = req.body;

  // Validar entrada
  if (!usuarioId || !livrosIds || livrosIds.length === 0) {
    return res.status(400).json({ mensagem: "usuarioId e livrosIds são obrigatórios." });
  }

  // verificar se usuario existe
  const usuario = usuarios.find((u: Usuario) => u.id === usuarioId);
  if (!usuario) {
    return res.status(400).json({ mensagem: "Usuário não encontrado." });
  }

  // verificar se livros existem
  const livrosSelecionados = livrosIds.map((id: string) =>
    livros.find((l: Livro) => l.id === id)
  );

  if (livrosSelecionados.includes(undefined)) {
    return res.status(400).json({ mensagem: "Um ou mais livros não existem." });
  }

  // verificar disponibilidade
  for (let livro of livrosSelecionados) {
    if (!livro) continue;
    const disponivel = livro.quantidade - livro.qtdEmprestados;
    if (disponivel <= 0) {
      return res.status(400).json({
        mensagem: `Livro "${livro.titulo}" não está disponível.`,
      });
    }
  }

  // criar novo empréstimo
  const novoEmprestimo = {
    id: uuidv4(),
    usuarioId,
    livrosIds,
    dataEmprestimo: new Date().toISOString(),
    dataDevolucao: null,
    status: "ativo" as const,
  };

  // incrementar qtdEmprestados para cada livro
  livrosIds.forEach((id: string) => {
    const livro = livros.find((l: Livro) => l.id === id);
    if (livro) {
      livro.qtdEmprestados += 1;
    }
  });

  emprestimos.push(novoEmprestimo);

  // salvar no arquivo
  fs.writeFileSync(
    filePath,
    JSON.stringify({ ...parsed, livros, emprestimos }, null, 2)
  );

  res.status(200).json({
    mensagem: "Empréstimo realizado com sucesso!",
    emprestimo: novoEmprestimo,
  });
}
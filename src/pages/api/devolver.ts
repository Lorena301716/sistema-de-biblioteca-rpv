import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

const filePath = path.join(process.cwd(), "src", "pages", "api", "bd.json");

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
  const jsonData = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(jsonData);

  const livros: Livro[] = parsed.livros || [];
  const emprestimos: Emprestimo[] = parsed.emprestimos || [];

  const { emprestimoId, livrosIds } = req.body;

  // localizar empréstimo
  const emprestimo = emprestimos.find((e: Emprestimo) => e.id === emprestimoId);

  if (!emprestimo || emprestimo.status !== "ativo") {
    return res.status(400).json({ mensagem: "Empréstimo não encontrado ou já concluído." });
  }

  // verificar se os livros pertencem ao empréstimo
  for (let id of livrosIds) {
    if (!emprestimo.livrosIds.includes(id)) {
      return res.status(400).json({
        mensagem: "Um dos livros não pertence a este empréstimo.",
      });
    }
  }

  // atualizar qtdEmprestados
  livrosIds.forEach((id: string) => {
    const livro = livros.find((l: Livro) => l.id === id);
    if (livro && livro.qtdEmprestados > 0) {
      livro.qtdEmprestados -= 1;
    }
  });

  // verificar se todos os livros foram devolvidos
  const todosDevolvidos = emprestimo.livrosIds.every(
    (id: string) => livrosIds.includes(id)
  );

  if (todosDevolvidos) {
    emprestimo.status = "concluído";
    emprestimo.dataDevolucao = new Date().toISOString();
  }

  fs.writeFileSync(
    filePath,
    JSON.stringify({ ...parsed, livros, emprestimos }, null, 2)
  );

  res.status(200).json({
    mensagem: "Devolução realizada com sucesso.",
    emprestimo,
  });
}
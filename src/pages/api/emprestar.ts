import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const filePath = path.join(process.cwd(), "src", "pages", "api", "bd.json");

export default function handler(req, res) {
  const jsonData = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(jsonData);

  const usuarios = parsed.usuarios || [];
  const livros = parsed.livros || [];
  const emprestimos = parsed.emprestimos || [];

  const { usuarioId, livrosIds, dataEmprestimo } = req.body;

  // verificar se usuario existe
  const usuario = usuarios.find((u) => u.id === usuarioId);
  if (!usuario) {
    return res.status(400).json({ mensagem: "Usuário não encontrado." });
  }

  // verificar se livros existem
  const livrosSelecionados = livrosIds.map((id) =>
    livros.find((l) => l.id === id)
  );

  if (livrosSelecionados.includes(undefined)) {
    return res.status(400).json({ mensagem: "Um ou mais livros não existem." });
  }

  // verificar disponibilidade
  for (let livro of livrosSelecionados) {
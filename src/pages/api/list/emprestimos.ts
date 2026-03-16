import fs from 'fs';
import path from 'path';

// Caminho absoluto para o arquivo de dados
const filePath = path.join(process.cwd(), 'src', 'pages', 'api', 'bd.json');

export default function handler(req, res) {
    // --- OPERAÇÃO DE LEITURA ---
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);

    res.status(200).json({ emprestimos: data.emprestimos });
}

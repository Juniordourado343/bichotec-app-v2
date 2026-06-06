import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Criar pastas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbFile = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ animals: [] }));
}

// Multer - aceita QUALQUER arquivo de imagem
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Funções do banco de dados
function getAnimals() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8')).animals;
  } catch {
    return [];
  }
}

function saveAnimals(animals) {
  fs.writeFileSync(dbFile, JSON.stringify({ animals }, null, 2));
}

// API
app.get('/api/animals', (req, res) => {
  res.json(getAnimals());
});

app.post('/api/animals', (req, res) => {
  try {
    const { type, title, animalName, description, species, breed, color, reward, address, phone, tutorName, imageUrl } = req.body;
    
    if (!type || !title || !description || !species || !address || !phone || !tutorName) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const animals = getAnimals();
    const newAnimal = {
      id: Date.now().toString(),
      type,
      title,
      animalName: animalName || '',
      description,
      species,
      breed: breed || '',
      color: color || '',
      reward: reward || '',
      address,
      phone,
      tutorName,
      imageUrl: imageUrl || '',
      isReunited: false,
      createdAt: new Date().toISOString()
    };

    animals.unshift(newAnimal);
    saveAnimals(animals);
    res.status(201).json(newAnimal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar anúncio' });
  }
});

app.put('/api/animals/:id', (req, res) => {
  try {
    const animals = getAnimals();
    const index = animals.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Não encontrado' });
    }

    const { isReunited, type, title, animalName, description, species, breed, color, reward, address, phone, tutorName, imageUrl } = req.body;

    if (isReunited !== undefined) {
      animals[index].isReunited = isReunited;
    } else {
      animals[index] = { ...animals[index], type, title, animalName, description, species, breed, color, reward, address, phone, tutorName, imageUrl };
    }

    saveAnimals(animals);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

app.delete('/api/animals/:id', (req, res) => {
  try {
    let animals = getAnimals();
    animals = animals.filter(a => a.id !== req.params.id);
    saveAnimals(animals);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    res.status(500).json({ error: 'Erro no upload' });
  }
});

app.use('/uploads', express.static(uploadsDir));
app.use(express.static('public'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐾 BichoTec rodando em http://localhost:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbFile = path.join(__dirname, '../db.json');
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ animals: [] }));
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }
});

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

const router = express.Router();

router.get('/animals', (req, res) => {
  res.json(getAnimals());
});

router.post('/animals', (req, res) => {
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

router.put('/animals/:id', (req, res) => {
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
      animals[index] = {
        ...animals[index],
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
        imageUrl: imageUrl || ''
      };
    }

    saveAnimals(animals);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/animals/:id', (req, res) => {
  try {
    let animals = getAnimals();
    animals = animals.filter(a => a.id !== req.params.id);
    saveAnimals(animals);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

router.post('/upload', upload.single('image'), (req, res) => {
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
app.use('/', router);
app.use('/api', router);

export default app;

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



// No Vercel, o sistema de arquivos é somente leitura, exceto /tmp

const isVercel = process.env.VERCEL === '1';

const dbFile = isVercel ? '/tmp/db.json' : path.join(__dirname, 'db.json');

const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');



if (!fs.existsSync(uploadsDir)) {
  
  fs.mkdirSync(uploadsDir, { recursive: true });
  
}



if (!fs.existsSync(dbFile)) {
  
  const initialData = { animals: [] };
  
  const repoDbFile = path.join(__dirname, 'db.json');
  
  if (fs.existsSync(repoDbFile)) {
    
    try {
      
      const data = fs.readFileSync(repoDbFile, 'utf8');
      
      fs.writeFileSync(dbFile, data);
      
    } catch (e) {
      
      fs.writeFileSync(dbFile, JSON.stringify(initialData));
      
    }
    
  } else {
    
    fs.writeFileSync(dbFile, JSON.stringify(initialData));
    
  }
  
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
        
       























































































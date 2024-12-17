const express = require("express");

const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const path = require("path");
const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

// On définit un middleware pour parser les données des requêtes entrantes.
// Cela permet de récupérer les données envoyées via des formulaires et les rendre disponibles dans req.body.
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration de Handlebars pour Express
app.set("view engine", "hbs"); // On définit le moteur de template que Express va utiliser
app.set("views", path.join(__dirname, "views")); // On définit le dossier des vues (dans lequel se trouvent les fichiers .hbs)
hbs.registerPartials(path.join(__dirname, "views", "partials")); // On définit le dossier des partials (composants e.g. header, footer, menu...)

app.use(express.static('css'));


// Helper pour vérifier l'égalité
hbs.registerHelper('eq', (a, b) => a === b);

// Enregistrer un helper Handlebars pour formater les dates
hbs.registerHelper('formatDate', (date) => {
  if (!date) return '';
  const options = { year: 'numeric', month: 'short', day: '2-digit' };
  return new Date(date).toLocaleDateString('en-US', options); // Format : Dec 07 2024
});


app.get("/", async (req, res) => {
    // on passe seulement le nom du fichier .hbs sans l'extention.
    // Le chemin est relatif au dossier `views`.

    const { genre, editor } = req.query; // Récupérer les filtres depuis la requête

    // Construire la condition en fonction des filtres
    const conditions = {};
    if (genre) conditions.genre = { name: genre }; // Filtrer par genre
    if (editor) conditions.editor = { name: editor }; // Filtrer par éditeur

    const fewGames = await prisma.game.findMany({
      take: 4,
      orderBy:{
        id: 'desc',
      },
      where: conditions,
      include: {
        genre: true,
        editor: true,
      },
    });

    res.render("accueil", { 
        fewGames, 
    });
});

app.get('/editors', async (req, res) => {
    try {
      const editors = await prisma.editor.findMany();
      res.render('editors/editors', { editors });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors de la récupération des éditeurs.');
    }
  });



app.get('/editors/:id', async (req, res) => {
    const { id } = req.params; // Récupérer l'ID de l'éditeur
    try {
      const editor = await prisma.editor.findUnique({
        where: { id: parseInt(id) },
        include: { game: true }, // Inclure les jeux associés à cet éditeur
      });
  
      if (!editor) {
        return res.status(404).send('Éditeur introuvable.');
      }
  
      res.render('editors/editor_details', { editor });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors de la récupération des jeux de l\'éditeur.');
    }
  });



  app.get('/genres', async (req, res) => {
    try {
      const genres = await prisma.genre.findMany();
      res.render('genres/genres', { genres });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors de la récupération des genres.');
    }
  });
  
  app.get('/genres/:id', async (req, res) => {
    const { id } = req.params; // Récupérer l'ID du genre
    try {
      const genre = await prisma.genre.findUnique({
        where: { id: parseInt(id) },
        include: { game: true }, // Inclure les jeux associés à ce genre
      });
  
      if (!genre) {
        return res.status(404).send('Genre introuvable.');
      }
  
      res.render('genres/genre_details', { genre });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors de la récupération des jeux du genre.');
    }
  });

app.get('/games', async (req, res) => {
    const { genre, editor } = req.query; // Récupérer les filtres depuis la requête
    try {
      // Construire la condition en fonction des filtres
      const conditions = {};
      if (genre) conditions.genre = { name: genre }; // Filtrer par genre
      if (editor) conditions.editor = { name: editor }; // Filtrer par éditeur
  
      const games = await prisma.game.findMany({
        where: conditions,
        include: {
          genre: true,
          editor: true,
        },
      });
  
      // Récupérer tous les genres et éditeurs pour les dropdowns
      const genres = await prisma.genre.findMany();
      const editors = await prisma.editor.findMany();
  
      res.render('games/games', { games, genres, editors, selectedGenre: genre, selectedEditor: editor });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors de la récupération des jeux.');
    }
  });


  app.get('/games/:id', async (req, res) => {
    const { id } = req.params; // Récupérer l'ID du jeu
    try {
      const game = await prisma.game.findUnique({
        where: { id: parseInt(id) },
        include: {
          genre: true, // Inclure les informations du genre
          editor: true, // Inclure les informations de l'éditeur
        },
      });
  
      if (!game) {
        return res.status(404).send('Jeu introuvable.');
      }
  
      res.render('games/game_details', { game });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors de la récupération du jeu.');
    }
  });

  app.delete('/games/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.game.delete({
        where: { id: parseInt(id) },
      });
      res.status(200).json({ message: 'Jeu supprimé avec succès.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
  });

  app.get('/newGame', async (req, res) => {
    try {
      const genres = await prisma.genre.findMany();
      const editors = await prisma.editor.findMany();
      res.render('games/newGame', { genres, editors });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors du chargement du formulaire d’ajout.');
    }
  });

  app.post('/games', async (req, res) => {
    const { title, description, releaseDate, genreId, editorId } = req.body;
  
    try {
      // Validation des données reçues
      if (!title || !description || !releaseDate || !genreId || !editorId) {
        return res.status(400).send('Tous les champs sont requis.');
      }
  
      // Ajout du jeu à la base de données
      const newGame = await prisma.game.create({
        data: {
          title,
          description,
          releaseDate: new Date(releaseDate),
          genreId: parseInt(genreId, 10),
          editorId: parseInt(editorId, 10),
        },
      });
  
      res.redirect(`/games/${newGame.id}`); // Redirige vers la page du nouveau jeu
    } catch (error) {
      console.error('Erreur lors de l’ajout du jeu:', error);
      res.status(500).send('Une erreur est survenue lors de l’ajout du jeu.');
    }
  });
  
  
  
  app.get('/newEditor', async (req, res) => {
    try {
      res.render('editors/newEditor');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors du chargement du formulaire d’ajout.');
    }
  });
  
  app.post('/editors', async (req, res) => {
  const { name } = req.body;
  
  try {
    // Validation des données reçues
    if (!name) {
      return res.status(400).send('Tous les champs sont requis.');
    }
  
    // Ajout du jeu à la base de données
    const newEditor = await prisma.editor.create({
      data: {
        name
      },
    });
  
    res.redirect(`/editors`); // Redirige vers la page du nouveau jeu
  } catch (error) {
    console.error('Erreur lors de l’ajout de l’editeur:', error);
    res.status(500).send('Une erreur est survenue lors de l’ajout de l’editeur.');
  }
  });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
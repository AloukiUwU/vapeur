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

app.set("view engine", "hbs"); // On définit le moteur de template que Express va utiliser
app.set("views", path.join(__dirname, "views")); // On définit le dossier des vues (dans lequel se trouvent les fichiers .hbs)
hbs.registerPartials(path.join(__dirname, "views", "partials")); // On définit le dossier des partials (composants e.g. header, footer, menu...)

app.get("/", async (req, res) => {
    // on passe seulement le nom du fichier .hbs sans l'extention.
    // Le chemin est relatif au dossier `views`.

    // const fewGames;

    res.render("accueil", { 
        //fewGames, 
    });
});

app.get("/editors", async (req, res) => {
    res.render("editors");
});

app.get("/genres", async (req, res) => {
    res.render("genres");
});

app.get("/games", async (req, res) => {
    res.render("games/games");
});

app.get("/games/:id", async (req, res) => {
    const id = req.params.id;
    res.render("games/detailsGame", {
        id,
    });
});

app.get("/newgame", async (req, res) => {
    res.render("games/newgame");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const port = 3000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

let selectedArtDepartment;
let artDepartments;

let artworksIDs;
let randomArtworks = [];

/*#########Custom Middlewares########*/

async function getArtworksIds(req, res, next) {
    selectedArtDepartment = req.body["departmentId"];

    try {
        const idsResponse = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects?departmentIds=${selectedArtDepartment}`);
        artworksIDs = idsResponse.data["objectIDs"];
    } catch (error) {
        console.error("Request failure: " + error.message);
    }
    next();
}

async function getRandomArtworksById(req, res, next) {
    
    randomArtworks.splice(0,randomArtworks.length); //* empty the array of artwork objects // vaciar el array con objetos obras de arte.
    let min = artworksIDs[0];
    let max = artworksIDs[artworksIDs.length-1];

    let counter = 0;

    while (counter < 10) {
        const randomId = Math.floor(Math.random() * (max - min) + min);
        
        try {
            let response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${randomId}`);
            const artwork = response.data;
            if (artwork.primaryImage) {
                counter++;
                randomArtworks.push({
                    id: artwork["objectID"],
                    image: artwork["primaryImage"],
                    title: artwork["title"],
                    artist: artwork["artistDisplayName"]
                })
            }
        } catch (error) {}
    }
    next();
}

/*########Requests########*/

app.get("/", async (req, res) => {
    console.log("Desde / :" , randomArtworks);
    try {
        const response = await axios.get("https://collectionapi.metmuseum.org/public/collection/v1/departments");
        artDepartments = response.data.departments;

        res.render("index.ejs", { departments: artDepartments, selectedDepartment: selectedArtDepartment, artworks: randomArtworks });
    } catch (error) {
        res.send(error.message);
    }

})

app.use(getArtworksIds);

app.use(getRandomArtworksById);

app.post("/submit", async (req, res) => {

    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})
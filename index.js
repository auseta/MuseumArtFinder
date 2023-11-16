import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const port = 3000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));


var departments;
var departmentId;

var artworksArr = [];
var selectedArtwork;

//############# FUNCIONES #############//

async function getDepartments() {
    try {
        const response = await axios.get("https://collectionapi.metmuseum.org/public/collection/v1/departments");
        return response.data["departments"];
    } catch (error) {
        
    }
}

async function getArtworksId() {
    try {
        const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects?departmentIds=${departmentId}`);
        return response.data["objectIDs"];
    } catch (error) {
        console.error("Request Failure: " + error.message);
    }
}

function getRandomId(arr) {
    let min = arr[0];
    let max = arr[arr.length - 1];

    return Math.floor(Math.random() * (max - min) + min);

}

async function getArtworks() {
    const idArr = await getArtworksId();

    let counter = 0;

    while (counter < 8) {
        const randomId = getRandomId(idArr);
        try {
            const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${randomId}`);
            if (response.data["primaryImageSmall"] && response.data["artistDisplayName"]) {
                artworksArr.push({
                    id: response.data["objectID"],
                    title: response.data["title"],
                    artist: response.data["artistDisplayName"],
                    image: response.data["primaryImageSmall"]
                })

                counter++;
            }
        } catch (error) {}
    }

}

//############# REQUESTS ############//

app.use(getInfo);

app.get("/", async (req, res) => {
    res.render("index.ejs", { departments, artworks: artworksArr })
})

app.post("/submit", (req, res) => {
    res.render("index.ejs", { departments, artworks: artworksArr });
})

app.use(getArtwork);

app.post("/artwork", async (req, res) => {
    try {

        console.log("Artwork seleccionado: " + selectedArtwork);

        const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${selectedArtwork}`);
        const artwork = {
            title: response.data["title"],
            artist: response.data["artistDisplayName"],
            beginDate: response.data["objectBeginDate"],
            endDate: response.data["objectEndDate"],
            image: response.data["primaryImageSmall"],
        }

        res.render("artwork.ejs", artwork);
    } catch (error) {
        console.error("Failure Request: " + error.message);
    }
    
})

//############# MIDDLEWARES ############//

async function getInfo(req, res, next) {
    departments = await getDepartments();
    departmentId = req.body["departmentId"];
    if (departmentId) {
        await getArtworks();
    }
    next();
}

function getArtwork(req, res, next) {
    selectedArtwork = req.body["artworkId"];
    next();
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})
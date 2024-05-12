const http = require('http');
const express = require("express");  
const path = require("path");
const app = express(); 
const bodyParser = require("body-parser");
require('dotenv').config({path: path.resolve(__dirname, "credentialsDontPost/.env")})
const readline = require("readline");
const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const fetch = require('node-fetch');

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': 'd63944096cmsh18105f98934ea45p1cc1ffjsn6a070a225a6b',
    'X-RapidAPI-Host': 'plant-hardiness-zone.p.rapidapi.com'
  }
};
//const {getHardiness} = require('./data.js');

//req.end();
const publicPath = path.resolve(__dirname, "templates/");
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname + '/templates/'));

const Difficulties = {
    Easy: 0,
    Medium: 1,
    Hard: 2
};

console.log(`Web server is running at http://localhost:${443}`)
const prompt = "Stop to shutdown the server: ";
interface.question(prompt, value => {if (value == "stop"){
  process.stdout.write("Shutting down the server\n");
  process.exit(0)
}})

const { MongoClient, ServerApiVersion } = require('mongodb');
const { mainModule } = require('process');

//may need to change the uri? 
const uri = "mongodb+srv://"+ process.env.MONGO_DB_USERNAME +":"+process.env.MONGO_DB_PASSWORD +"@cluster0.onz3j2r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


process.stdin.setEncoding("utf8");

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
app.listen(process.env.PORT||443);

app.get("/", (request, response) => { 
  response.render("index.ejs");
});

app.get("/searchPlants", (request, response) => {
  response.render("searchPlants.ejs");
});

app.get("/hardiness", (request, response) => {
  response.render("hardiness.ejs", {info: null});
});

app.post("/getHardiness", async function (request, response) {
  if (!request.body.zipcode) {
    response.render("hardiness.ejs", {info: "Please enter a zipcode"});
    return
  }

  let url = 'https://plant-hardiness-zone.p.rapidapi.com/zipcodes/' + request.body.zipcode;
  try {
      //console.log("invoke url: " + url);
      const res = await fetch(url, options);
      const result = await res.text();
      let resJson = JSON.parse(result);
      if(!resJson) {
        response.render("hardiness.ejs", {info: "No data"});
        return
      }
      let ans = `Hardiness Zone for ${resJson.zipcode}: ${resJson.hardiness_zone}`;
      response.render("hardiness.ejs", {info: ans});
  } catch (error) {
      console.error(error);
  }
});
app.post("/processSearch", async function (request, response) {
//collect info
  const obj = {
    minSize: {$lte: request.body.minSpace/1},
    difficulty: {$lte: Difficulties[request.body.Difficulty]}, 
    sunlight: request.body.sunlight
  }
  console.log(obj)
  //send info to database
  await client.connect();
  const findResult = client.db(process.env.MONGO_DB_NAME).collection(process.env.MONGO_COLLECTION).find(obj);
  const findResult1 = await findResult.toArray(); 
  toSend = "<table> <tr><th>Name</th> <th>Difficulty</th> <th>Space Needed (inches)</th> <th >Sowing</th> <th >Care </th> <th>Harvest</th><th >Food Recs</th></tr>";
  findResult1.forEach((curr)=>toSend += "<tr><td>"+ curr.name+"</td>"+"<td>"+ curr.difficulty+"</td>" + "<td>"+ curr.minSize+"</td>" +"<td>"+ curr.sowingInstructions+"</td>" + "<td>"+ curr.careInstructions+"</td>"  + "<td>"+ curr.harvestingInstructions+"</td>" + "<td>"+ curr.foodRecommendations+"</td>"+  "</tr>" )
  toSend += "</table>"
  if (findResult1.length == 0){
      toSend += "<p style = \"font-size: 1.125rem\">No plant found which meets such requirements.</p>";
  }
  const varSend = {
    content: toSend
  }
  if (findResult != null){
    response.render("processSearchPlants.ejs",varSend);
  }
  else{
    response.send("<p>No results found</p> <a href = '/'>Home</a>");
  }
})

app.get("/tips", (request, response) =>{
  response.render("tips.ejs");
});


app.get("/sources", (request, response) =>{
  response.render("sources.ejs");
});

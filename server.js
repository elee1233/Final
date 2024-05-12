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

const url = 'https://plant-hardiness-zone.p.rapidapi.com/zipcodes/90210';
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '610d553044msh82a30835640d07dp1f1654jsna0d2d62bfc18',
    'X-RapidAPI-Host': 'plant-hardiness-zone.p.rapidapi.com'
  }
};

try {
	const response = await fetch(url, options);
	const result = await response.text();
	console.log(result);
} catch (error) {
	console.error(error);
}
/*
//PLANT HARDINESS API 
const options = {
	method: 'GET',
	hostname: 'plant-hardiness-zone.p.rapidapi.com',
	port: process.env.PORT||443,
	path: '/zipcodes/90210',
	headers: {
		'X-RapidAPI-Key': '610d553044msh82a30835640d07dp1f1654jsna0d2d62bfc18',
		'X-RapidAPI-Host': 'plant-hardiness-zone.p.rapidapi.com'
	}
};

//EXAMPLE OF HOW TO USE API 
const req = http.request(options, function (res) {
	const chunks = [];

	res.on('data', function (chunk) {
		chunks.push(chunk);
	});

	res.on('end', function () {
		const body = Buffer.concat(chunks);
		console.log(body.toString());
	});
});
*/
req.end();
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

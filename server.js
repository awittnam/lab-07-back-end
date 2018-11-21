'use strict';


// Application Dependencies
const express = require('express'); //telling app to use the express library
const superagent = require('superagent');  //telling app to use the superagent proxy
const cors = require('cors');  //telling app to use the CORS library

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// API Routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data) //the clients input that is given to the proxy to talk to the API.
    .then(location => response.send(location)) //awaits response from superagent before responding to client 
    .catch(error => handleError(error, response)); //is there is an error it will call this function which return the error message
})

app.get('/weather', getWeather);

app.get('/movies', getMovies);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// Models
function Location(query, res) {
  this.search_query = query;  //query is coming from superagent, which comes from searchToLatLong, coming from searchToLatLong(the user input): user inputs location which goes into searchToLatLong as a perameter which creates the obj.  
  this.formatted_query = res.body.results[0].formatted_address; //the res. is the data returned from superagent from the API.
  this.latitude = res.body.results[0].geometry.location.lat;//the res. is the data returned from superagent from the API.
  this.longitude = res.body.results[0].geometry.location.lng;//the res. is the data returned from superagent from the API.
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Movie(query,res) {
  this.title = query.title;
  this.released_on = query.release_date; 
  this.total_votes = query.vote_count;
  this.average_votes = query.vote_average;
  this.popularity = query.popularity;
  this.image_url = query.poster_path;
  this.overview = query.overview;
}


// Helper Functions
function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(res => {
      return new Location(query, res);
    })
    .catch(error => handleError(error));
}

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
  
      });

      response.send(weatherSummaries);
    })
    .catch(error => handleError(error, response));
}

function getMovies(request, response) {
  const movieUrl = `https://api.themoviedb.org/3/movie/76341?api_key=${process.env.MOVIE_API_KEY}`;
  //QUESTION: should we beware this address didn't ask for a location
  superagent.get(movieUrl)
    .then( (result) => {
      const movieSummaries = result.body.map( (info) => {
        return new Movie(info);
      });
      response.send(movieSummaries);
    })
    .catch(error => handleError(error, response));
}



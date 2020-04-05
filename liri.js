// Initialize .env file which contains our keys
require("dotenv").config();

// Initialize keys file with exports our keys
var keys = require("./keys.js");

// Initialize spotify npm
var Spotify = require('node-spotify-api')
var spotify = new Spotify({
    id: keys.spotify.id,
    secret: keys.spotify.secret
});

// Initialize libraries for each query
var request = require('request');
var moment = require('moment');
var axios = require('axios');
var fs = require('fs');

// Grab our LIRI arguments
var action = process.argv[2];
var argument = process.argv.splice(3).join(" ");

pickAction();

function pickAction() {
    switch (action) {
        case "concert-this":
            concert_this(argument);
            break;
        case "spotify-this-song":
            spotify_this_song(argument);
            break;
        case "movie-this":
            movie_this(argument);
            break;
        case "do-what-it-says":
            do_what_it_says();
            break;
        default:
            console.log(action + " is not a valid option! Please try again.");
    }
}

function concert_this(artist) {
    if (!artist) {
        artist = "Post Malone";
    }

    artist = artist.replace(/ /g, "+");
    var queryUrl = "https://rest.bandsintown.com/artists/" + artist + "/events?app_id=codingbootcamp"
    request(queryUrl, { json: true }, (err, response) => {
        var output = "";

        if (err) {
            output += "An error occuring using the Node request library with error code " + err + "\n";
        }
        else if (response.body.errorMessage || response.body.length === 0) {
            output += "There were not results found for this band!!\n";
        }
        else {
            output += "Executing concert-this with song option: " + artist + "\n\n";
            for (var x = 0; x < response.body.length && x < 10; x++) {  // reduce max to 10 entries 
                output += "------------------------- " + artist.replace("+", " ") + " ----------------------------\n";
                output += "Venue: " + response.body[x].venue.name + "\n";
                if (response.body[x].venue.region) {
                    output += "Location: " + response.body[x].venue.city + ", " + response.body[x].venue.region + "\n";
                }
                else {
                    output += "Location: " + response.body[x].venue.city + "\n";
                }
                output += "Date: " + moment(response.body[x].datetime).format("M/D/YYYY") + "\n\n";
            }
            output += "\n\n";
        }
        console.log(output);
        fs.appendFile("log.txt", output, err => {
            if (err) {
                console.log("Error writing to file with error code: " + err);
            }
        })
    })
}

function spotify_this_song(song) {
    if (!song) {
        song = "The Sign";
    }

    spotify.search({
        type: 'track',
        query: song.replace(/ /g, "+"),
        limit: 1
    }, (err, data) => {
        var output = "";
        if (err) {
            output += "An error occuring using the Node Spotify library with error code " + err + "\n";
            output += "Mostly likely this song doens't exist.  Are you making things up?\n";
        }
        else {
            output += "Executing spotify-this-song with song option: " + song + "\n\n";
            output += "-------------------------------------------------------------------\n";
            output += "Artist: " + data.tracks.items[0].album.artists[0].name + "\n";
            output += "Song: " + data.tracks.items[0].name + "\n";
            output += "Album: " + data.tracks.items[0].album.name + "\n";
            output += "Preview: " + data.tracks.items[0].external_urls.spotify + "\n";
            output += "-------------------------------------------------------------------\n\n";
        }
        console.log(output);
        fs.appendFile("log.txt", output, err => {
            if (err) {
                console.log("Error writing to file with error code: " + err);
            }
        })
    })
}

function movie_this(movie) {
    var rating;
    var rating_found = false;

    if (!movie) {
        movie = "Mr. Nobody";
    }

    var queryUrl = "http://www.omdbapi.com/?apikey=trilogy&t=" + movie.replace(/ /g, "+");
    axios.get(queryUrl)
        .then(response => {
            var output = "";
            if (response.data.Response === "False" && response.data.Error) {
                output += "No movies found related to that title!\n";
            }
            else {
                output += "Executing movie-this with song option: " + movie + "\n\n";
                output += "--------------------------------------------------------------\n";
                output += "Title: " + response.data.Title + "\n";
                output += "Release Year: " + response.data.Year + "\n";
                for (const [key, value] of Object.entries(response.data.Ratings)) {
                    if (response.data.Ratings[key].Source === "Internet Movie Database") {
                        rating = response.data.Ratings[key].Value
                        output += "IMDB Rating: " + rating + "\n";
                        rating_found = true;
                    }
                    if (response.data.Ratings[key].Source === "Rotten Tomatoes") {
                        rating = response.data.Ratings[key].Value;
                        output += "Rotten Tomatoes Rating: " + rating + "\n";
                        rating_found = true;
                    }

                    if (!rating_found) {
                        output += "No IMDB or Rotten Tomatoes Ratings found!\n";
                    }
                }
                output += "Producted in: " + response.data.Country + "\n";
                output += "Languages: " + response.data.Language + "\n";
                output += "Plot: " + response.data.Plot + "\n";
                output += "Actors: " + response.data.Actors + "\n";
                output += "--------------------------------------------------------------\n\n";
            }
            console.log(output);
            fs.appendFile("log.txt", output, err => {
                if (err) {
                    console.log("Error writing to file with error code: " + err);
                }
            })
        })
        .catch(err => {
            console.log("An error occuring using the Node axios library with error code " + err);
            return;
        })
}

function do_what_it_says() {
    fs.readFile("random.txt", "utf8", (error, data) => {
        if (error) {
            return console.log("Something went wrong here. Error is: " + error);
        }
        var commands = data.replace(/[\r\n]/, "").split("\n");
        for (var x = 0; x < commands.length; x++) {
            var sub = commands[x].split(/,/)[0].replace(/-/g, "_");
            var arg = commands[x].split(/,/)[1].replace(/\"/g, "");

            switch (sub.trim()) {
                case "concert_this":
                    concert_this(arg.trim());
                    break;
                case "spotify_this_song":
                    spotify_this_song(arg);
                    break;
                case "movie_this":
                    movie_this(arg);
                    break;
                default:
                    console.log("This is not a valid option: " + sub);
            }

        }
    })

}
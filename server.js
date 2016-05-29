var request = require('request');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var gm = require('gm').subClass({   //Using ImageMagick to be compatible with Heroku
    imageMagick: true
});

const MIN_DICTIONARY_COUNT = 3; //Controls the likelyhood of rare words

const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY;
const FLICKR_API_KEY = process.env.FLICKR_API_KEY;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var synchronizer = new EventEmitter();

function generateBandName() {
    var nameGenerators = [
        function() { //The Nouns (ex. The Beatles)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural' + '&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                synchronizer.bandName = 'The ' + synchronizer.searchTerm;
                synchronizer.emit('gotWord');
            });
        },
        function() { //The Adjective Nouns (ex. The Flaming Lips)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=adjective&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = 'The ' + JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                    synchronizer.bandName += ' ' + synchronizer.searchTerm;
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Nouns of Noun (ex. Mates of State)
            var termPicker = Math.random() > 0.5;
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = JSON.parse(data).word.capitalize();
                if (termPicker) synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.bandName += ' of ' + JSON.parse(data).word.capitalize();
                    if (!termPicker) synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Proper Noun the Noun (ex. Chance the Rapper)
            var termPicker = Math.random() > 0.5;
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = JSON.parse(data).word.capitalize();
                if (termPicker) synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.bandName += ' the ' + JSON.parse(data).word.capitalize();
                    if (!termPicker) synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Noun-number (ex. Blink-182)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                synchronizer.bandName = synchronizer.searchTerm + '-' + Math.floor(Math.random() * 999 + 1);
                synchronizer.emit('gotWord');
            });
        },
        function() { //Adjective Noun (ex. Tame Impala)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=adjective&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                    synchronizer.bandName += ' ' + synchronizer.searchTerm;
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Propper Noun Letter Letter Letter (ex. Charlie XCX)
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                synchronizer.bandName = synchronizer.searchTerm + ' ' + letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length));
                synchronizer.emit('gotWord');
            });
        },
        function() { //Verb the Noun (ex. Run the Jewels)
            var termPicker = Math.random() > 0.5;
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=verb&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = JSON.parse(data).word.capitalize();
                if (termPicker) synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=plural-noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.bandName += ' the ' + JSON.parse(data).word.capitalize();
                    if (!termPicker) synchronizer.searchTerm = JSON.parse(data).word.capitalize();
                    synchronizer.emit('gotWord');
                });
            });
        }
    ];
    nameGenerators[Math.floor(Math.random() * nameGenerators.length)]();
}

function genre() {
    var genres = ['acoustic', 'alternative', 'blues', 'country', 'electronic', 'hip-hop', 'neo-jazz', 'metal', 'pop', 'rock', 'rap', 'classical', 'folk', 'dubstep', 'crossover thrash', 'grunge', 'nu-wave', 'Christian rock', 'gospel', 'adult contemporary', 'neo-soul', 'Tex-Mex', 'dad-rock', "rock 'n' roll", 'alt-rock', 'electronica', 'Naruto opening', 'R&B', 'synthpop', 'vaporwave', 'expirimental', 'trap', 'Atlanta rap'];
    return genres[Math.floor(Math.random() * genres.length)];
}

function generateAlbumArt() {
    //Grabs the most recent image posted to Flickr tagged with the search term
    request('https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + FLICKR_API_KEY + '&tags=' + synchronizer.searchTerm + '&per_page=1&format=json&nojsoncallback=1', function(error, response, data) {
        setTimeout(function() {
            synchronizer.link = 'http://farm' + JSON.parse(data).photos.photo[0].farm + '.staticflickr.com/' + JSON.parse(data).photos.photo[0].server + '/' + JSON.parse(data).photos.photo[0].id + '_' + JSON.parse(data).photos.photo[0].secret + '.jpg';
            synchronizer.emit('downloaded');
        }, 500);
    });

    //Saves the image locally
    synchronizer.on('downloaded', function() {
        request(synchronizer.link, {
            encoding: 'binary'
        }, function(error, response, body) {
            fs.writeFile('original.jpg', body, 'binary', function(err) {});
            synchronizer.emit('saved');
        });
    });

    //Measures the image for resizing later (must be its own step because it takes time)
    synchronizer.on('saved', function() {
        setTimeout(function() {
            gm('original.jpg').size(function(err, val) {
                synchronizer.midH = val.height / 2;
                synchronizer.midW = val.width / 2;
            });
            synchronizer.emit('sized');
        }, 2000);
    });

    //Crops the image down to a square
    synchronizer.on('sized', function() {
        setTimeout(function() {
            gm('original.jpg').crop(300, 300, synchronizer.midW - 150, synchronizer.midH - 150).write('resize.jpg', function(err) {});
        }, 2000);
        synchronizer.emit('ready');
    });

    //Writes the band name on the album and deletes temporary image files
    synchronizer.on('ready', function() {
        setTimeout(function() {
            gm('resize.jpg').trim().fontSize(42).stroke('white').drawText(50, 50, synchronizer.bandName).write('finished.jpg', function(err) {
                synchronizer.emit('artCreated');
                fs.unlinkSync('original.jpg');
                fs.unlinkSync('resize.jpg');
            });
        }, 3000);
    });
}

//Generates band name and picks a genre, then puts them in a random tweet body archetype and creates album art
function generateTweet() {
    generateBandName();
    var tweets = [
        function() {
            synchronizer.tweet = 'Wow! Really excited to hear new ' + genre() + ' band ' + synchronizer.bandName + "'s self-titled debut album";
        },
        function() {
            synchronizer.tweet = "I don't even like " + genre() + ' music, but ' + synchronizer.bandName + "'s self-titled debut album is straight fire!";
        },
        function() {
            synchronizer.tweet = synchronizer.bandName + "'s self-titled debut album just chaged the " + genre() + ' game forever';
        },
        function() {
            synchronizer.tweet = 'Absolutely loving the ' + genre() + ' sounds on ' + synchronizer.bandName + "'s self-titled debut album";
        },
function() {
            synchronizer.tweet = 'Go listen to ' + synchronizer.bandName + "'s self-titled debut into the " + genre() + ' game. Incredible.';
        },
        function() {
            synchronizer.tweet = synchronizer.bandName + ' are keeping ' + genre() + ' alive with the fresh feel of their self-titled debut album'
        },
        function() {
            synchronizer.tweet = "RT if you're refreshing Spotify right now so you can be the first to listen to " + synchronizer.bandName + "'s self-titled debut album";
        },
        function() {
            synchronizer.tweet = 'If you even care a little about ' + genre() + ' at all you need to be listening to ' + synchronizer.bandName + "'s self-titled debut album";
        },
        function() {
            synchronizer.tweet = 'SMASH THAT LIKE FOR ' + synchronizer.bandName.toUpperCase() + ' AND THEIR SELF-TITLED DEBUT ALBUM';
        },
        function() {
            synchronizer.tweet = 'With their drummer finally out of prison ' + synchronizer.bandName + ' is finally ready to make their first offial dive into the ' + genre() + ' genre with their self-titled debut album';
        }
    ];
    synchronizer.on('gotWord', function() {
        tweets[Math.floor(Math.random() * tweets.length)]();
        }
        generateAlbumArt();
        synchronizer.on('artCreated', function() {
            synchronizer.emit('finished');
        });
    });
}

generateTweet();

synchronizer.on('finished', function() {
    console.log(synchronizer.tweet);
});

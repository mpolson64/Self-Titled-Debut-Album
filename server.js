var request = require('request');
var EventEmitter = require('events').EventEmitter;
var Twit = require('twit');

const INTERVAL = 1000 * 60 * 2;	//Time inbetween tweets (in miliseconds)
const MIN_DICTIONARY_COUNT = 3; //Controls the likelyhood of rare words

const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var synchronizer = new EventEmitter();
var T = new Twit({
    consumer_key:         TWITTER_API_KEY,
    consumer_secret:      TWITTER_API_SECRET,
    access_token:         TWITTER_ACCESS_TOKEN,
    access_token_secret:  TWITTER_ACCESS_SECRET,
    timeout_ms:           60 * 1000  // optional HTTP request timeout to apply to all requests.
});

function generateBandName() {
    var nameGenerators = [
        function() { //The Nouns (ex. The Beatles)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural' + '&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.keyword = JSON.parse(data).word.capitalize();
                synchronizer.bandName = 'The ' + synchronizer.keyword;
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
                    synchronizer.keyword = JSON.parse(data).word.capitalize();
                    synchronizer.bandName += ' ' + synchronizer.keyword;
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Nouns of Noun (ex. Mates of State)
            var termPicker = Math.random() > 0.5;
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = JSON.parse(data).word.capitalize();
                if (termPicker) synchronizer.keyword = JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.bandName += ' of ' + JSON.parse(data).word.capitalize();
                    if (!termPicker) synchronizer.keyword = JSON.parse(data).word.capitalize();
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Proper Noun the Noun (ex. Chance the Rapper)
            var termPicker = Math.random() > 0.5;
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = JSON.parse(data).word.capitalize();
                if (termPicker) synchronizer.keyword = JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.bandName += ' the ' + JSON.parse(data).word.capitalize();
                    if (!termPicker) synchronizer.keyword = JSON.parse(data).word.capitalize();
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Noun-number (ex. Blink-182)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.keyword = JSON.parse(data).word.capitalize();
                synchronizer.bandName = synchronizer.keyword + '-' + Math.floor(Math.random() * 999 + 1);
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
                    synchronizer.keyword = JSON.parse(data).word.capitalize();
                    synchronizer.bandName += ' ' + synchronizer.keyword;
                    synchronizer.emit('gotWord');
                });
            });
        },
        function() { //Propper Noun Letter Letter Letter (ex. Charlie XCX)
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.keyword = JSON.parse(data).word.capitalize();
                synchronizer.bandName = synchronizer.keyword + ' ' + letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length));
                synchronizer.emit('gotWord');
            });
        },
        function() { //Verb the Noun (ex. Run the Jewels)
            var termPicker = Math.random() > 0.5;
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=verb&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                synchronizer.bandName = JSON.parse(data).word.capitalize();
                if (termPicker) synchronizer.keyword = JSON.parse(data).word.capitalize();
                synchronizer.emit('gotSubWord');
            });
            synchronizer.on('gotSubWord', function() {
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=plural-noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    synchronizer.bandName += ' the ' + JSON.parse(data).word.capitalize();
                    if (!termPicker) synchronizer.keyword = JSON.parse(data).word.capitalize();
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
        synchronizer.emit('finished');
        T.post('statuses/update', {status: synchronizer.tweet}, function(err, data, response) {
            console.log(data); 
        });
    });
}

generateTweet();
setInterval(generateTweet, INTERVAL);

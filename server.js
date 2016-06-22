var request = require('request');
var EventEmitter = require('events').EventEmitter;
var Twit = require('twit');

const DEBUGGING = process.env.DEBUGGING;
const INTERVAL = process.env.INTERVAL;	//Time inbetween tweets (in miliseconds)
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
            synchronizer.tweet = 'Wow! Really excited to hear the new ' + genre() + ' music on ' + synchronizer.bandName + "'s self-titled debut album";
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
            synchronizer.tweet = synchronizer.bandName + "'s keeping " + genre() + ' alive with the fresh feel of their self-titled debut album'
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
        },
        function() {
            var regions = ['a North American', 'a South American', 'a European', 'an Australian', 'an Asian', 'an Antarctic', 'a US (+Canadian)'];
            synchronizer.tweet = synchronizer.bandName + ' has finally announced ' + regions[Math.floor(Math.random() * regions.length)] + ' tour following their wildly successful self-titled debut album';
        },
        function() {
            synchronizer.tweet = 'Falling in love with ' + genre() + ' again thanks to ' + synchronizer.bandName + "'s self-titled debut album'";
        },
        function() {
            synchronizer.tweet = 'ATTENTION ' + genre().toUpperCase() + ' ARTISTS: There is no need to make music anymore; ' + synchronizer.bandName + ' has perfected it on their self-titled debut album';
        },
        function() {
            synchronizer.tweet = 'dont even read the reviews on ' + synchronizer.bandName.toLowerCase() + '. every single ' + genre() + ' fan knows its a ' + Math.floor(Math.random() * 11);
        },
        function() {
            synchronizer.tweet = genre().capitalize() + ' fans rejoice! ' + synchronizer.bandName + ' singlehandedly saved the genre with their self-titled debut album';
        },
        function() {
            synchronizer.tweet = "I did not know you could sample Desiigner's Panda in " + genre() + ' but ' + synchronizer.bandName + ' proved me wrong in their lead single off their self-titled debut album';
        },
        function() {
            function makeDay() {
                var date = new Date();
                var temp = date.getDate();

                temp = (temp + 10) % 28;    //Assures the date is possible

                if(temp.toString().charAt(temp.toString().length - 1) == 1) {
                    temp += 'st';
                }
                else if(temp.toString().charAt(temp.toString().length - 1) == 2) {
                    temp += 'nd';
                }
                else if(temp.toString().charAt(temp.toString().length - 1) == 3) {
                    temp += 'rd';
                }
                else {
                    temp += 'th';
                }

                return temp;
            }

            synchronizer.tweet = 'Mark your calendars ' + genre() + ' fans because ' + synchronizer.bandName + ' is dropping their self-titled debut album on the ' + makeDay();
        },
        function() {
            synchronizer.tweet = "There's no date yet, but " + synchronizer.bandName + "'s promissing " + genre() + ' fans their self-titled debut album WILL be coming this year';
        }
    ];
    synchronizer.on('gotWord', function() {
        tweets[Math.floor(Math.random() * tweets.length)]();
        if(!DEBUGGING){
            T.post('statuses/update', {status: synchronizer.tweet}, function(err, data, response) {
                console.log(data);
            });
        }
        else {
            console.log(synchronizer.tweet);
        }
    });
}

setInterval(generateTweet, INTERVAL);

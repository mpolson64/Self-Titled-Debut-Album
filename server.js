var request = require('request');
var Twit = require('twit');

const INTERVAL = process.env.INTERVAL; //Time inbetween tweets (in miliseconds)
const WORDNIK_TIMEOUT = process.env.WORDNIK_TIMEOUT;
const MIN_DICTIONARY_COUNT = process.env.MIN_DICTIONARY_COUNT; //Controls the likelyhood of rare words

const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var T = new Twit({
    consumer_key: TWITTER_API_KEY,
    consumer_secret: TWITTER_API_SECRET,
    access_token: TWITTER_ACCESS_TOKEN,
    access_token_secret: TWITTER_ACCESS_SECRET,
    timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
});

var receivedWord;
var bandName;
var tweet;

function generateBandName() {
    var nameGenerators = [

        function() { //The Nouns (ex. The Beatles)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural' + '&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    receivedWord = JSON.parse(data).word.capitalize();
                    bandName = 'The ' + receivedWord;
                }, WORDNIK_TIMEOUT);
            });
        },
        function() { //The Adjective Nouns (ex. The Flaming Lips)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=adjective&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    bandName = 'The ' + JSON.parse(data).word.capitalize();
                    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                        setTimeout(function() {
                            receivedWord = JSON.parse(data).word.capitalize();
                            bandName += ' ' + receivedWord;
                        }, WORDNIK_TIMEOUT);
                    });
                }, WORDNIK_TIMEOUT);
            });
        },
        function() { //Nouns of Noun (ex. Mates of State)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    bandName = JSON.parse(data).word.capitalize();
                    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                        setTimeout(function() {
                            bandName += ' of ' + JSON.parse(data).word.capitalize();
                        }, WORDNIK_TIMEOUT);
                    });
                }, WORDNIK_TIMEOUT);
            });
        },
        function() { //Proper Noun the Noun (ex. Chance the Rapper)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    bandName = JSON.parse(data).word.capitalize();
                }, WORDNIK_TIMEOUT);
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    setTimeout(function() {
                        bandName += ' the ' + JSON.parse(data).word.capitalize();
                    }, WORDNIK_TIMEOUT);
                });
            });
        },
        function() { //Noun-number (ex. Blink-182)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    bandName = JSON.parse(data).word.capitalize() + '-' + Math.floor(Math.random() * 999 + 1);
                }, WORDNIK_TIMEOUT);
            });
        },
        function() { //Adjective Noun (ex. Tame Impala)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=adjective&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    bandName = JSON.parse(data).word.capitalize();
                }, WORDNIK_TIMEOUT);
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    setTimeout(function() {
                        receivedWord = JSON.parse(data).word.capitalize();
                        bandName += ' ' + receivedWord;
                    }, WORDNIK_TIMEOUT);
                });
            });
        },
        function() { //Propper Noun Letter Letter Letter (ex. Charlie XCX)
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    bandName = JSON.parse(data).word.capitalize() + ' ' + letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length));
                }, WORDNIK_TIMEOUT);
            });
        },
        function() { //Verb the Noun (ex. Run the Jewels)
            request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=verb&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                setTimeout(function() {
                    bandName = JSON.parse(data).word.capitalize();
                }, WORDNIK_TIMEOUT);
                request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
                    setTimeout(function() {
                        bandName += ' the ' + JSON.parse(data).word.capitalize();
                    }, WORDNIK_TIMEOUT + 1000);
                });
            });
        }
    ];
    nameGenerators[Math.floor(Math.random() * nameGenerators.length)]();
}

function genre() {
    var genres = ['acoustic', 'alternative', 'blues', 'country', 'electronic', 'hip-hop', 'neo-jazz', 'metal', 'pop', 'rock', 'rap', 'classical', 'folk', 'dubstep', 'crossover-thrash', 'grunge', 'nu-wave', 'Christian-rock', 'gospel', 'adult-contemporary', 'neo-soul', 'Tex-Mex', 'dad-rock', "rock-n-roll", 'alt-rock', 'electronica', 'J-Pop', 'R&B', 'synthpop', 'vaporwave', 'expirimental', 'trap', 'Atlanta-rap', 'cloud-rap', 'deep-house', 'house', 'future-funk', 'electro-funk', 'funk', 'chillwave', 'EDM', 'IDM', 'nightcore', 'disco', 'gangsta-rap', 'drill', 'old-skool #hip-hop', 'eurobeat', 'dream-pop', 'psych-rock', 'psych-pop', 'shoegaze', 'nu-metal', 'black-metal', 'dance-pop'];
    return '#' + genres[Math.floor(Math.random() * genres.length)];
}

//Generates band name and picks a genre, then puts them in a random tweet body archetype and creates album art
function generateTweet() {
    generateBandName();

    var tweets = [

        function() {
            tweet = 'Wow! Really excited to hear the new ' + genre() + ' music on ' + bandName + "'s self-titled debut album";
        },
        function() {
            tweet = "I don't even like " + genre() + ' music, but ' + bandName + "'s self-titled debut album is straight fire!";
        },
        function() {
            tweet = bandName + "'s self-titled debut album just chaged the " + genre() + ' game forever';
        },
        function() {
            tweet = 'Absolutely loving the ' + genre() + ' sounds on ' + bandName + "'s self-titled debut album";
        },
        function() {
            tweet = 'Go listen to ' + bandName + "'s self-titled debut into the " + genre() + ' game. Incredible.';
        },
        function() {
            tweet = bandName + "'s keeping " + genre() + ' alive with the fresh feel of their self-titled debut album'
        },
        function() {
            tweet = "RT if you're refreshing Spotify right now so you can be the first to listen to " + bandName + "'s self-titled debut album";
        },
        function() {
            tweet = 'If you even care a little about ' + genre() + ' at all you need to be listening to ' + bandName + "'s self-titled debut album";
        },
        function() {
            tweet = 'SMASH THAT LIKE FOR ' + bandName.toUpperCase() + ' AND THEIR SELF-TITLED DEBUT ALBUM';
        },
        function() {
            tweet = 'With their drummer finally out of prison ' + bandName + ' is finally ready to make their first offial dive into the ' + genre() + ' genre with their self-titled debut album';
        },
        function() {
            var regions = ['a North American', 'a South American', 'a European', 'an Australian', 'an Asian', 'an Antarctic', 'a US (+Canadian)'];
            tweet = bandName + ' has finally announced ' + regions[Math.floor(Math.random() * regions.length)] + ' tour following their wildly successful self-titled debut album';
        },
        function() {
            tweet = 'Falling in love with ' + genre() + ' again thanks to ' + bandName + "'s self-titled debut album";
        },
        function() {
            tweet = 'ATTENTION ' + genre().toUpperCase() + ' ARTISTS: There is no need to make music anymore; ' + bandName + ' has perfected it on their self-titled debut album';
        },
        function() {
            tweet = 'dont even read the reviews on ' + bandName.toLowerCase() + '. every single ' + genre() + ' fan knows its a ' + Math.floor(Math.random() * 11);
        },
        function() {
            tweet = genre().capitalize() + ' fans rejoice! ' + bandName + ' singlehandedly saved the genre with their self-titled debut album';
        },
        function() {
            tweet = "I didn't know you could sample Desiigner's Panda in " + genre() + ' but ' + bandName + ' proved me wrong in their lead single off their self-titled debut album';
        },
        function() {
            function makeDay() {
                var date = new Date();
                var temp = date.getDate();

                temp = (temp + 10) % 28; //Assures the date is possible

                if (temp.toString().charAt(temp.toString().length - 1) == 1) {
                    temp += 'st';
                } else if (temp.toString().charAt(temp.toString().length - 1) == 2) {
                    temp += 'nd';
                } else if (temp.toString().charAt(temp.toString().length - 1) == 3) {
                    temp += 'rd';
                } else {
                    temp += 'th';
                }

                return temp;
            }

            tweet = 'Mark your calendars ' + genre() + ' fans because ' + bandName + ' is dropping their self-titled debut album on the ' + makeDay();
        },
        function() {
            tweet = "There's no date yet, but " + bandName + "'s promissing " + genre() + ' fans their self-titled debut album WILL be coming this year';
        },
        function() {
            tweet = 'DM me if you have tickets to the ' + bandName + " show. I can't get their " + genre() + ' sound out of my head after their self-titled debut album';
        },
        function() {
            tweet = "If you've got a spare $" + Math.floor(Math.random() * 20 + 1) + ' and like ' + genre() + ' def pick up ' + bandName + "'s self-titled debut album";
        },
        function() {
            tweet = 'I know we say everything is game-changing but ' + bandName + "'s self-titled debut album is legit rocking the " + genre() + ' boat';
        },
        function() {
            tweet = 'I know for a fact the ' + genre() + ' guys are going to be remixing the hell out of the ' + genre() + ' sounds on ' + bandName + "'s self-titled debut album";
        },
        function() {
            var feelings = ['happiness', 'love', 'kindness', 'forgiveness', 'greif', 'revenge', 'hatred', 'anger', 'depression', 'lonliness', 'rejection', 'acceptance', 'self-affirmation', 'doubt'];
            tweet = "It's all about " + feelings[Math.floor(Math.random() * feelings.length)] + ' on ' + bandName + "'s self-titled debut into " + genre();
        },
        function() {
            tweet = "If you're a " + genre() + " boy you'd better have listened to the new self-titled debut album from " + bandName;
        },
        function() {
            tweet = "This isn't a reissue or a remaster, this is a fresh new " + genre() + ' album! Do yourself a favor and check out ' + bandName + "'s self-titled debut album";
        }
    ];
    tweets[Math.floor(Math.random() * tweets.length)]();
}

var doIt = function() {
    generateTweet();
    T.post('statuses/update', {
        status: tweet
    }, function(err, data, response) {
        console.log(data);
    });
}

generateBandName();
setTimeout(doIt, 1000);
setInterval(doIt, INTERVAL);

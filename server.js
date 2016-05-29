var request = require('request');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var gm = require('gm').subClass({
    imageMagick: true
});

const MIN_DICTIONARY_COUNT = 3;

const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY;
const FLICKR_API_KEY = process.env.FLICKR_API_KEY;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var synchronizer = new EventEmitter();

var nameGenerators = [
   function() {     //The Nouns
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural' + '&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            synchronizer.searchTerm = JSON.parse(data).word.capitalize();
            synchronizer.bandName = 'The ' + synchronizer.searchTerm;
            synchronizer.emit('gotWord');
        });
    },
    function() {    //The Adjective Nouns
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
    function() {    //Nouns of Noun
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
    function() {    //Proper Noun the Noun
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
    function() {    //Noun-number
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            synchronizer.searchTerm = JSON.parse(data).word.capitalize();
            synchronizer.bandName = synchronizer.searchTerm + '-' + Math.floor(Math.random() * 999 + 1);
            synchronizer.emit('gotWord');
        });
    },
    function() {    //Adjective Noun
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
    }
];

function generateBandName() {
    nameGenerators[Math.floor(Math.random() * nameGenerators.length)]();
}

function genre() {
    var genres = ['acoustic', 'alternative', 'blues', 'country', 'electronic', 'hip-hop', 'neo-jazz', 'metal', 'pop', 'rock', 'rap', 'classical', 'folk', 'dubstep', 'crossover thrash', 'grunge', 'nu-wave', 'Christian rock', 'gospel', 'adult contemporary', 'neo-soul', 'Tex-Mex', 'dad-rock'];
    return genres[Math.floor(Math.random() * genres.length)];
}

function generateAlbumArt() {
    request('https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + FLICKR_API_KEY + '&tags=' + synchronizer.searchTerm + '&per_page=1&format=json&nojsoncallback=1', function(error, response, data) {
        setTimeout(function() {
            synchronizer.link = 'http://farm' + JSON.parse(data).photos.photo[0].farm + '.staticflickr.com/' + JSON.parse(data).photos.photo[0].server + '/' + JSON.parse(data).photos.photo[0].id + '_' + JSON.parse(data).photos.photo[0].secret + '.jpg';
            synchronizer.emit('downloaded');
        }, 500);
    });

    synchronizer.on('downloaded', function() {
        request(synchronizer.link, {
            encoding: 'binary'
        }, function(error, response, body) {
            fs.writeFile('original.jpg', body, 'binary', function(err) {});
            synchronizer.emit('saved');
        });
    });

    synchronizer.on('saved', function() {
        setTimeout(function() {
            gm('original.jpg').size(function(err, val) {
                synchronizer.midH = val.height / 2;
                synchronizer.midW = val.width / 2;
            });
            synchronizer.emit('sized');
        }, 2000);


    });

    synchronizer.on('sized', function() {
        setTimeout(function() {
            gm('original.jpg').crop(300, 300, synchronizer.midW - 150, synchronizer.midH - 150).write('resize.jpg', function(err) {});
        }, 2000);
        synchronizer.emit('ready');

    });

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

function generateTweet() {
    generateBandName();
    synchronizer.on('gotWord', function() {
        switch (Math.floor(Math.random() * 4)) {
            case 0:
                synchronizer.tweet = 'Wow! Really excited to hear new ' + genre() + ' band ' + synchronizer.bandName + "'s self-titled debut album";
                break;
            case 1:
                synchronizer.tweet = "I don't even like " + genre() + ' music, but ' + synchronizer.bandName + "'s self-titled debut album is straight fire!";
                break;
            case 2:
                synchronizer.tweet = synchronizer.bandName + "'s self-titled debut album just chaged the " + genre() + ' game forever';
                break;
            case 3:
                synchronizer.tweet = 'Absolutely loving the ' + genre() + ' sounds on ' + synchronizer.bandName + "'s self-titled debut album";
                break;
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

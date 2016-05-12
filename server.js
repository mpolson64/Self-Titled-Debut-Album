var request = require('request');
var EventEmitter = require('events').EventEmitter;

const ARCHETYPES = 7;
const MIN_DICTIONARY_COUNT = 4;

const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var body = new EventEmitter();

function theNouns() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural' + '&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName= 'The ' + JSON.parse(data).word.capitalize();
        body.emit('update');
    });
}

function theAdjectiveNouns() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=adjective&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = 'The ' + JSON.parse(data).word.capitalize();
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' ' + JSON.parse(data).word.capitalize();
            body.emit('update');
        });
    });
}

function properNounAndTheNouns() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = JSON.parse(data).word.capitalize();
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' and the ' + JSON.parse(data).word.capitalize();
            body.emit('update');
        });
    });
}

function nounsOfNoun() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = JSON.parse(data).word.capitalize();
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' of ' + JSON.parse(data).word.capitalize();
            body.emit('update');
        });
    });
}

function properNounTheNoun() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = JSON.parse(data).word.capitalize();
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' the ' + JSON.parse(data).word.capitalize();
            body.emit('update');
        });
    });
}

function nounDashNumber() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = JSON.parse(data).word.capitalize() + '-' + Math.floor(Math.random() * 999 + 1);
        body.emit('update');
    });
}

function adjectiveNoun() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=adjective&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = JSON.parse(data).word.capitalize();
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minDictionaryCount=' + MIN_DICTIONARY_COUNT + '&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' ' + JSON.parse(data).word.capitalize();
            body.emit('update');
        });
    });
}

function generateBandName() {
    switch(Math.floor(Math.random() * ARCHETYPES)) {
        case 0:
            theNouns();
            break;
        case 1:
            theAdjectiveNouns();
            break;
        case 2:
            properNounAndTheNouns();
            break;
        case 3:
            nounsOfNoun();
            break;
        case 4:
            properNounTheNoun();
            break;
        case 5:
            nounDashNumber();
            break;
        case 6:
            adjectiveNoun();
            break;
    }
}

function genre() {
    var genres = ['acoustic', 'alternative', 'blues', 'country', 'electronic', 'hip-hop', 'neo-jazz', 'metal', 'pop', 'rock', 'rap', 'classical', 'folk', 'dubstep', 'crossover thrash', 'grunge', 'nu-wave', 'Christian rock', 'gospel', 'acid jazz', 'adult contemporary', 'neo-soul', 'Tex-Mex', 'dad-rock'];
    return genres[Math.floor(Math.random() * genres.length)];
}

generateBandName();

body.on('update', function() {
    console.log('New ' + genre() + ' band called ' + body.bandName);
});

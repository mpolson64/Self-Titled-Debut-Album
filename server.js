var request = require('request');
var EventEmitter = require('events').EventEmitter;

const ARCHETYPES = 4;

const WORDNIK_API_KEY = process.env.WORDNIK_API_KEY;

var body = new EventEmitter();

function theNouns() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName= 'The ' + JSON.parse(data).word;
        body.emit('update');
    });
}

function theAdjectiveNouns() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=adjective&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = 'The ' + JSON.parse(data).word;
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' ' + JSON.parse(data).word;
            body.emit('update');
        });
    });
}

function properNounAndTheNouns() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=proper-noun&excludePartOfSpeach=proper-noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = JSON.parse(data).word;
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' and the ' + JSON.parse(data).word;
            body.emit('update');
        });
    });
}

function nounsOfNouns() {
    request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=noun-plural&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
        body.bandName = JSON.parse(data).word;
        body.emit('subUpdate');
    });
    body.on('subUpdate', function() {
        request('https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=noun&api_key=' + WORDNIK_API_KEY, function(error, response, data) {
            body.bandName += ' of ' + JSON.parse(data).word;
            body.emit('update');
        });
    });
}

function generate() {
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
            nounsOfNouns();
            break;
    }
}


generate();

body.on('update', function() {
    console.log(body.bandName);
});

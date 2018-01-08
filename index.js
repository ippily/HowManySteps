'use strict';
var Alexa = require('alexa-sdk');
var GoogleMapsAPI = require('googlemaps');

// json files
var cities = require('cities.json');
var promptPhrases = require('promptPhrases.json');

var GOOGLE_API_KEY = 'AIzaSyCXNeYsacckhQ5e3Kp5f-4ZJez_si5gQYY';
var APP_ID = "amzn1.ask.skill.bdb46a77-6e06-4e5e-8e7f-5f67d148a287";
var SKILL_NAME = "How Many Steps";

var publicConfig = {
    key: GOOGLE_API_KEY,
    stagger_time:       100, // for elevationPath
    encode_polylines:   false,
    secure:             true, // use https
};

var gmAPI = new GoogleMapsAPI(publicConfig);
var stepsPerKm = 1320;

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var cityArray = cities.name;
var city1;
var city2;

function random_item(items) {
    return items[Math.floor(Math.random()*items.length)];
}
    
function getTwoCities() {
    city1 = random_item(cityArray);

    do {
      city2 = random_item(cityArray);
      console.log(city1 + " " + city2);
    
    } while(city1 == city2); 
}

var handlers = {
    'LaunchRequest': function () {
        getTwoCities();
        this.attributes["speechOutput"] = "Welcome to " + SKILL_NAME + ". You can ask me a question like, how many steps does it take from " + city1 + " to " + city2 + ". Or try saying, tell me a fact to find out.";
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
    },
    'HowManyStepsIntent': function () {
        var USplaceOne = this.event.request.intent.slots.USplaceOne.value;
        var USplaceTwo = this.event.request.intent.slots.USplaceTwo.value;

        var EUplaceOne = this.event.request.intent.slots.EUplaceOne.value;
        var EUplaceTwo = this.event.request.intent.slots.EUplaceTwo.value;

        var self = this;

        if (USplaceOne!=undefined && USplaceTwo!=undefined) {
            checkCities(USplaceOne, USplaceTwo, self);
        } else if (EUplaceOne!=undefined && EUplaceTwo!=undefined) {
            checkCities(EUplaceOne, EUplaceTwo, self);
        } else {
            self.emit('DiffRegionError');
        }

        function checkCities(origin, destination, self) {
            if (origin==undefined || destination==undefined) {
                self.emit('Unhandled');
            } else if (origin == destination) {
                self.emit('SameCitiesError');
            } else {
                var params = {
                    origins: origin,
                    destinations: destination,
                    units: 'metric'
                };

                gmAPI.distance(params, function(err, result){
                console.log("err: "+err);
                console.log("result: "+result);
                console.log("is result ok: "+result.status);

                var arry = result.rows[0].elements;

                if(arry[0].distance==undefined || arry[0].duration==undefined){
                    self.emit('CantTravelError');
                }
                else {
                    var distance = arry[0].distance.value;
                    var divideDistance = distance / 1000;
                    var roundedDistance = Math.round(divideDistance);
                    var totalSteps = roundedDistance * stepsPerKm;
                    console.log("Steps is: " + totalSteps);
                    var totalResult = "It takes an average of " + totalSteps.toString() + " steps from " + params.origins + " to " + params.destinations + ".";
                    console.log(totalResult);
                    var phrase = random_item(promptPhrases.phrase);
                    self.emit(':tell',totalResult + " " + phrase);
                }
              });
            }
        }
    },
    'TellFactIntent': function () {
        getTwoCities();
        var self = this;
        function tellFact(origin, destination, self) {
            if (origin==undefined || destination==undefined) {
                self.emit('Unhandled');
            } else {
                var params = {
                    origins: origin + ", USA",
                    destinations: destination + ", USA",
                    units: 'metric'
                };

                gmAPI.distance(params, function(err, result){
                console.log("err: "+err);
                console.log("result: "+result);
                console.log("is result ok: "+result.status);

                var arry = result.rows[0].elements;

                if(arry[0].distance==undefined || arry[0].duration==undefined){
                    self.emit('CantTravelError');
                }
                else {
                    var distance = arry[0].distance.value;
                    var divideDistance = distance / 1000;
                    var roundedDistance = Math.round(divideDistance);
                    var totalSteps = roundedDistance * stepsPerKm;
                    console.log("Steps is: " + totalSteps);
                    var totalResult = "It takes an average of " + totalSteps.toString() + " steps from " + params.origins + " to " + params.destinations + ".";
                    console.log(totalResult);
                    var phrase = random_item(promptPhrases.phrase);
                    self.emit(':tell',totalResult + " " + phrase);
                }
              });
            }
        }
        
        tellFact(city1, city2, self);
    },
    'SupportedCitiesIntent': function () {
        this.emit(':tell', "Currently I can tell you the number of steps between cities or places in Europe or the United States of America.");
    },
    'AMAZON.HelpIntent': function () {
        getTwoCities();
        this.emit(':ask', "Just tell me two places or cities such as " + city1 + " and " + city2 + " to get the average number of steps between them.");
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', "Goodbye!");
        this.emit('SessionEndedRequest');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', "Goodbye!");
        this.emit('SessionEndedRequest');
    },
    'DiffRegionError': function () {
        getTwoCities();
        this.emit(':tell', "Please try two places in the same region or country. Say something like how many steps between " + city1 + " and " + city2 + "?");
    },
    'SameCitiesError': function () {
        this.emit(':tell', "Sorry, but you can\'t walk to the same place!, Please try again.");
    },
    'CantTravelError': function() {
        this.emit(':tell', 'Sorry, I don\'t know if you can walk between those cities. Please try again.');
    },
    'Unhandled': function() {
        this.emit(':tell', 'Sorry, I don\'t understand. Please try again.');
    }
};

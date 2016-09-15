var tmi = require("tmi.js");
var config = require("./config");
var RateLimiter = require('limiter').RateLimiter;
// Allow 150 requests per hour (the Twitter search limit). Also understands
// 'second', 'minute', 'day', or a number of milliseconds
var limiter = new RateLimiter(3, 5000);

var options = {
  options: {
    debug: true
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: config.twitch.username,
    password: "oauth:"+config.twitch.chatoauth
  },
  channels: ["#saaitv"]
};

var client = new tmi.client(options);

client.on("chat", function (channel, user, message, self) {
  //Don't listen to my own messages...
  if (self) return;
  // Saves message into array
  // Saves first word to 'command' sans first character
  // Checks if there is more than one word and saves to hasParams
  var parameters = message.split(' '),
  command = parameters.shift().slice(1).toLowerCase(),
  hasParams = parameters.length > 0;
  // Checks if message is calling a command
  if(message[0] === "!"){
    switch (command) {
      case "quality":
        sendMessage(channel, "@"+user.username+": I stream at 960x540@48fps using the 'Low-latency High Quality' NVENC preset");
        break;
      case "discord":
        sendMessage(channel, "@"+user.username+": Discord Invite Link: https://discord.gg/eFQXEzM");
        break;
      case "schedule":
        sendMessage(channel, "@"+user.username+": LUL Saai streaming on a schedule LUL");
        break;
    }
  }

  if (command === 'game') {
    if (hasParams && user.mod) {
      setInfo(channel, command, parameters.join(' '));
    } else {
      getInfo(channel, command);
    }
  } else if (command === "title"){
    if (hasParams && user.mod) {
      setInfo(channel, "status", parameters.join(' '));
    } else {
      getInfo(channel, command);
    }
  }
});

function setInfo(channel, command, info){
  // Makes info URL safe
  uriInfo = encodeURIComponent(info);
  // Horribly hacked together code to change title/game
  client.api({
    url: "https://api.twitch.tv/kraken/channels/"+config.twitch.channelname+"?channel["+command+"]="
    +uriInfo+"&_method=put&oauth_token="+config.twitch.appoauth,
  }, function(err, res, body) {
      console.log(body);
      sendMessage(channel, ""+command.capitalizeFirstLetter()+" is set to: "+info);
  });
}

function getInfo(channel, command){
  // Horribly hacked together code to retrieve title/game
  client.api({
    url: "https://api.twitch.tv/kraken/channels/"+config.twitch.channelname+"?client_id="+config.twitch.clientid,
  }, function(err, res, body) {
    if (command === "game"){
      sendMessage(channel, "Current Game: "+body.game);
    } else {
      sendMessage(channel, "Current Title: "+body.status);
    }
  });
}

function sendMessage(channel, message){
  // Throttle requests
  limiter.removeTokens(1, function(err, remainingRequests) {
    if (remainingRequests < 1) {
    console.log("Rate-limit reached");
  } else {
    client.say(channel, message);
  }
  });
}

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

client.connect();

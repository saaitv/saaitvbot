var tmi = require("tmi.js");
var config = require("./config");

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

  var parameters = message.split(' '),
  command = parameters.shift().slice(1).toLowerCase(),
  hasParams = parameters.length > 0;

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

  if (!user.mod) return;
  if (command === 'game') {
    if (hasParams) {
      setInfo(channel, command, parameters.join(' '));
    } else {
      getInfo(channel, command);
    }
  } else if (command === "title"){
    if (hasParams) {
      setInfo(channel, "status", parameters.join(' '));
    } else {
      getInfo(channel, command);
    }
  }
});

function setInfo(channel, command, info){
  uriInfo = encodeURIComponent(info);
  client.api({
    url: "https://api.twitch.tv/kraken/channels/"+config.twitch.channelname+"?channel["+command+"]="
    +uriInfo+"&_method=put&oauth_token="+config.twitch.appoauth+"&client_id="+config.twitch.clientid,
  }, function(err, res, body) {
      console.log(body);
      sendMessage(channel, ""+command.capitalizeFirstLetter()+" is set to: "+info);
  });
}

function getInfo(channel, command){
  client.api({
    url: "https://api.twitch.tv/kraken/channels/"+config.twitch.channelname
  }, function(err, res, body) {
    if (command === "game"){
      sendMessage(channel, "Current Game: "+body.game);
    } else {
      sendMessage(channel, "Current Title: "+body.status);
    }
  });
}

function sendMessage(channel, message){
  client.say(channel, message).then(function(data){
    // data returns [channel]
  }).catch(function(err){
    //
  });
}

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

client.connect();

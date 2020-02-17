var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var path = require('path');
const LastFM = require('last-fm')
const lastfm = new LastFM('cd928d90e6fc540102f0d88289b17e85', {
  userAgent: 'DemoApp/1.0.0 (https://secure-fjord-16878.herokuapp.com/)'
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

let FACEBOOK_VERIFY_TOKEN = "zxcasdqwe";
let FACEBOOK_PAGE_ACCESS_TOKEN = "EAAMLsUAFrJABAIdYocZBM6LTJCFZA8zIUEVZCLJnrhT3RGQtIIs5ZBOGc7HJPRZBtxVmCxCoTp5BlfBfEl0t7FaCOBpVJYJeFu3Lth2uFxtlMPtEyd34W7roGjGxEbqZC8Xtn9bXq4uykOIWUcpspcget8vDshEoBe3saZCsWdLtgZDZD";
let FACEBOOK_SEND_MESSAGE_URL = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + FACEBOOK_PAGE_ACCESS_TOKEN;
let LAST_FM_URL = 'https://www.last.fm/music/';

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/webhook/', function(request, response) {
  if (request.query['hub.verify_token'] == FACEBOOK_VERIFY_TOKEN) {
    response.send(request.query['hub.challenge'])
  }
  res.send('Error, wrong token')
});

app.get('/privacy', function(req, res) {
  res.sendFile(path.join(__dirname, 'views', 'pages', 'privacy.html'));
});

app.post('/webhook', function(req, res) {
  if (req.body.object === 'page') {
    if (req.body.entry) {
      req.body.entry.forEach(function(entry) {
        if (entry.messaging) {
          entry.messaging.forEach(function(messagingObject) {
            var senderId = messagingObject.sender.id;
            if (messagingObject.message) {
              var musicName = messagingObject.message.text;
              fetchData(senderId, musicName);
            } else if (messagingObject.postback) {
              console.log('Recieved postback');

            }
          });
        } else {
          console.log('no message key found');
        }
      });
    } else {
      console.log('no entry key found');
    }
  } else {

  }
  res.status(200).send();
});

function sendMessageToUser(senderId, message) {
  request({
    url: FACEBOOK_SEND_MESSAGE_URL,
    method: 'POST',
    json: {
      "recipient": {
        "id": senderId
      },
      "message": {
        "text": message
      }
    }

  }, function(error, response, body) {
    if (error) {
      console.log('Error sending UIMESSAGE to User ' + JSON.stringify(error));
    } else if (response.body.error) {
      console.log('Error sending UImessage' + JSON.stringify(response.body.error));
    }
  });
}

function fetchData(senderId, musicName) {
  showTypingIndicatorToUser(senderId, true);
  var opts = {
    q: musicName
  };
  lastfm.trackSearch(opts, (err, data) => {
    showTypingIndicatorToUser(senderId, false);
    if (err) {
      console.error(err)
    } else {
      fetchingData(senderId, data);
    }
  });
}

function fetchingData(senderId, body) {
  var elements = [];
  if (body.result) {
    if (body.result.length > 0) {
      console.log('under result');
      var lengthOfResult = body.result.length > 10 ? 10 : body.result.length;
      for (i = 0; i < lengthOfResult; i++) {
        elements.push(formingElements(body.result[i]));
      }
      sendTemplateResponse(senderId, elements);
    } else {
      sendMessageToUser(senderId, 'Couldn\'t find info');
    }

  }
}

function formingElements(result) {
  var musicName = result.name;
  var artistName = result.artistName;
  var posterPath;

  if (result.images.length == 0 || result.images == undefined) {
    posterPath = 'https://images.pexels.com/photos/3104/black-and-white-music-headphones-life.jpg?h=350&auto=compress&cs=tinysrgb';
  } else {
    posterPath = result.images[2];
  }

  var musicNameArray = musicName.split(' ');
  var artistNameArray = artistName.split(' ');
  var musicNameUrl = musicNameArray.join('+');
  var artistNameUrl = artistNameArray.join('+');

  return {
    title: musicName,
    subtitle: artistName,
    image_url: posterPath,
    buttons: [{
      "type": "web_url",
      "url": LAST_FM_URL + artistNameUrl + '/_/' + musicNameUrl,
      "title": "More Details"
    }]
  }
}

function sendTemplateResponse(senderId, elementList) {
  request({
    url: FACEBOOK_SEND_MESSAGE_URL,
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: elementList


          }
        }
      }

    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending UIMESSAGE to User ' + error.toString());
    } else if (response.body.error) {
      console.log('Error sending UImessage under sendTemplateResponse' + JSON.stringify(response.body.error));
    }
    //ignore
  });
}

function showTypingIndicatorToUser(senderId, isTyping) {
  var senderAction = isTyping ? 'typing_on' : 'typing_off';
  request({
    url: FACEBOOK_SEND_MESSAGE_URL,
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      sender_action: senderAction
    }

  }, function(error, response, body) {
    if (error) {
      console.log('sending Typing indicator to user ' + error);
    } else if (response.body.error) {
      console.log('Error sending typing indicator' + response.body.error);
    }
  });

}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
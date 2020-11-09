

'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; //codigo de accesso a pagina do facebook 

const 
  request = require('request'),
  express = require('express'),
  fetch = require('node-fetch'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server


app.listen(process.env.PORT || 1337, () => console.log('webhook is listening')); //setando a porta do servidor e logs de mensagem quando a comunicação for bem sucedida 


app.post('/webhook', (req, res) => {  //aceitando POST's requests no /webhook 

  let body = req.body; //analisa os body request do metodo POST

  if (body.object === 'page') { //faz a checagem para ver se os eventos do webhook vem de uma subspcription page.

    body.entry.forEach(function(entry) {

      let webhook_event = entry.messaging[0]; //pega o body do evento do webhook
      console.log(webhook_event);


      let sender_psid = webhook_event.sender.id; //adquire o PSID
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) { //checa se o evento é uma mensagem ou um postback e trata ela de acordo com sua handler function
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });
    
    res.status(200).send('EVENT_RECEIVED'); //retorna um '200 OK' como response para todos os eventos

  } else {
    
    res.sendStatus(404); //retorna um '404 Not found' se o evento nao é de uma subscription page.
  }

});


app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "zxcasdqwe"; //faz o update do token de vericação
  
  // Analisa os parametros do request de verificação do webhook 
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  //checa de um TOKEN e um modo foi enviado  
  if (mode && token) { 
  
    // checa se o modo e o TOKEN são corretos
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // retorna '200 OK' e faz 1 request challenge token
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Retorna '403 Forbidden' se os tokens nao verificarem 
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;
  global.result;
  if (received_message.text) {    
    // Cria um payload para uma mensagem básica de texto a qual vai ser adicionada para o body do seu request para enviar à API
    
    
    request.post({ //realiza um POST para o raspberry com a mensagem enviada pelo usuario do messenger
    url: "http://2c3da10898e8.ngrok.io/receber", 

      json: {
        "led": received_message.text
      }
    
   }, function(error,response,body,result){
      console.log(body)
    response = {
      "text": body //realiza o response de acordo com o que o raspberry enviar.
    };
    global.result = response;
    

    callSendAPI(sender_psid, global.result);  
    });
    
    
    
  }  
  
  // Send the response message
  callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Pega o payload do postback
  let payload = received_postback.payload;

  // Seta um response de acordo com o postback payload
  
  // envia a mensagem para reconhecer o postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // construção do corpo da mensagem
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // envia um HTTP request para a plataforma do messenger
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

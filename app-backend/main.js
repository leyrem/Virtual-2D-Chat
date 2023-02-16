

var WebSocket = require('../node_modules/ws');
var WebSocketServer = WebSocket.Server;
var DATABASE_MANAGER = require('./credentials.js').DATABASE_MANAGER;

var MYSERVER = require('./myserver.js').MYSERVER;
var queryString = require('querystring'),
            url	= require('url'),
            http = require('http'),
            express = require('express');



// Init http server
const serverH = http.createServer();
// Init websocket instance
const wss = new WebSocketServer({ server: serverH });

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

wss.on('connection', function (ws, req) {
    MYSERVER.onUserConnect(ws, req);

    ws.on('message', function( msg ) {
        if(!isJson(msg)) {
            console.log("Error, can only deal with JSON messages, ignoring...");
            return;
        }
        MYSERVER.onUserMessage(ws, msg);
    });

    ws.on('close', function() {
        MYSERVER.onUserDisconnect(ws);
    });

    ws.on('error', function( event ) {
        MYSERVER.onUserDisconnect(ws, event);
    });
    
});

wss.on('close', function(e) {
    DATABASE_MANAGER.quit();
});

serverH.listen( 8080 , function() {
    MYSERVER.init();
    MYSERVER.onReady();
    // Connect to DB 
    DATABASE_MANAGER.init();
    console.log("[Server] VirtualServer listening!");
});
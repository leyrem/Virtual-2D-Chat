var Room = require('../public/room.js');
var WORLD = Room.WORLD;
const fs = require('fs');

var queryString = require('querystring'),
            url	= require('url'),
            http = require('http');
			WebSocket = require('../node_modules/ws');

var MYSERVER = {
    clients: {},
    rooms: {}, // or {} ??
    DB: {msgs: []},
    last_id: 1, // ID to assing to new users
    MAX_BUFFER: 100,// Max number of messages that can be buffered
    // Map to store each username per userid
    clientIDtoUsername: new Map(),

    init: function()
    {
        console.log("Initializing server...");
		// TODO:
		// Tengo un world en servidor y un world en cliente y hay que manternerlos synchornized
		const data = fs.readFileSync('../public/world.json');
		WORLD.fromJSON(JSON.parse(data));
		console.log("Number of rooms: " + Object.keys( WORLD.rooms ).length);
	},

    onReady: function() 
    {
		// TODO: llamar esta fucnion en main ?? 
        console.log("Server is ready!");
		//this.interval = setInterval(MYSERVER.onTick.bind(MYSERVER), 1000 / 10 ); // 10 times per second
	},

    onUserConnect: function( conn, req )
    {
        console.log("[server] NEW USER CONNECTED");

        // Assing callbacks to client connection
        conn.sendToClient = function( type, data ) {
            console.log("[server] Sending " + type + " to client, data is: " + data);
			var msgT = { 
				user_id: this.user_id.toString(),
				type: type,
				data: data
			};
			this.send(JSON.stringify(msgT));
        };

        // Get room name and user name
		// Get info from url
		// I am assuming the info is sent as room_name+user_name by the client
    	var path_info = url.parse( req.url );
		var sent_info = path_info.pathname.split("+");
		var room_name = sent_info[0];
		var user_name = sent_info[1];
        // Assing room_name to client connection
		conn.room_name = room_name.substr(1, room_name.length); //strip the dash
        // Assing ID to client connection
        conn.user_id = this.last_id;
        this.last_id++;
        //Assing user_name to client connection
        conn.user_name = user_name;

        this.clientIDtoUsername.set(conn.user_id.toString(), conn.user_name);

        // Send ID to client
        conn.sendToClient("USER_ID", conn.user_id.toString());

        // Add client to room (or create it)
        if(this.rooms[conn.room_name] == null) this.createRoom(conn.room_name);
		var room = this.rooms[conn.room_name];
		room.clients[conn.user_id] =  conn; // Add client to room
		this.clients[conn.user_id] =  conn; // Add client to server

		// TODO:
		// Create a user for the new client
		var user = new Room.User(conn.user_name);
		user.id = conn.user_id;							// when user connects to server, draw him/store him in the default room (should be loaded from JSON represenytation of world)
		var room_s = WORLD.getRoom(WORLD.default_room); // TODO: why storing in the default room and not on the room you pass?
		//var room_s = WORLD.default_room
		console.log("Adding user to room: " + room_s.name);
		WORLD.addUser( user, room_s);
		//room_s.addUser(user); // WORLD.addUser is called in the client??
		conn.user = user; // Store the user class instace object in the connection websocket
		// //user._connection = conn;
		// Iterate through room.people and send the login to the people stored there.
		// Send the characteristics of the room to the clieny too --> check video
		// The client will call WORLD.createRoom when joining a new room with the data the server sends him

        // send room info
		this.sendRoomInfo(conn);
		// send login info
		this.sendLoginInfo(conn);
	
        // Send all buffered messages in the room to client
		for(var i = 0; i < room.buffer.length; ++i)
            conn.sendToClient("CHAT_MSG", room.buffer[i]);

    },

	sendRoomInfo: function( conn ) 
	{
		var clients = this.rooms[conn.room_name].clients;
		var room_info = { name: conn.room_name, clients: [] };
		for(const i in clients)
			room_info.clients.push({ user_id: clients[i].user_id, user_name: clients[i].user_name });
		conn.sendToClient( "ROOM_INFO", JSON.stringify( room_info ) );
	},

	sendLoginInfo: function( conn )
	{
		this.sendToRoom(conn.room_name, conn.user_id.toString(), true, "LOGIN", conn.user_name, null);
	},

    createRoom: function( name ) 
    {
        console.log(" [server] Room created: " + name );
		this.rooms[name] = { clients: {}, buffer:[] };
    },

    onUserDisconnect: function( conn )
    {
        console.log("User disconnected");
        console.log('[server] Close socket of user_id: ' + conn.user_id);

        if(this.clientIDtoUsername.has(conn.user_id.toString()))
				this.sendToRoom(conn.room_name, conn.user_id.toString(), true, "LOGOUT", conn.user_id.toString(), null);
			else
				this.sendToRoom(conn.room_name, conn.user_id.toString(), true, "LOGOUT", conn.user_id.toString(), null);
	
			var room = this.rooms[conn.room_name];
			if(room)
			{
				delete room.clients[conn.user_id];
				if(Object.keys(room.clients).length == 0)
					delete this.rooms[conn.room_name];
			}
			delete this.clients[conn.user_id];

    },

    onUserMessage: function( ws, msg )
    {
        const msgReceived = JSON.parse(msg);
		console.log(" [server] (onUserMessage) MSG received: ", msgReceived);
        // MSGS received sent by client are like this:
			// newMsg = {
				// createNewRoom: true/false
			// 	isSentToAll: true/fañse,
			// 	target: null,
			// 	msgData: msg
			// }
		var parsedTemp = JSON.parse(msgReceived.msgData);

		if(msgReceived.createNewRoom) {
			this.changeRoom(msgReceived.msgData);
		} else if (msgReceived.type == "action") { // TODO: hacer esto conforme a mi protocolo de mensajes
			console.log();
		} else if(parsedTemp.type == "movement"){
			this.sendToRoom(ws.room_name, ws.user_id.toString(), msgReceived.isSentToAll, "movement", msgReceived.msgData, msgReceived.target);
		} else {
			this.sendToRoom(ws.room_name, ws.user_id.toString(), msgReceived.isSentToAll, "CHAT_MSG", msgReceived.msgData, msgReceived.target);
		}
    },
    sendToRoom: function( roomName, userID, sendAll, event, data, target_id )
    {
        console.log("[server] Sending " +  event + " to room " + roomName + " with data: " +  data);

		if(data === undefined)
			return;

		var room = this.rooms[roomName];
		if(!room)
			return;
	
		// Only buffering room messages sent to all	
		if( event == "CHAT_MSG" && sendAll ) {
			if(room.buffer.length > this.MAX_BUFFER)
				room.buffer.shift();
			room.buffer.push(data);
		}

		// Broadcast to all clients in the room
		for(const i in room.clients)
		{
			client = room.clients[i];
			if(client.readyState != WebSocket.OPEN)
				continue;

			if(!sendAll) {
				console.log("Sending private msg to: " + target_id);
				console.log("Client id is: " + client.user_id);
				// Can only send messages to users in the current room
				if( target_id == client.user_id ) {
					console.log("IN");
					if ( client.user_id != userID ) {
						var msgB = { 
							user_id: userID,
							type: "CHAT_MSG",
							data: data
						};
						client.send( JSON.stringify(msgB) );
					}
				}
				continue;
			}
			// Do not send to yourself	
			if ( client.user_id != userID ) {
				var msgS = {
					user_id: userID,
					type: event,
					data: data
				}
				client.send(JSON.stringify(msgS));
			}		
		}
    },
	changeRoom: function( data ) 
	{
		// msgData: { 
		// 	new_room_name: new_room_name,
		// 	user_id: this.user_id,
		// }
		var client_conn = this.clients[data.user_id];
		if(!client_conn)
			throw("Error client connection does not exist for user id in changeRoom");

		if(data.user_id != client_conn.user_id)
			throw("Error with Ids when changing room");
	

		// Remove client for current room 
		delete this.rooms[client_conn.room_name].clients[data.user_id];
		// Inform users in old room the user left
		this.sendToRoom(client_conn.room_name, client_conn.user_id.toString(), true, "LOGOUT", client_conn.user_id.toString(), null);

		 // Add client to room (or create it)
		 if(this.rooms[data.new_room_name] == null) this.createRoom(data.new_room_name);
		 var room = this.rooms[data.new_room_name];
		 room.clients[data.user_id] =  client_conn; // Add client to room

		client_conn.room_name = data.new_room_name;

		// Inform all users in the new joined room a new user just joined
		this.sendRoomInfo(client_conn);
		// Send client the info of the room he/she just joined
		this.sendLoginInfo(client_conn);

		 // Send all buffered messages in the room to client
		for(var i = 0; i < room.buffer.length; ++i)
			client_conn.sendToClient("CHAT_MSG", room.buffer[i]);

	},
	onTick: function() // send to client heatbearts of the current state of the server
	{
		for(const i in this.clients)
		{
			client_conn = this.clients[i];
			var user = client_conn.user;
			var room = WORLD.getRoom(user.room);
			if(!room) // user is not in any room
				continue;

			//console.log("Room: " + room.name + ", length: " + room.people.length);
			this.sendRoomState(room, client_conn);
		}
	},
	sendRoomState: function(room, connection)
	{ // I have to send info to the client about his state and the state of the room he is in 
		// Sending the state to every user in the room
		var user = connection.user;
		// TODO: hacer este mensaje conforme a mi protocolo

		var data = {
			user_id: "server",
			type: "UPDATE",
			data: user, // TODO:send the whole user obj?
			people: []
		};
		for(var i = 0; i < room.people.length; i ++ )
		{
			var user_id = room.people[i]; 
			var user = WORLD.getUserById(user_id);
			if(!user)
				continue;
			data.people.push(user);
		}
		connection.send(JSON.stringify(data));
	},
};

module.exports = { MYSERVER };
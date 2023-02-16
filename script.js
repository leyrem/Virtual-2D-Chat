

// Namespace that includes the whole functionality of the chat
const MYCHAT = {
  // Total number of chats on the side menu
  numChats: 0,
  // Current selected chat on the side menu
  selected: 0,
  // Previous selected chat on the side menu
  previousSelected: 0,
  // Current private chat selected user name
  currentPrivateUserName: '',
  // Map to store private chats' user IDs and order of chat in left menu
  privateMsgsReceived: new Map(),
  // Map to store the correspondence between userName and userID
  mapNamewithIRev: new Map(),
  // Map to store chat html
  mapMsgs: new Map(),
  //server: null,
  myUser: '',
  myUserID: '',
  init: function()
  {
    // Storing the content of the main chat area
    // MYCHAT.mapMsgs.set(1, document.getElementById('chat_msg').innerHTML);

    // Hiding display at first until log in
    //document.getElementById('app-page').style.display = 'none';

    // Add new private chatroom
    //const form = document.getElementById('form-add');
    //form.addEventListener('submit', MYCHAT.createPrivateChat);
    //$('#btn-add-chat').click(MYCHAT.openAddForm);

    // Join chat
    $('#send-button-join').click(MYCHAT.addChatroom);
    $('#on-join-input-userName').on('keypress', function(e) {
      if (e.which == 13) MYCHAT.addChatroom();
    });
    $('#on-join-input-password').on('keypress', function(e) {
      if (e.which == 13) MYCHAT.addChatroom();
    });

    // Send messages
    $('#send_button').click(MYCHAT.sendMessage);
    $('#msg-input').on('keypress', function(e) {
      if (e.which == 13) MYCHAT.sendMessage(false);
    });

  },
  createChat: function(roomName)
  {
    // // Storing the state of variables to be able to change chat
    // MYCHAT.previousSelected = MYCHAT.numChats;
    // MYCHAT.numChats = MYCHAT.numChats + 1;
    // MYCHAT.selected = MYCHAT.numChats;

    // // Creating the chat HTML
    // const contentDiv = document.createElement('div');
    // contentDiv.className = 'chat-side';
    // contentDiv.onclick = function() {
    //   MYCHAT.selectedChange(parseInt(this.id.charAt(this.id.length-1)));
    //   MYCHAT.selectChat();
    // };
    // contentDiv.id = `chat${MYCHAT.numChats}`;
    // contentDiv.style = `order: ${MYCHAT.numChats};`;
    // const imgDiv = document.createElement('div');
    // imgDiv.className = 'profile_img';
    // imgDiv.style = 'order:0;';
    // const img = document.createElement('img');
    // img.src = 'images/pic01.jpg';
    // imgDiv.appendChild(img);
    // const nameDiv = document.createElement('div');
    // nameDiv.className = 'profile_name';
    // nameDiv.style = 'order:1;';
    // const p = document.createElement('p');
    // p.style ='font-size: 20px';
    // p.id = `chat${MYCHAT.numChats}_name`;
    // p.innerHTML = roomName;
    // nameDiv.appendChild(p);
    // const pServer = document.createElement('p');
    // pServer.style ='font-size: 10px';
    // pServer.id = `chat${MYCHAT.numChats}_server_info`;
    // nameDiv.appendChild(pServer);
    // contentDiv.appendChild(imgDiv);
    // contentDiv.appendChild(nameDiv);
    // // TODO: FIX THIS
    // //document.getElementsByClassName('left_menu')[0].appendChild(contentDiv);

    // MYCHAT.mapMsgs.set(MYCHAT.selected, '');
    // // TODO: fix this
    // //MYCHAT.selectChat();
  },
  addChatroom: function()
  {
    const userName = $('#on-join-input-userName').val();
    const password = $('#on-join-input-password').val();
    // If the input is empty, do not add
    if (userName =='' || password == '') return;

    MYCHAT.myUser = userName;
    

    fetch("./public/world.json")
    .then(function(resp) {
            return resp.json();
        }).then(function(json) {
            WORLD.fromJSON(json);
            MYAPP.onWorldLoaded();

            var roomName = WORLD.default_room;
            console.log("woldd; " +JSON.stringify(json));

            // Create the HTML for the chat
            MYCHAT.createChat(roomName);
            // Hide the init screen
            document.getElementById('login-page').style.display = 'none';
            MYCHAT.selected = 1;
            // Connect to the server
            MYCHAT.connectServer(userName, roomName, password);
        }).catch( function(error){
          console.log("Error in fecth:" + error);
        }
        );



  },
  connectServer: function(userName, roomName, password)
  {

    //MYAPP.init();
    $('#chat-connected-msg-status').html(`NOT CONNECTED :(`);

    //const server = new VirtualClient();
    // The full url used will be ws://localhost:1337/roomName+userName
    //server.connect( 'localhost:1337', roomName, userName);
    // server.connect('ecv-etic.upf.edu/node/9018', roomName, userName);
    MYCLIENT.connect('localhost:8080', roomName, userName, password);

    //$(`#chat${MYCHAT.selected}_server_info`).html( 'Connecting...' );

    MYCLIENT.on_connect = function( server ) {
      //$(`#chat${MYCHAT.selected}_server_info`).html( 'Connected!');
      $('#chat-connected-msg').html(`You are connected to room: ${roomName}`);
      $('#chat-connected-msg-status').html(`CONNECTED :)`);
      $('#add-chat-div').css('display', 'flex');
    };

    MYCLIENT.on_auth = function( is_valid ) {
      if(is_valid == true) {
        alert("Correct password");
      } else {
        alert("Incorrect password, try again!");
        location.reload(); // Reload page
      }
    }
    MYCLIENT.on_ready = function(id) {
      $('#chat-connected-msg-userName').html(`Your userName is: ${userName}`);
      $('#chat-connected-msg-userID').html(`Your userID is: ${id}`);
      MYCHAT.myUserID = id;
      MYCHAT.mapNamewithIRev.set(userName, id);
      MYCLIENT.on_room_info = MYCHAT.onRoomInfo;
      MYCLIENT.on_user_connected = MYCHAT.onUserConnect;
      MYCLIENT.on_user_disconnected = MYCHAT.onUserDisconnect;
      MYCLIENT.on_message = MYCHAT.onNewMessageReceived;
      MYCLIENT.on_close = MYCHAT.onClose;
      MYAPP.my_user = new User(userName);
      MYAPP.my_user.id = id;
      WORLD.addUser(MYAPP.my_user, MYAPP.current_room);
    };
    //MYCHAT.server = server;
  },
  onRoomInfo: function ( room_info )
  {
    for (var i = 0; i < room_info.clients.length; i++ ) {
      if(room_info.clients[i].user_id != MYCHAT.myUserID) {
        var new_user = new User(room_info.clients[i].user_name);
        new_user.id = room_info.clients[i].user_id;
        WORLD.addUser(new_user, MYAPP.current_room);
        MYCHAT.mapNamewithIRev.set(room_info.clients[i].user_name, room_info.clients[i].user_id);
        MYCHAT.addUserInForm(room_info.clients[i].user_name);
      }
    } 
  },
  onUserConnect: function(userID, userName)
  {
    MYCHAT.mapNamewithIRev.set(userName, userID);
    MYCHAT.sendSysMsg('User ' + userID + ' with user name: ' + userName + ',  connected!', userID, MYCHAT.currentTime());
    MYCHAT.addUserInForm(userName);

    var new_user = new User("Leyre");
    new_user.id = userID;
    //MYAPP.current_room.addUser(new_user);
    WORLD.addUser(new_user, MYAPP.current_room);

  },
  onUserDisconnect: function(userID, userName)
  {
    MYCHAT.mapNamewithIRev.delete(userName);
    MYCHAT.sendSysMsg('User ' + userID + " with user name: " +  userName + " disconnected!", userID, MYCHAT.currentTime());
    //MYCHAT.deleteUserFromForm(userName);
    WORLD.removeUser(WORLD.getUserById(userID));
  },

  onNewMessageReceived: function(authorID, msgStr)
  {
    MYCHAT.displayMessage(JSON.parse(msgStr));
  },
  onClose: function()
  {
    alert("Server closed!");
    location.reload(); // Reload page
  },
  displayMessage: function(msg)
  {
    if ( msg.type.toLowerCase() == 'text' ) {
      if ( msg.content != '' ) {
        MYCHAT.selectedChange(1);
        //MYCHAT.selectChat();
        // Create HTML to display msg
        var contentDiv = document.createElement('div');
        var msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        contentDiv.className ='content left';
        var textP = document.createElement('p');
        textP.innerHTML = msg.content;
        var userP = document.createElement('p');
        userP.className = 'user-name left';
        userP.innerHTML = 'user: '+msg.userName;
        var timeP = document.createElement('p');
        timeP.className ='time left';
        timeP.innerHTML = msg.time;
        contentDiv.appendChild(textP);
        msgDiv.appendChild(userP);
        msgDiv.appendChild(contentDiv);
        msgDiv.appendChild(timeP);
        var chat = document.getElementById('chat_msg');
        chat.appendChild(msgDiv);
        chat.scrollTop = 100000;
      }
    } else if ( msg.type.toLowerCase() == 'sys' ) {
      if ( msg.content != '' ) {
        MYCHAT.selectedChange(1);
        //MYCHAT.selectChat();
        // Create HTML for a system msg
        var contentDiv = document.createElement('div');
        var msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        contentDiv.className ='content sys';
        var textP = document.createElement('p');
        textP.innerHTML = msg.content;
        var timeP = document.createElement('p');
        timeP.className ='time system';
        timeP.innerHTML = msg.time;
        contentDiv.appendChild(textP);
        msgDiv.appendChild(contentDiv);
        msgDiv.appendChild(timeP);
        var chat = document.getElementById('chat_msg');
        chat.appendChild(msgDiv);
        chat.scrollTop = 100000;
      }
    } else if ( msg.type.toLowerCase() == 'private' ) {
      // If the chat has already been created,
      // just switch to it, otherwise create chat
      if (MYCHAT.privateMsgsReceived.has(msg.userName)) {
        MYCHAT.selectedChange(MYCHAT.privateMsgsReceived.get(msg.userName));
        //MYCHAT.selectChat();
      } else {
        MYCHAT.createChat('Private: ' + msg.userName);
        MYCHAT.privateMsgsReceived.set(msg.userName, MYCHAT.selected);
      }

      MYCHAT.currentPrivateUserName = msg.userName;
      // Create HTML to display msg
      var contentDiv = document.createElement('div');
      var msgDiv = document.createElement('div');
      msgDiv.className = 'msg';
      contentDiv.className ='content left';
      var textP = document.createElement('p');
      textP.innerHTML = msg.content;
      var userP = document.createElement('p');
      userP.className = 'user-name left';
      userP.innerHTML = 'user: '+msg.userName;
      var timeP = document.createElement('p');
      timeP.className ='time left';
      timeP.innerHTML = msg.time;
      contentDiv.appendChild(textP);
      msgDiv.appendChild(userP);
      msgDiv.appendChild(contentDiv);
      msgDiv.appendChild(timeP);
      var chat = document.getElementById('chat_msg');
      chat.appendChild(msgDiv);
      chat.scrollTop = 100000;
    }
  },
  sendSysMsg: function(msgText, userName, time)
  {
    const msgObj = MYCHAT.createMsgObject('sys', msgText, userName, time);
    MYCHAT.displayMessage(msgObj);
  },
  sendMessage: function()
  {
    const input = $('#msg-input').val();
    if (input == '') return;
    // Create HTML to show
    const contentDiv = document.createElement('div');
    contentDiv.className ='content right';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    const textP = document.createElement('p');
    textP.innerHTML = input;
    const userP = document.createElement('p');
    userP.className = 'user-name right';
    userP.innerHTML = MYCHAT.myUser;
    const timeP = document.createElement('p');
    timeP.className ='time right';
    var cTime = MYCHAT.currentTime();
    timeP.innerHTML = cTime;
    contentDiv.appendChild(textP);
    msgDiv.appendChild(userP);
    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(timeP);
    const chat = document.getElementById('chat_msg');
    chat.appendChild(msgDiv);
    chat.scrollTop = 100000;

    // This means we are sending messages from a private chat
    if ( MYCHAT.selected > 1) {
      var msgObj = MYCHAT.createMsgObject('private', input, MYCHAT.myUser, cTime);
      MYCHAT.privateMsgsReceived.set(MYCHAT.currentPrivateUserName, MYCHAT.selected);
      const target_id = MYCHAT.mapNamewithIRev.get(MYCHAT.currentPrivateUserName);
      MYCLIENT.sendPrivateMessage(JSON.stringify(msgObj), [target_id]);
    } else {
      var msgObj = MYCHAT.createMsgObject('text', input, MYCHAT.myUser, cTime);
      MYCLIENT.sendMessage(JSON.stringify(msgObj));
    }
    $('#msg-input').val(''); // Reset the input value to empty text

  },
  currentTime: function() // Return current time in a string
  {
    const today = new Date();
    return today.getHours() + ':' + today.getMinutes();
  },
  createMsgObject: function(type, content, userName, time)
  {
    const msgObject = {
      type: type,
      content: content,
      userName: userName,
      time: time,
    };
    return msgObject;
  },
  changeMsgs: function()
  {
    MYCHAT.mapMsgs.set(MYCHAT.previousSelected, document.getElementById('chat_msg').innerHTML);
    document.getElementById('chat_msg').innerHTML = MYCHAT.mapMsgs.get(MYCHAT.selected);
  },
  fillName: function(personName)
  {
    const name = document.getElementById(personName).innerHTML;
    document.getElementById('person_name').innerHTML = name;
  },
  selectChat: function()
  {
    MYCHAT.fillName('chat'+MYCHAT.selected+'_name');
    MYCHAT.changeMsgs();
  },
  selectedChange: function(newVal)
  {
    MYCHAT.previousSelected = MYCHAT.selected;
    MYCHAT.selected = newVal;
  },
  addUserInForm: function(userName)
  {
    $('#userIDs-dropdown').append(`<option id="opt_${userName}" value="${userName}">${userName}</option>`);
  },
  deleteUserFromForm: function(userName)
  {
    document.getElementById(`opt_${userName}`).outerHTML = '';
  },
  openAddForm: function()
  {
    document.getElementById('add-private-form').style.display = 'block';
  },
  closeAddForm: function()
  {
    document.getElementById('add-private-form').style.display = 'none';
  },
  createPrivateChat: function(event)
  {
    event.preventDefault(); // Preventing page refresh
    MYCHAT.closeAddForm();
    const e = document.getElementById('userIDs-dropdown');
    const userNameSelected = e.value;
    MYCHAT.createChat('Private chat: ' + userNameSelected);
    MYCHAT.currentPrivateUserName = userNameSelected;
  },
};
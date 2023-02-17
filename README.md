# VIRTUAL 2D CHAT



## Features
- When a user logs in for the first time to the server the password that he/she enters corresponding to his/her username is stored on the databse. Once he/she tries to login eventually, he/she must introduce the same password as before.
- When a user changes a room, he/she will disconnnect from the current room he/she was in and will login into the new room, all the users in that new room will get a message indicating that the user joined. The messages and the new room name will appear on the chat front-end.
- When a user disconnects from the server, when he/she reconnects with the same user name and password, he/she will appear in the same position he/she left.
### Dependencies
- A redis should be running locally --> TODO; test this on ecv web
- Install crypto module
- 
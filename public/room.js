// MODEL

var FACING_RIGHT = 0;
var FACING_FRONT = 1;
var FACING_LEFT = 2;
var FACING_BACK = 3;


function clamp(v,min,max) { return (v<min?min:(v>max?max:v));}
function lerp(a,b,f){ return a*(1-f)+b*f; }



function User( name )
{
    this.id = -1;
    this.name = name || "unnamed";
    this.room = "";
    this.position = 0;
    this.facing = FACING_FRONT;
    this.animation = "idle";
    this.avatar = "spritesheet.png";
    this.target = [0,0];

}

User.prototype.fromJSON = function( json )
{
    for(var i in json)
    {
        this[i] = json[i]; // update every variable in the User instance
    }
}

function Room( name )
{
    this.id = -1;
    this.name = name;
    this.url = null;
    this.people = [];
    this.range = [-100,100];
    this.exits = [];
    // this.offset ??
    // this.items = [];
}

Room.prototype.addUser = function( user )
{
    var index = this.people.indexOf(user.id); // check if user already exists
    if(index != -1)
        return;
    this.people.push(user.id);
    user.room = this.name;
}

Room.prototype.removeUser = function( user )
{
    var index = this.people.indexOf(user.id);
    if(index != -1)
        this.people.splice(index, 1);
}

var WORLD = {
    last_id: 0, // room id
    default_room: null,
    rooms: {},
    users: {},
    users_by_id: {},

    createRoom: function( name, url )
    {
        var room = new Room(name);
        room.id = this.last_id++;
        room.url = url;

        this.rooms[name] = room;
        return room;
    },

    getRoom: function( name ) { return this.rooms[name]; },
    
    addUser: function( user, room )
    {
        this.users[user.name] = user;
        this.users_by_id[user.id] = user;
        room.addUser(user);
    },

    changeRoom: function ( user, new_room ) {
        this.removeUser(user);
        user.room = new_room;
        new_room.addUser(user);
    },

    removeUser: function( user )
    {
        var room = this.getRoom(user.room);
        if(room)
            room.removeUser(user);
    },

    getUserById: function( id ) { return this.users_by_id[id]; },

    fromJSON: function( json )
    {
        // Load data from JSON
        for(var i in json.rooms)
        {
            this.createRoom(i, json.rooms[i]);
        }
        this.last_id = json.last_id;
        this.default_room = json.default_room;
    },
};

if(typeof(window) == "undefined")
{
    module.exports = {
        WORLD, Room, FACING_FRONT
    };
}


var MYAPP = {
    current_room: null,
    my_user: null,
    scale: 1.2,
    cam_offset: 0,
    animations: 
    {
        idle:[0],
        walking:[2,3,4,5,6,7,8,9],
        talking: [0,1]
    },

    init: function()
    {
        this.current_room = WORLD.createRoom("desert", "background.png");
        WORLD.createRoom("oasis","oasis.png");
        
        getImage("oasis.png");
        this.my_user = new User("Uri");
        this.current_room.addUser(this.my_user);
        this.current_room.exits.push({
            target: "oasis",
            position: 80,
            width: 30
        });

        WORLD.addUser(this.my_user, this.current_room);

        // TODO:
        // fetch("world.json").then(function(resp) {
        //     return resp.json;
        // }).then(function(json) {
        //     WORLD.fromJSON(json);
        //     MYAPP.onWorldLoaded();
        // });

        // VIEW.init();
        // MYCLIENT.connect();


    },

    onWorldLoaded: function() {
         this.current_room = WORLD.rooms.hall;
    },

    draw: function( canvas, ctx )
    {
        ctx.imageSmoothingEnabled = false;

        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2 ,canvas.height/2);
        ctx.scale(this.scale,this.scale);
        ctx.translate(this.cam_offset, 0)

        if(this.current_room)
            this.drawRoom(ctx, this.current_room);

        ctx.restore();
    },

    canvasToWorld: function( pos )
    {
        return [(pos[0] - canvas.width/2)/this.scale-this.cam_offset, (pos[1] - canvas.height/2)/this.scale];
    },
    
    drawRoom: function( ctx, room )
    {

        //draw room background
        var scale = 1;
        var img = getImage(room.url);

        if(img){
            ctx.drawImage(img,-img.width * scale/2, -img.height * scale/2, img.width*scale, img.height*scale);
            
            for(var i = 0; i<room.exits.length;++i){
                var exit = room.exits[i];
                ctx.fillStyle = "red";
                ctx.fillRect(exit.position,40,exit.width,60);
            }

            //draw room users
            for(var i=0; i<room.people.length;++i){
                var user_id = room.people[i];
                
                var user = WORLD.getUserById(user_id);
                if(user)
                    this.drawUser(ctx,user);
            }
        }
    },

    drawUser:function(ctx, user){
        if(!user.avatar) return;

        var anim = this.animations[user.animation];
        if(!anim) return;

        var time = performance.now()*0.001;

        var img = getImage(user.avatar);
        var frame = anim[Math.floor(time*7) % anim.length];
        var facing = user.facing;
        ctx.drawImage(img, frame*32, facing*64, 32, 64, user.position-16,20, 32, 64);

        // ctx.strokeStyle="red";
        // ctx.beginPath();
        // ctx.moveTo(user.position,40);
        // ctx.lineTo(user.target[0],user.target[1]);
        // ctx.stroke();
    },

    update: function( dt )
    {
        if(this.my_user){

            var room = WORLD.getRoom(this.my_user.room);
            this.my_user.target[0] = clamp(this.my_user.target[0],room.range[0],room.range[1]);

            var diff= (this.my_user.target[0]-this.my_user.position);
            var delta = diff;
            if (delta>0){
                delta = 30;
            }else if (delta<0){
                delta=-30;
            }else{
                delta=0;
            }
            if (Math.abs(diff)<1){
                this.my_user.position = this.my_user.target[0];
                delta=0;
            }else{
                this.my_user.position += delta*dt;
            }

            if(delta==0){
                this.my_user.animation="idle";
            }else{
                if(delta>0){
                    this.my_user.facing=FACING_RIGHT;
                }else{
                    this.my_user.facing=FACING_LEFT;
                }
                this.my_user.animation="walking";

                
            }
            this.cam_offset=lerp(this.cam_offset, -this.my_user.position,0.02);

            if(this.current_room){
                for(var i=0; i<this.current_room.exits.length;++i){
                    var exit = this.current_room.exits[i];
                    if(exit.target==this.my_user.next_room){ //si hi ha 2 portes que van a la mateixa room, i clica la més llunyana, entraria a la primera que passi per sobre
                        if(this.my_user.position>exit.position){
                            if(this.my_user.position<exit.position+exit.width){
                                
                                var new_room = WORLD.getRoom(exit.target);
                                this.my_user.room = exit.target;
                                new_room.people.push(this.my_user.name);
                                this.current_room = new_room;
                                
                                
                            }
                        }
                    }
                }
                this.is_cursor_on_exit();
            }   
        }
    },

     is_cursor_on_exit: function()
     {
        var localmouse = this.canvasToWorld(mouse_pos);
        var cursor_exit = null;
        for(var i=0; i<this.current_room.exits.length; ++i){
            var exit = this.current_room.exits[i];
            if(localmouse[0]>exit.position){
                if(localmouse[0]<exit.position+exit.width){
                    if(localmouse[1]>40){//change the hardcode to datacode
                        if(localmouse[1]<100){
                            cursor_exit = exit;
                            
                        }
                    }
                }
            }
        }
        
        if(cursor_exit){
            document.body.style.cursor = 'pointer'; //Put in here door sprites to open and close :)
        }else{
            document.body.style.cursor = '';
        }
        return cursor_exit;
    },

    onMouse: function( e )
    {
        if(e.type == "mousedown"){
            var localmouse = this.canvasToWorld(mouse_pos);
            this.my_user.target[0] = localmouse[0];
            this.my_user.target[1] = localmouse[1];

            var cursor_exit = this.is_cursor_on_exit();
            if(cursor_exit) this.my_user.next_room=cursor_exit.target;
            else this.my_user.next_room="";
        }else if(e.type == "mousemove"){
    
        }else //mouseup
        {
    
        }
    },

    onKey: function( e )
    {


        
    }
};
// Require packages 
const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongodb
mongo.connect('mongodb://admin:admin123@ds155352.mlab.com:55352/sockets', function(err, db){
    if(err) throw err;
    console.log('MongoDB connected');

    // Connect to Socket.io
    client.on('connection', (socket)=>{
        let chat = db.collection('sockets');

        // Function to send status
        sendStatus = s => {
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray((err,res)=>{
            if(err) throw err;

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', (data)=>{
            let name = data.name;
            let msg = data.msg;

            // Check for name and message
            if(name === '' || msg === ''){
                sendStatus('Please enter a name and message!');
            } else {
                // Insert message
                chat.insert({name: name, msg: msg}, ()=>{
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        msg: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', (data)=>{
            // Remove all chats from collection
            chat.remove({}, ()=>{
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});
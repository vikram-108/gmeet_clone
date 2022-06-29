const socket=io('/');
const videoGrid=document.getElementById('video-grid');
const myPeer=new Peer(undefined, {
    host: '/',
    port: '3001'
})

let myVideoStream;
let currentPeer;
const myVideo=document.createElement('video');
myVideo.muted=true;
const peers={};
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream =>{
    myVideoStream=stream;
    addVideoStream(myVideo,stream);
    myVideo.controls=true;
    myPeer.on('call', call => {
        call.answer(stream);
        peers[call.peer]=call;
        const video=document.createElement('video');
        video.controls=true;
        call.on('stream', userVideoStream => {
            addVideoStream(video,userVideoStream);
            currentPeer=call.peerConnection;
            // console.log(currentPeer);
        })
    })
    socket.on('user-connected', (userId) => {
        console.log("call 1");
        connectToNewUser(userId, stream);
        console.log("connected to new user");
    });

    var input=document.getElementById('chat_message');
    input.addEventListener('keydown', e=>{
        if (e.key=='Enter' && input.value.length>0){
            console.log(input.value);
            socket.emit('message', input.value);
            input.value='';
        }
    })
    socket.on("createMessage", message => {
        $(".messages").append(`<li class="message"><b>${message.sender}</b><br/>${message.body}</li>`);
        scrollToBottom();
    })
})

socket.on('user-disconnected', (userId)=>{
    console.log(peers);
    console.log(`${userId} disconnected`);
    console.log(peers[userId]);
    if (peers[userId]) {
        console.log("going inside");
        peers[userId].emit('close');
    }
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
})

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', ()=>{
        video.play();
        console.log("video appended");
    })
    videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
    const call=myPeer.call(userId,stream);
    const video=document.createElement('video');
    // video.muted=true;
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
        currentPeer=call.peerConnection;
    })
    call.on('close', ()=>{
        console.log("call closed");
        // video.remove();
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.remove();
    })
    peers[userId]=call;
    console.log(`peers userid set for ${userId}`);
    console.log(peers[userId]);
}

const scrollToBottom = ()=>{
    let d=$(".main_chat_window");
    d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
    const enabled=myVideoStream.getAudioTracks()[0].enabled;
    if (enabled){
        myVideoStream.getAudioTracks()[0].enabled=false;
        setUnmuteButton(); 
    }
    else{
        setmuteButton(); 
        myVideoStream.getAudioTracks()[0].enabled=true;
    }
}

const setmuteButton=()=>{
    const html=`
        <i class="fas fa-microphone"></i>
        <span>Mute<span>
    `
    document.querySelector('.main_mute_button').innerHTML=html;
}

const setUnmuteButton=()=>{
    const html=`
        <i class="unmute fas fa-microphone-slash"></i>
        <span>Unute<span>
    `
    document.querySelector('.main_mute_button').innerHTML=html;
}

const playStop = () => {
    const enabled=myVideoStream.getVideoTracks()[0].enabled;
    if (enabled){
        myVideoStream.getVideoTracks()[0].enabled=false;
        setplayVideo(); 
    }
    else{
        setstopVideo(); 
        myVideoStream.getVideoTracks()[0].enabled=true;
    }
}

const setplayVideo=()=>{
    const html=`
        <i class="stop fas fa-video-slash"></i>
        <span>Play Video<span>
    `
    document.querySelector('.main_video_button').innerHTML=html;
}

const setstopVideo=()=>{
    const html=`
        <i class="fas fa-video"></i>
        <span>Stop Video<span>
    `
    document.querySelector('.main_video_button').innerHTML=html;
}

const stopScreenShare= () => {
    let videoTrack=myVideoStream.getVideoTracks()[0];
    let sender=currentPeer.getSenders().find(s => {
        return s.track.kind==videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);
}

const shareScreen=()=>{
    console.log("called");
    navigator.mediaDevices.getDisplayMedia({cursor: true}).then(stream =>{
        const screenTrack=stream.getVideoTracks()[0];
        screenTrack.onended=function () {
            stopScreenShare();
        }
        let sender=currentPeer.getSenders().find(s => {
            return s.track.kind==screenTrack.kind;
        })
        sender.replaceTrack(screenTrack);
    }).catch(err => {
        console.log(err);
    })
}

const openBoard=() => {
    var canvas = document.querySelector('#canvas');
    console.log(canvas.height);
    if (canvas.height) {
        $('#canvas').css('height','0%');
        canvas.height=0;
        console.log(document.querySelector('#canvas'));
    }
    else {
        canvas.height=504;
        $('#canvas').css('height','50%');
    }
}

(function() {
    var canvas = document.querySelector('#canvas');
    var ctx = canvas.getContext('2d');

    var sketch = document.querySelector('#canvas');
    var sketch_style = getComputedStyle(sketch);
    canvas.width = parseInt(sketch_style.getPropertyValue('width'));
    canvas.height = parseInt(sketch_style.getPropertyValue('height'));

    var mouse = {x: 0, y: 0};
    var last_mouse = {x: 0, y: 0};

    socket.on('onDraw', (data) => {
        console.log("called onDraw");
        ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(data.last_mouse.x, data.last_mouse.y);
        ctx.lineTo(data.mouse.x, data.mouse.y);
        ctx.closePath();
        ctx.stroke();
    })

    /* Mouse Capturing Work */
    canvas.addEventListener('mousemove', function(e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;

        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);


    /* Drawing on Paint App */

    canvas.addEventListener('mousedown', function(e) {
        canvas.addEventListener('mousemove', onPaint, false);
    }, false);

    canvas.addEventListener('mouseup', function() {
        canvas.removeEventListener('mousemove', onPaint, false);
    }, false);

    var onPaint = function() {
        console.log("painting");
        socket.emit('draw', { mouse: {x: mouse.x, y: mouse.y}, last_mouse: {x: last_mouse.x, y: last_mouse.y} });
        ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(last_mouse.x, last_mouse.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.closePath();
        ctx.stroke();
    };

}());
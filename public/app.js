const remForm=document.querySelector('.rem-form');
let agenda=document.getElementById('title');
let mails=document.getElementById('mails');
let time=document.getElementById('time');

remForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    // const formData = Object.fromEntries(new FormData(e.target).entries());
    let formData={
        agenda: agenda.value,
        mails: mails.value,
        time: time.value,
    }
    console.log(formData);
    const xhr=new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/mail');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload= function (){
        if (xhr.responseText=='success'){
            alert('Meeting Link sent');   
        }
        else{
            alert('Something went wrong!')
        }
    }
    xhr.send(JSON.stringify(formData));
})
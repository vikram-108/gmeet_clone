import express from "express";
import { google } from 'googleapis';
import cors from "cors";
import axios from 'axios';
import cookieParser from "cookie-parser";
import jwt from 'jsonwebtoken';
import {
    SERVER_ROOT_URI,
    GOOGLE_CLIENT_ID,
    JWT_SECRET,
    GOOGLE_CLIENT_SECRET,
    COOKIE_NAME,
    UI_ROOT_URI,
} from "./config";
const PORT=4000;
const app=express();

// app.use(
//     cors({
//       origin: UI_ROOT_URI,
//       credentials: true,
//     })
//   );
  
app.use(cookieParser());

const redirectURI= 'auth/google';

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,`${SERVER_ROOT_URI}/${redirectURI}`
);

var roomId;

function getGoogleAuthURL () {
    const scopes=[
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: "consent",
    });
}

async function getGoogleUser ({code}: {code:any}) {
    const {tokens}=await oauth2Client.getToken(code);
    const googleUser = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
    {
        headers: {
            Authorization: `Bearer ${tokens.id_token}`
        }
    }).then(res => res.data)
    .catch(error => {
        throw new Error(error.message);
    });
    return googleUser;
}

app.get("/auth/google/url", (req,res) => {
    return res.send(getGoogleAuthURL());
})

app.get(`/${redirectURI}`, async (req, res)=>{
    const roomId=req.cookies["roomId"];
    res.clearCookie("roomId", {httpOnly: true});
    const code=req.query.code as string;
    const googleUser= await getGoogleUser({code: code});
    const token=jwt.sign(googleUser,JWT_SECRET);
    res.cookie(COOKIE_NAME, token, {
        maxAge: 900000,
        httpOnly: true,
        secure: false
    })
    console.log("cookie set");
    res.redirect(`${UI_ROOT_URI}/room${roomId}`);
} )

app.get('/auth/me', (req,res) => {
    console.log(req.cookies[COOKIE_NAME]);
    try {
        const decoded=jwt.verify(req.cookies[COOKIE_NAME], JWT_SECRET);
        console.log("decoded",decoded);
        return res.send(decoded);
    } catch (error) {
        res.send(null);
    }
})

function main () {
    console.log('function called');
    app.listen(PORT, () =>{
        console.log('server is listening');
    });
}

main();
const express=require('express');
const cors=require('cors');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const {v4:uuid}=require('uuid');
const fs=require('fs');
const app=express();
const PORT = process.env.PORT || 8080;
const API_URL = import.meta.env.VITE_API_URL;

app.use(cors());app.use(express.json());
const SECRET='study-secret'; const DB='db.json';
function db(){if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify({users:[],resources:{}}));return JSON.parse(fs.readFileSync(DB));}
function save(d){fs.writeFileSync(DB,JSON.stringify(d,null,2));}
function auth(req,res,next){try{req.user=jwt.verify((req.headers.authorization||'').replace('Bearer ',''),SECRET);next();}catch(e){res.status(401).json({ok:false,error:'Not authenticated'});}}
app.post('/api/auth/register',async(req,res)=>{let d=db();if(d.users.find(x=>x.email===req.body.email))return res.status(409).json({ok:false,error:'Email already registered'});let u={id:uuid(),name:req.body.name,email:req.body.email,password:await bcrypt.hash(req.body.password,10),avatar:(req.body.name||'U')[0]};d.users.push(u);d.resources[u.id]={subjects:[],assignments:[],timetable:[],grades:[],notes:[],goals:[],attendance:[]};save(d);let token=jwt.sign({id:u.id},SECRET);res.json({ok:true,token,user:{id:u.id,name:u.name,email:u.email,avatar:u.avatar}});});
app.post('/api/auth/login',async(req,res)=>{let d=db();let u=d.users.find(x=>x.email===req.body.email);if(!u||!(await bcrypt.compare(req.body.password,u.password)))return res.status(401).json({ok:false,error:'Invalid email or password'});let token=jwt.sign({id:u.id},SECRET);res.json({ok:true,token,user:{id:u.id,name:u.name,email:u.email,avatar:u.avatar}});});
app.get('/api/auth/me',auth,(req,res)=>{let d=db();let u=d.users.find(x=>x.id===req.user.id);res.json({ok:true,user:{id:u.id,name:u.name,email:u.email,avatar:u.avatar}})});
['subjects','assignments','timetable','grades','notes','goals','attendance'].forEach(r=>{
app.get('/api/'+r,auth,(req,res)=>{let x=db().resources[req.user.id]?.[r]||[];res.json({ok:true,[r]:x});});
app.post('/api/'+r,auth,(req,res)=>{let d=db();let item={id:uuid(),...req.body};d.resources[req.user.id][r].push(item);save(d);res.json({ok:true,item});});
app.put('/api/'+r+'/:id',auth,(req,res)=>{let d=db();let a=d.resources[req.user.id][r];let i=a.findIndex(x=>x.id===req.params.id);if(i>=0)a[i]={...a[i],...req.body};save(d);res.json({ok:true,item:a[i]});});
app.delete('/api/'+r+'/:id',auth,(req,res)=>{let d=db();d.resources[req.user.id][r]=d.resources[req.user.id][r].filter(x=>x.id!==req.params.id);save(d);res.json({ok:true});});
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

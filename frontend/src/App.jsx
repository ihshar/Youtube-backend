import { useEffect, useState } from 'react'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import axios from 'axios'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

function App() {
  const [loggedIn,setLoggedIn] = useState(true)

  const navigate = useNavigate();


  const getCurrentUser = async() => {
    try {
      const res = axios.get('/api/v1/users/current-user',{
        withCredentials:true,
      });
      console.log("User logged in ",res.data.user);
      return res.data.user;
    } catch (error) {
      console.log("User is not Logged In");
      throw error;
    }
  }

  useEffect(()=>{
    getCurrentUser().then((user)=>{
      if(user){
        console.log("from useEffect user loggedin");        
      }
    })

    navigate('/login')
    console.log("from useEffect user not loggedin");
  },[]) 
  return (
    <div className='flex  m-auto justify-center items-center h-screen'>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </div>
  )
}

export default App

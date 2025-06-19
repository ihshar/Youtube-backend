import { useState } from 'react'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'

function App() {
  const [load,setLoad] = useState(false)
   

  return (
    <>
    {/* <div className=" overflow-y bg-[#121212]  gap-10 justify-center"> */}
      {load?<Login setLoad={setLoad}  />:<Register setLoad={setLoad}/>}
    {/* </div> */}
    </>
  )
}

export default App

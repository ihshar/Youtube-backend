import { useState } from 'react';
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast';
import {
  Button,
  Form,
  Input,
} from 'antd';
import {useNavigate} from "react-router-dom"

const Login = () => {
    const [data,setData] = useState({email:"",username:"",password:""})
    const [loading,setLoading] = useState(false)

    const navigate = useNavigate()

    const submitHandler = async() => {
      console.log(data);
      setLoading(true)
      const res = await axios.post('http://localhost:8000/api/v1/users/login',data);
      toast.success(res.data.message)
      console.log(res);
      if(res.data.statusCode === 200){
        navigate('/register')
      }
      setLoading(false) 
    }


    const props = {
      disabled:false
    }
    if((data.email && data.password && data.username).length  ===0){
      props.disabled=true
    }
  const [componentSize, setComponentSize] = useState('large');
  const onFormLayoutChange = ({ size }) => {
    setComponentSize(size);
  };
  return (
    <Form
      labelCol={{ span: 4  }}
      wrapperCol={{ span: 14 }}
      layout="vertical"
      initialValues={{ size: componentSize }}
      onValuesChange={onFormLayoutChange}
      size={componentSize}
      style={{width:500}}
    >
      <div className='flex ml-20'>
        <Form.Item >
          <Button onClick={()=>navigate('/login')}>Login</Button>
        </Form.Item>
        <Form.Item >
          <Button onClick={()=>navigate('/register')}>Register</Button>
        </Form.Item>
      </div>
      <Form.Item label="Email">
        <Input onChange={(e) => setData({...data,email:e.target.value})}/>
      </Form.Item>
      <Form.Item label="Username">
        <Input onChange={(e) => setData({...data,username:e.target.value})}/>
      </Form.Item>
      <Form.Item label="Password">
        <Input  onChange={(e) => setData({...data,password:e.target.value})}/>
      </Form.Item>
      {loading ?<Form.Item >
        <Button onClick={submitHandler} loading disabled>Login</Button>
      </Form.Item> : <Form.Item >
        <Button onClick={submitHandler} {...props}>Login</Button>
      </Form.Item>}
      
      <Toaster/>
    </Form>
  );
};
export default Login;
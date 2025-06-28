import { useState } from 'react';
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast';
import {
  Button,
  Form,
  Input,
} from 'antd';
import { useNavigate } from 'react-router-dom';
const Register = () => {
    const [data, setData] = useState({fullName:"", email: "",username:"", password: "", avatar: ""});
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const submitHandler = async () => {
        const formData = new FormData()
        formData.append("fullName", data.fullName);
        formData.append("email", data.email);
        formData.append("username", data.username);
        formData.append("password", data.password);
        formData.append("avatar",data.avatar)

        setLoading(true);
        const res = await axios.post(
            "http://localhost:8000/api/v1/users/register",
            formData
        );  
        toast.success(res.data.message);
        console.log(res.data.message);
        console.log(res);
        if(res.data.statusCode === 200){
            navigate('/login')
        }
        setLoading(false)
    };

    const disable = {
      disabled:false
    }
    if((data.email && data.password && data.username && data.fullName && data.avatar ).length===0){
        disable.disabled=true
    }

  const [componentSize, setComponentSize] = useState('large');
  const onFormLayoutChange = ({ size }) => {
    setComponentSize(size);
  };
  return (
    <>
        <Form
        labelCol={{ span: 4  }}
        wrapperCol={{ span: 14 }}
        layout="vertical"
        initialValues={{ size: componentSize }}
        onValuesChange={onFormLayoutChange}
        size={componentSize}
        style={{ width:"500px"}}
        >
        <div className='flex ml-20'>
            <Form.Item >
                <Button onClick={()=>navigate('/login')}>Login</Button>
            </Form.Item>
            <Form.Item >
                <Button onClick={()=>navigate('/register')}>Register</Button>
            </Form.Item>
        </div>
        <Form.Item label="Full Name">
            <Input onChange={(e) => setData({...data,fullName:e.target.value})}/>
        </Form.Item>
        <Form.Item label="Email">
            <Input onChange={(e) => setData({...data,email:e.target.value})}/>
        </Form.Item>
        <Form.Item label="Username">
            <Input onChange={(e) => setData({...data,username:e.target.value})}/>
        </Form.Item>
        <Form.Item label="Password">
            <Input onChange={(e) => setData({...data,password:e.target.value})}/>
        </Form.Item>
        <input
                id="file"
                type="file"
                className="mb-4 rounded-lg border bg-transparent px-3 py-2"
                onChange={(e)=>{
                    const file = e.target.files[0]
                    console.log(file);
                    if (file) {
                        setData((data) => ({
                            ...data,
                            avatar: file,
                        }));
                        }
                }}
            />
        {loading ?<Form.Item >
            <Button onClick={submitHandler} loading disabled>Register</Button>
        </Form.Item> : <Form.Item >
            <Button onClick={submitHandler} {...disable}>Register</Button>
        </Form.Item>}
        <Toaster/>
        </Form>
    </>

  );
};
export default Register;
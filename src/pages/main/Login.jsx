import React, { useState } from 'react';
import api from '../../utilities/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = async (e) => {
    e.preventDefault();
    // Add login logic here
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const response = await api.post('/kuedu/api/token/pair', {username, password});
      if (response.access) {
        const { access } = response;
        localStorage.setItem('token', access); // Save JWT to localStorage
        localStorage.setItem('username', username);
        // navigate('/admin'); // Redirect to admin page after login
      }
      // setErrorMessage(response.message);
    } catch (error) {
      console.error("Error during login:", error);
      // Set the error message based on the API error response
      // setErrorMessage("Login failed. Please check your credentials and try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 flex items-center justify-center h-screen">
      <div className="w-full max-w-md">
        <div className='flex justify-center items-center mb-6 gap-1'>
      <img src="/chiccheck.svg" alt="" width={32}/>
        <h1 className="text-center text-3xl font-bold">
          ChicCheck
          </h1>

        </div>
        <form onSubmit={login} className="space-y-4">
          <div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Enter username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 text-xl"
          >
            Login
          </button>
        </form>
        {error && (
          <div className="mt-4 text-red-600 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

# 🛠️ ChicCheck Frontend  

🚀 **Smart Self Attendance Check With Liveness Detection** – Secure and efficient attendance tracking using **React**.

## 🚀 Getting Started  

### 1️⃣ Clone the repository  
To get started, clone the **chiccheck-frontend** repository to your local machine:  
```bash
git clone https://github.com/KUChickCheck/chiccheck-frontend.git
cd chiccheck-frontend
```

### 2️⃣ Install dependencies
Once inside the project directory, install all required dependencies using npm:
```bash
npm install
```

### 3️⃣ Set up environment variables
Create a .env file in the root of the project directory, and add the necessary environment variables:
```env
VITE_API_URL=your_backend_api_url         # Backend API URL (e.g., http://localhost:5000)
VITE_MODEL_API=your_liveness_model_api_url # Liveness model API URL (e.g., http://localhost:8000)
VITE_BASE_URL=your_base_url_prefix       # Prefix of your URL (e.g., /chiccheck/)
```

### 4️⃣ Run the development server
To start the frontend application in development mode, run:
```bash
npm run dev
```
This will launch the React app, and you can access it at the local development server (typically http://localhost:3000).

### 🤝 Contributing
Feel free to fork the repo, make your changes, and submit a pull request. All contributions are welcome!
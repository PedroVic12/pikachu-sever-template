import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Importa o CSS do Tailwind

// 1. Pega o elemento do DOM onde o app será renderizado.
//    Note que estamos usando 'app', conforme o seu index.html.
const container = document.getElementById('app');

// 2. Cria a "raiz" do seu aplicativo React dentro desse elemento.
const root = ReactDOM.createRoot(container);

// 3. Renderiza o componente principal <App /> dentro da raiz.
//    O <React.StrictMode> ajuda a encontrar problemas potenciais no seu app.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

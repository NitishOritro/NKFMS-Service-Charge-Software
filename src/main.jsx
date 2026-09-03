import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import App from './App';
import './styles/fonts.css';
import './styles/index.css';
import './styles/print.css';
import { guardStaleCache } from './utils/cacheGuard';

// পাতা খোলার সাথে সাথেই দেখা হয় হাতের কোডটি সর্বশেষ কিনা। পুরোনো হলে
// ক্যাশ মুছে একবার নতুন করে খোলা হয় — ব্যবহারকারীকে Ctrl+Shift+R চাপতে
// হয় না। রেন্ডার আটকায় না, তাই পাতা দেরিতে ওঠে না।
guardStaleCache(typeof __BUILD_ID__ === 'undefined' ? 'dev' : __BUILD_ID__);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>
);

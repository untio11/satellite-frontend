import { useEffect, useState } from 'react';
import Client, { API_URL } from '../api/client';
import '../style/App.css';
import Content from './Content';
import Header from './Header';

import Searchbar from './Searchbar';

function App() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function connectWorld() {
            await Client.contact('satellite', { endpoint: `${API_URL}/world` });
            setLoaded(true);
        }
        if (!loaded) connectWorld();
    });
    return (
        <div className="App">
            <Header />
            <Searchbar />
            <Content />
        </div>
    );
}

export default App;

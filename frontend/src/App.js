import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        hello
      </header>
      <WelcomeMessage />
    </div>
  );
}

function WelcomeMessage() {
  return <p>Welcome!</p>
}

export default App;

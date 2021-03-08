import logo from "./logo.svg";
import "./App.css";
import Button from "./react-redux-button.js";
class Human {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

function App() {
  let hans: Human = new Human("Hans", 15);
  let peter = new Human("Peter", 33);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{hans.name}: Hello World!</p>
        <p>
          {peter.name}: Hallo daar. Ik ben {peter.age} jaar oud.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <Button />
      </header>
    </div>
  );
}

export default App;

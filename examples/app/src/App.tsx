import React from 'react';
import logo from './logo.svg';
import './App.css';
import {useBean} from "ironbean-react";
import {autowired, component, type} from "ironbean";

@component
class A {
    g = 1011;
}

@component
class B {
    @autowired  a!: A;
    c = 10;
}

const App = () => {
    const b = useBean(B);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
            {b.a.g}
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <div className="exampleContainer">

        </div>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;

import React from 'react';
import logo from './logo.svg';
import './App.css';
import {useBean} from "ironbean-react";
import {autowired, component} from "ironbean";
import {BrowserRouter, Link, Route, Routes} from "react-router-dom";

@component
class A {
    g = 1011;
}

@component
class B {
    @autowired  a!: A;

    text: string = "";
    c = 10;
}

const App = () => {
    const b = useBean(B);
  return (
      <BrowserRouter>
          <Link to={"first"}>firts</Link>
        <div className="App">
            <Routes>
                <Route path="/" element={<HomePage />}/>
            </Routes>

        </div>
      </BrowserRouter>
  );
}

const HomePage: React.FC<{}> = () => {
    const b = useBean(B);
    return (
        <>
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
        </>
    );
}

const FirstPage: React.FC = () => {
    const b = useBean(B);
    return (
        <>
            first page
            <input value={b.text} onChange={(e) => {
                b.text = e.target.value;
            }}/>
        </>
    );
}


export default App;

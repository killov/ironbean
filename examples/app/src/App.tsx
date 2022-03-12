import React from 'react';
import logo from './logo.svg';
import './App.css';
import {useBean} from "ironbean-react";
import {autowired, component, scope, Scope} from "ironbean";
import {BrowserRouter, Link, Route} from "react-router-dom";
import {makeObservable, observable} from "mobx";
import {observer} from "mobx-react";
import {getDefaultScope} from "ironbean/dist/scope";
import {IronRouter} from "ironbean-react-router";

const PAGE = Scope.create("PAGE");

@component
@scope(PAGE)
class A {
    g = 1011;
}

@component
@scope(PAGE)
class B {
    @autowired  a!: A;

    @observable
    text: string = "";

    c = 10;

    constructor() {
        makeObservable(this);
    }
}

const App = () => {
  return (
      <BrowserRouter>
          <IronRouter scope={getDefaultScope()}
                      paths={[
                          {
                              scope: PAGE,
                              path: /.+/
                          }
                      ]}>
          <Link to={"/"}>homepage</Link>
          <Link to={"/first"}>first</Link>
        <div className="App">

                <Route path="/" component={HomePage}/>
                <Route path="/first" component={FirstPage}/>


        </div>
          </IronRouter>
      </BrowserRouter>
  );
}

const HomePage: React.FC = observer(() => {
    //const b = useBean(B);
    return (
        <>
            <img src={logo} className="App-logo" alt="logo" />
            <p>

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
});

const FirstPage: React.FC = observer(() => {
    const b = useBean(B);
    return (
        <>
            first page
            <input value={b.text} onChange={(e) => {
                b.text = e.target.value;
            }}/>
        </>
    );
});


export default App;

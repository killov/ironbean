import React from 'react';
import './App.css';
import {useBean} from "ironbean-react";
import {ApplicationContext, autowired, component, scope, Scope} from "ironbean";
import {BrowserRouter, Link, Route, Routes, useLocation} from "react-router-dom";
import {makeObservable, observable, runInAction} from "mobx";
import {observer} from "mobx-react";
import {getDefaultScope} from "ironbean/dist/scope";
import {IronRouter} from "ironbean-react-router";

const PAGE = Scope.create("PAGE");

@component
@scope(PAGE)
class A {
    g = 1011;

    @observable
    items: string[] = [];

    constructor() {
        makeObservable(this);
        window.setTimeout(() => {
            runInAction(() => {
                for (let i = 0; i < 30; i++) {
                    this.items.push(i.toString())
                }
            });

        }, 3000)
    }
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
            <Routes>
                <Route path="/first" element={<FirstPage />}/>
                <Route path="/" element={<HomePage />}/>
            </Routes>


        </div>
          </IronRouter>
      </BrowserRouter>
  );
}

const HomePage: React.FC = observer(() => {
    const loc = useLocation()
    const c = useBean(ApplicationContext);
    console.log("render " + loc.pathname, c, loc);
    const a = useBean(A);
    return (
        <div>
            <table>
                <tbody>
                    {a.items.map((i) => <tr key={i} style={{height: 200}}>
                        <td><Link to={"/items/" + i} >{i}</Link></td>
                    </tr>)}
                </tbody>
            </table>
        </div>
    );
});

const FirstPage: React.FC = observer(() => {
    const loc = useLocation()
    const c = useBean(ApplicationContext);
    console.log("render " + loc.pathname, c, loc);
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

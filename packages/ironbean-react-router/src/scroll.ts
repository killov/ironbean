import {useEffect} from "react";

export class Scroll {
    set(offset: number) {
        console.log("set to " + offset)
        window.scroll({top: offset});
    }

    scrollTop() {
        console.log("set top")
        this.set(0);
    }

    get(): number {
        let docScrollTop = 0;
        if (window.document.documentElement && window.document.documentElement !== null) {
            docScrollTop = document.documentElement.scrollTop;
        }
        return window.pageYOffset || docScrollTop;
    }
}

export function useScrollRestoreManual() {
    useEffect(() => {
        const old = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual"
        return () => {
            window.history.scrollRestoration = old;
        }
    })
}
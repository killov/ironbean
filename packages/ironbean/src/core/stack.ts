export class Stack<T> {
    public items: T[] = [];

    public enqueue(item: T) {
        this.items.push(item);
    }

    public dequeue(): T|undefined {
        return this.items.pop();
    }

    public contains(item: T): boolean {
        return this.items.indexOf(item) !== -1;
    }
}
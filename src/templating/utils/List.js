/**
 * Created by guntars on 02/02/2016.
 */
define(function () {
    'use strict';
    class List {
        constructor(items) {
            this._map = new Map(items);
            this._indexes = [...this._map.keys()];
            this._onDelete = [];
        };

        keys() {
            return this._indexes;
        };

        values() {
            return this.entries().map((entry)=> {
                return entry[1];
            })
        };

        entries() {
            return this._indexes.map((key)=> {
                return [key, this._map.get(key)]
            })
        };

        get(key) {
            return this._map.get(key);
        };

        forEach(fn) {
            return this.values().forEach((value, index, ...args)=> {
                return fn.apply(null, [value, index, ...args]);
            })
        };

        getIndex(key) {
            return this._indexes.indexOf(key);
        };

        changeIndex(key, index) {
            if (key) {
                let indexes = this._indexes,
                    indexOf = indexes.indexOf(key);

                if (indexOf !== -1 && index !== indexOf) {
                    this._indexes.splice(index, 0, this._indexes.splice(indexOf, 1)[0]);
                }
            }
        };

        getValueByIndex(index) {
            return this._map.get(this._indexes[index]);
        };

        get first() {
            return this.getValueByIndex(0);
        };

        get last() {
            return this.getValueByIndex(this._indexes.length - 1);
        };

        getKeyByIndex(index) {
            return this._indexes[index];
        };

        set(key, value, index) {
            this._map.set(key, value);
            if (index !== undefined) {
                this._indexes.splice(index, 0, key);
            } else {
                this._indexes.push(key);
            }
        };

        has(key) {
            return this._map.has(key);
        };

        clear() {
            this._map.clear();
            this._indexes.splice(0, this._indexes.length);
        };

        onDelete(cb) {
            let chunk = (...args)=>cb(...args);
            this._onDelete.push(chunk);
            return {
                remove(){
                    this._onDelete.splice(this._onDelete.indexOf(chunk, 1));
                }
            }
        };

        delete(key) {
            if (this.has(key)) {
                let item = this._map.get(key);
                this._map.delete(key);
                this._indexes.splice(this._indexes.indexOf(key), 1);
                this._onDelete.forEach(chunk=>chunk(key, this.size, item));
            }
        };

        deleteByIndex(index) {
            this.delete(this._indexes[index]);
        };

        get size() {
            return this._map.size
        };

    }
    return List;
});
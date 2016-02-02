/**
 * Created by guntars on 02/02/2016.
 */
define(function () {
    class List {
        constructor(items) {
            this._map = new Map(items);
            this._indexes = [...this._map.keys()]
        };

        keys() {
            return this._indexes;
        };

        values() {
            return [...this._map.values()];
        };

        entries() {
            return this._indexes.map((key)=> {
                return [key, this._map.get(key)]
            })
        };

        get(key) {
            return this._map.get(key);
        };

        getIndex(key) {
            return this._indexes.indexOf(key);
        };

        getByIndex(index) {
            return this._map(this._indexes[index]);
        };

        set(key, value, index) {
            this._map.set(key, value);
            if (index) {
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
        }

        delete(key) {
            this._map.delete(key);
            this._indexes.splice(this._indexes.indexOf(key), 1);
        };

        deleteByIndex(index) {
            var key = this._indexes.splice(index, 1)[0];
            this._map.delete(key);
        }

        get size() {
            return this._map.size
        };
    }
    return List;
});
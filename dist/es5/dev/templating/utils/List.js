'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by guntars on 02/02/2016.
 */
define(function () {
    'use strict';

    var List = function () {
        function List(items) {
            _classCallCheck(this, List);

            this._map = new Map(items);
            this._indexes = [].concat(_toConsumableArray(this._map.keys()));
            this._onDelete = [];
        }

        _createClass(List, [{
            key: 'keys',
            value: function keys() {
                return this._indexes;
            }
        }, {
            key: 'values',
            value: function values() {
                return this.entries().map(function (entry) {
                    return entry[1];
                });
            }
        }, {
            key: 'entries',
            value: function entries() {
                var _this = this;

                return this._indexes.map(function (key) {
                    return [key, _this._map.get(key)];
                });
            }
        }, {
            key: 'get',
            value: function get(key) {
                return this._map.get(key);
            }
        }, {
            key: 'forEach',
            value: function forEach(fn) {
                return this.values().forEach(function (value, index) {
                    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                        args[_key - 2] = arguments[_key];
                    }

                    return fn.apply(null, [value, index].concat(args));
                });
            }
        }, {
            key: 'getIndex',
            value: function getIndex(key) {
                return this._indexes.indexOf(key);
            }
        }, {
            key: 'changeIndex',
            value: function changeIndex(key, index) {
                if (key) {
                    var indexes = this._indexes,
                        indexOf = indexes.indexOf(key);

                    if (indexOf !== -1 && index !== indexOf) {
                        this._indexes.splice(index, 0, this._indexes.splice(indexOf, 1)[0]);
                    }
                }
            }
        }, {
            key: 'getValueByIndex',
            value: function getValueByIndex(index) {
                return this._map.get(this._indexes[index]);
            }
        }, {
            key: 'getKeyByIndex',
            value: function getKeyByIndex(index) {
                return this._indexes[index];
            }
        }, {
            key: 'set',
            value: function set(key, value, index) {
                this._map.set(key, value);
                if (index !== undefined) {
                    this._indexes.splice(index, 0, key);
                } else {
                    this._indexes.push(key);
                }
            }
        }, {
            key: 'has',
            value: function has(key) {
                return this._map.has(key);
            }
        }, {
            key: 'clear',
            value: function clear() {
                this._map.clear();
                this._indexes.splice(0, this._indexes.length);
            }
        }, {
            key: 'onDelete',
            value: function onDelete(cb) {
                var chunk = function chunk() {
                    return cb.apply(undefined, arguments);
                };
                this._onDelete.push(chunk);
                return {
                    remove: function remove() {
                        this._onDelete.splice(this._onDelete.indexOf(chunk, 1));
                    }
                };
            }
        }, {
            key: 'delete',
            value: function _delete(key) {
                var _this2 = this;

                if (this.has(key)) {
                    var item = this._map.get(key);
                    this._map.delete(key);
                    this._indexes.splice(this._indexes.indexOf(key), 1);
                    this._onDelete.forEach(function (chunk) {
                        return chunk(key, _this2.size, item);
                    });
                }
            }
        }, {
            key: 'deleteByIndex',
            value: function deleteByIndex(index) {
                this.delete(this._indexes[index]);
            }
        }, {
            key: 'first',
            get: function get() {
                return this.getValueByIndex(0);
            }
        }, {
            key: 'last',
            get: function get() {
                return this.getValueByIndex(this._indexes.length - 1);
            }
        }, {
            key: 'size',
            get: function get() {
                return this._map.size;
            }
        }]);

        return List;
    }();

    return List;
});
//# sourceMappingURL=List.js.map

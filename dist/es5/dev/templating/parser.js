'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

define('templating/parser', ['module'], function (module) {
  'use strict';

  var buildMap = {};
  var srcMap = {};
  var idToSrc = {};
  var masterConfig = module.config && module.config() || {};
  var loadDependencies;

  function traverse(o, func) {
    for (var i in o) {
      func.apply(this, [i, o[i]]);
      if (o[i] !== null && _typeof(o[i]) == "object") {
        traverse(o[i], func);
      }
    }
  }

  function sourceMap(jsObject) {
    var map = {};
    traverse(jsObject, function (key, value) {
      if (key == 'data' && value.src) {
        map[value.src] = map[value.src] || [];
        map[value.src].push(value);
      }
    });
    return map;
  }

  /**
   * Parses a resource name into its component parts. Resource names
   * look like: module/name.ext
   * @param {String} name the resource name
   * @returns {Object} with properties "moduleName", "ext".
   */
  function parseName(name) {
    var modName = undefined,
        ext = undefined,
        temp = undefined,
        index = name.indexOf('.'),
        isRelative = name.indexOf('./') === 0 || name.indexOf('../') === 0;

    if (index !== -1 && (!isRelative || index > 1)) {
      modName = name.substring(0, index);
      ext = name.substring(index + 1, name.length);
    } else {
      modName = name;
    }

    temp = ext || modName;
    index = temp.indexOf('!');
    if (index !== -1) {
      temp = temp.substring(0, index);
      if (ext) {
        ext = temp;
      } else {
        modName = temp;
      }
    }

    return {
      moduleName: modName,
      ext: ext
    };
  }

  function finishLoad(Coder, content, name, onLoad, req) {
    var coder = new Coder(content),
        jsObject = buildMap[name] = coder.run(req.toUrl('./')),
        map = srcMap[name] = sourceMap(jsObject),
        sources = Object.keys(map);

    req(sources, function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (masterConfig.isBuild) {
        idToSrc[name] = {};
        sources.forEach(function (src) {
          var id = Math.random();
          map[src].forEach(function (value) {
            value.src = id;
          });

          idToSrc[name][id] = src;
        });
      } else {
        sources.forEach(function (src, index) {
          var obj = args[index];
          map[src].forEach(function (value) {
            value.src = obj;
          });
        });
      }
      onLoad(jsObject);
    });
  }

  if (masterConfig.env === 'node' || !masterConfig.env && typeof process !== 'undefined' && process.versions && !!process.versions.node && !process.versions['node-webkit']) {
    (function () {
      //Using special require.nodeRequire, something added by r.js.
      var fs = require.nodeRequire('fs');

      loadDependencies = function loadDependencies(url, callback, errback) {
        try {
          var file = fs.readFileSync(url, 'utf8');
          //Remove BOM (Byte Mark Order) from utf8 files if it is there.
          if (file.indexOf('﻿') === 0) {
            file = file.substring(1);
          }
          callback(file);
        } catch (e) {
          if (errback) {
            errback(e);
          }
        }
      };
    })();
  } else if (masterConfig.env === 'xhr' || !masterConfig.env) {
    loadDependencies = function loadDependencies(url, callback, errback, headers) {
      var xhr = new XMLHttpRequest(),
          header = undefined;
      xhr.open('GET', url, true);

      //Allow plugins direct access to xhr headers
      if (headers) {
        for (header in headers) {
          if (headers.hasOwnProperty(header)) {
            xhr.setRequestHeader(header.toLowerCase(), headers[header]);
          }
        }
      }

      //Allow overrides specified in config
      if (masterConfig.onXhr) {
        masterConfig.onXhr(xhr, url);
      }

      xhr.onreadystatechange = function () {
        var status = undefined,
            err = undefined;
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
          status = xhr.status || 0;
          if (status > 399 && status < 600) {
            //An http 4xx or 5xx error. Signal an error.
            err = new Error(url + ' HTTP status: ' + status);
            err.xhr = xhr;
            if (errback) {
              errback(err);
            }
          } else {
            callback(xhr.responseText);
          }

          if (masterConfig.onXhrComplete) {
            masterConfig.onXhrComplete(xhr, url);
          }
        }
      };
      xhr.send(null);
    };
  }

  return {
    load: function load(name, req, onLoad, config) {
      masterConfig.isBuild = config && config.isBuild;
      if (config) {
        masterConfig.templateCoders = config.templateCoders || [];
        masterConfig.templateDecoders = config.templateDecoders || [];
      }

      //Name has format: some.module.filext
      var paths = {
        Coder: 'templating/Coder'
      },
          parsed = parseName(name),
          nonStripName = parsed.moduleName + (parsed.ext ? '.' + parsed.ext : ''),
          url = req.toUrl(nonStripName);

      // Do not load if it is an empty: url
      if (url.indexOf('empty:') === 0) {
        onLoad();
        return;
      }

      loadDependencies(url, function (content) {
        if (masterConfig.isBuild) {
          (function () {
            var Coder = require.nodeRequire(require.toUrl(paths.Coder));
            masterConfig.templateCoders.forEach(function (coder) {
              Coder.addCoder(require.nodeRequire(require.toUrl(coder)));
            });
            finishLoad(Coder, content, name, onLoad, req);
          })();
        } else {
          req([paths.Coder].concat(_toConsumableArray(masterConfig.templateCoders), _toConsumableArray(masterConfig.templateDecoders)), function (Coder) {
            finishLoad(Coder, content, name, onLoad, req);
          });
        }
      }, function (err) {
        if (onLoad.error) {
          onLoad.error(err);
        }
      });
    },
    write: function write(pluginName, moduleName, _write) {

      if (buildMap.hasOwnProperty(moduleName)) {
        (function () {
          var content = JSON.stringify(buildMap[moduleName]),
              map = idToSrc[moduleName],
              ids = Object.keys(map),
              sources = [];
          ids.forEach(function (id, i) {
            var re = new RegExp(id, 'g');
            content = content.replace(re, 'arguments[' + i + ']');
            sources.push(map[id]);
          });

          var dependencies = sources.concat(masterConfig.templateDecoders);

          _write.asModule(pluginName + '!' + moduleName, "define(" + JSON.stringify(dependencies) + ", function () { return " + content + ";});\n");
        })();
      }
    }
  };
});
(function (f) {
  if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define('templating/htmlparser2', [], f);
  } else {
    var g;if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }g.htmlparser = f();
  }
})(function () {
  var define, module, exports;return function e(t, n, r) {
    function s(o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
        }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
          var n = t[o][1][e];return s(n ? n : e);
        }, l, l.exports, e, t, n, r);
      }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
      s(r[o]);
    }return s;
  }({ 1: [function (require, module, exports) {
      /*
        Module dependencies
      */
      var ElementType = require('domelementtype');
      var entities = require('entities');

      /*
        Boolean Attributes
      */
      var booleanAttributes = {
        __proto__: null,
        allowfullscreen: true,
        async: true,
        autofocus: true,
        autoplay: true,
        checked: true,
        controls: true,
        default: true,
        defer: true,
        disabled: true,
        hidden: true,
        ismap: true,
        loop: true,
        multiple: true,
        muted: true,
        open: true,
        readonly: true,
        required: true,
        reversed: true,
        scoped: true,
        seamless: true,
        selected: true,
        typemustmatch: true
      };

      var unencodedElements = {
        __proto__: null,
        style: true,
        script: true,
        xmp: true,
        iframe: true,
        noembed: true,
        noframes: true,
        plaintext: true,
        noscript: true
      };

      /*
        Format attributes
      */
      function formatAttrs(attributes, opts) {
        if (!attributes) return;

        var output = '',
            value;

        // Loop through the attributes
        for (var key in attributes) {
          value = attributes[key];
          if (output) {
            output += ' ';
          }

          if (!value && booleanAttributes[key]) {
            output += key;
          } else {
            output += key + '="' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '"';
          }
        }

        return output;
      }

      /*
        Self-enclosing tags (stolen from node-htmlparser)
      */
      var singleTag = {
        __proto__: null,
        area: true,
        base: true,
        basefont: true,
        br: true,
        col: true,
        command: true,
        embed: true,
        frame: true,
        hr: true,
        img: true,
        input: true,
        isindex: true,
        keygen: true,
        link: true,
        meta: true,
        param: true,
        source: true,
        track: true,
        wbr: true
      };

      var render = module.exports = function (dom, opts) {
        if (!Array.isArray(dom) && !dom.cheerio) dom = [dom];
        opts = opts || {};

        var output = '';

        for (var i = 0; i < dom.length; i++) {
          var elem = dom[i];

          if (elem.type === 'root') output += render(elem.children, opts);else if (ElementType.isTag(elem)) output += renderTag(elem, opts);else if (elem.type === ElementType.Directive) output += renderDirective(elem);else if (elem.type === ElementType.Comment) output += renderComment(elem);else if (elem.type === ElementType.CDATA) output += renderCdata(elem);else output += renderText(elem, opts);
        }

        return output;
      };

      function renderTag(elem, opts) {
        // Handle SVG
        if (elem.name === "svg") opts = { decodeEntities: opts.decodeEntities, xmlMode: true };

        var tag = '<' + elem.name,
            attribs = formatAttrs(elem.attribs, opts);

        if (attribs) {
          tag += ' ' + attribs;
        }

        if (opts.xmlMode && (!elem.children || elem.children.length === 0)) {
          tag += '/>';
        } else {
          tag += '>';
          if (elem.children) {
            tag += render(elem.children, opts);
          }

          if (!singleTag[elem.name] || opts.xmlMode) {
            tag += '</' + elem.name + '>';
          }
        }

        return tag;
      }

      function renderDirective(elem) {
        return '<' + elem.data + '>';
      }

      function renderText(elem, opts) {
        var data = elem.data || '';

        // if entities weren't decoded, no need to encode them back
        if (opts.decodeEntities && !(elem.parent && elem.parent.name in unencodedElements)) {
          data = entities.encodeXML(data);
        }

        return data;
      }

      function renderCdata(elem) {
        return '<![CDATA[' + elem.children[0].data + ']]>';
      }

      function renderComment(elem) {
        return '<!--' + elem.data + '-->';
      }
    }, { "domelementtype": 2, "entities": 14 }], 2: [function (require, module, exports) {
      //Types of elements found in the DOM
      module.exports = {
        Text: "text", //Text
        Directive: "directive", //<? ... ?>
        Comment: "comment", //<!-- ... -->
        Script: "script", //<script> tags
        Style: "style", //<style> tags
        Tag: "tag", //Any tag
        CDATA: "cdata", //<![CDATA[ ... ]]>

        isTag: function isTag(elem) {
          return elem.type === "tag" || elem.type === "script" || elem.type === "style";
        }
      };
    }, {}], 3: [function (require, module, exports) {
      //Types of elements found in the DOM
      module.exports = {
        Text: "text", //Text
        Directive: "directive", //<? ... ?>
        Comment: "comment", //<!-- ... -->
        Script: "script", //<script> tags
        Style: "style", //<style> tags
        Tag: "tag", //Any tag
        CDATA: "cdata", //<![CDATA[ ... ]]>
        Doctype: "doctype",

        isTag: function isTag(elem) {
          return elem.type === "tag" || elem.type === "script" || elem.type === "style";
        }
      };
    }, {}], 4: [function (require, module, exports) {
      var ElementType = require("domelementtype");

      var re_whitespace = /\s+/g;
      var NodePrototype = require("./lib/node");
      var ElementPrototype = require("./lib/element");

      function DomHandler(callback, options, elementCB) {
        if ((typeof callback === 'undefined' ? 'undefined' : _typeof(callback)) === "object") {
          elementCB = options;
          options = callback;
          callback = null;
        } else if (typeof options === "function") {
          elementCB = options;
          options = defaultOpts;
        }
        this._callback = callback;
        this._options = options || defaultOpts;
        this._elementCB = elementCB;
        this.dom = [];
        this._done = false;
        this._tagStack = [];
        this._parser = this._parser || null;
      }

      //default options
      var defaultOpts = {
        normalizeWhitespace: false, //Replace all whitespace with single spaces
        withStartIndices: false };

      //Add startIndex properties to nodes
      DomHandler.prototype.onparserinit = function (parser) {
        this._parser = parser;
      };

      //Resets the handler back to starting state
      DomHandler.prototype.onreset = function () {
        DomHandler.call(this, this._callback, this._options, this._elementCB);
      };

      //Signals the handler that parsing is done
      DomHandler.prototype.onend = function () {
        if (this._done) return;
        this._done = true;
        this._parser = null;
        this._handleCallback(null);
      };

      DomHandler.prototype._handleCallback = DomHandler.prototype.onerror = function (error) {
        if (typeof this._callback === "function") {
          this._callback(error, this.dom);
        } else {
          if (error) throw error;
        }
      };

      DomHandler.prototype.onclosetag = function () {
        //if(this._tagStack.pop().name !== name) this._handleCallback(Error("Tagname didn't match!"));
        var elem = this._tagStack.pop();
        if (this._elementCB) this._elementCB(elem);
      };

      DomHandler.prototype._addDomElement = function (element) {
        var parent = this._tagStack[this._tagStack.length - 1];
        var siblings = parent ? parent.children : this.dom;
        var previousSibling = siblings[siblings.length - 1];

        element.next = null;

        if (this._options.withStartIndices) {
          element.startIndex = this._parser.startIndex;
        }

        if (this._options.withDomLvl1) {
          element.__proto__ = element.type === "tag" ? ElementPrototype : NodePrototype;
        }

        if (previousSibling) {
          element.prev = previousSibling;
          previousSibling.next = element;
        } else {
          element.prev = null;
        }

        siblings.push(element);
        element.parent = parent || null;
      };

      DomHandler.prototype.onopentag = function (name, attribs) {
        var element = {
          type: name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag,
          name: name,
          attribs: attribs,
          children: []
        };

        this._addDomElement(element);

        this._tagStack.push(element);
      };

      DomHandler.prototype.ontext = function (data) {
        //the ignoreWhitespace is officially dropped, but for now,
        //it's an alias for normalizeWhitespace
        var normalize = this._options.normalizeWhitespace || this._options.ignoreWhitespace;

        var lastTag;

        if (!this._tagStack.length && this.dom.length && (lastTag = this.dom[this.dom.length - 1]).type === ElementType.Text) {
          if (normalize) {
            lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
          } else {
            lastTag.data += data;
          }
        } else {
          if (this._tagStack.length && (lastTag = this._tagStack[this._tagStack.length - 1]) && (lastTag = lastTag.children[lastTag.children.length - 1]) && lastTag.type === ElementType.Text) {
            if (normalize) {
              lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
            } else {
              lastTag.data += data;
            }
          } else {
            if (normalize) {
              data = data.replace(re_whitespace, " ");
            }

            this._addDomElement({
              data: data,
              type: ElementType.Text
            });
          }
        }
      };

      DomHandler.prototype.oncomment = function (data) {
        var lastTag = this._tagStack[this._tagStack.length - 1];

        if (lastTag && lastTag.type === ElementType.Comment) {
          lastTag.data += data;
          return;
        }

        var element = {
          data: data,
          type: ElementType.Comment
        };

        this._addDomElement(element);
        this._tagStack.push(element);
      };

      DomHandler.prototype.oncdatastart = function () {
        var element = {
          children: [{
            data: "",
            type: ElementType.Text
          }],
          type: ElementType.CDATA
        };

        this._addDomElement(element);
        this._tagStack.push(element);
      };

      DomHandler.prototype.oncommentend = DomHandler.prototype.oncdataend = function () {
        this._tagStack.pop();
      };

      DomHandler.prototype.onprocessinginstruction = function (name, data) {
        this._addDomElement({
          name: name,
          data: data,
          type: ElementType.Directive
        });
      };

      module.exports = DomHandler;
    }, { "./lib/element": 5, "./lib/node": 6, "domelementtype": 3 }], 5: [function (require, module, exports) {
      // DOM-Level-1-compliant structure
      var NodePrototype = require('./node');
      var ElementPrototype = module.exports = Object.create(NodePrototype);

      var domLvl1 = {
        tagName: "name"
      };

      Object.keys(domLvl1).forEach(function (key) {
        var shorthand = domLvl1[key];
        Object.defineProperty(ElementPrototype, key, {
          get: function get() {
            return this[shorthand] || null;
          },
          set: function set(val) {
            this[shorthand] = val;
            return val;
          }
        });
      });
    }, { "./node": 6 }], 6: [function (require, module, exports) {
      // This object will be used as the prototype for Nodes when creating a
      // DOM-Level-1-compliant structure.
      var NodePrototype = module.exports = {
        get firstChild() {
          var children = this.children;
          return children && children[0] || null;
        },
        get lastChild() {
          var children = this.children;
          return children && children[children.length - 1] || null;
        },
        get nodeType() {
          return nodeTypes[this.type] || nodeTypes.element;
        }
      };

      var domLvl1 = {
        tagName: "name",
        childNodes: "children",
        parentNode: "parent",
        previousSibling: "prev",
        nextSibling: "next",
        nodeValue: "data"
      };

      var nodeTypes = {
        element: 1,
        text: 3,
        cdata: 4,
        comment: 8
      };

      Object.keys(domLvl1).forEach(function (key) {
        var shorthand = domLvl1[key];
        Object.defineProperty(NodePrototype, key, {
          get: function get() {
            return this[shorthand] || null;
          },
          set: function set(val) {
            this[shorthand] = val;
            return val;
          }
        });
      });
    }, {}], 7: [function (require, module, exports) {
      var DomUtils = module.exports;

      [require("./lib/stringify"), require("./lib/traversal"), require("./lib/manipulation"), require("./lib/querying"), require("./lib/legacy"), require("./lib/helpers")].forEach(function (ext) {
        Object.keys(ext).forEach(function (key) {
          DomUtils[key] = ext[key].bind(DomUtils);
        });
      });
    }, { "./lib/helpers": 8, "./lib/legacy": 9, "./lib/manipulation": 10, "./lib/querying": 11, "./lib/stringify": 12, "./lib/traversal": 13 }], 8: [function (require, module, exports) {
      // removeSubsets
      // Given an array of nodes, remove any member that is contained by another.
      exports.removeSubsets = function (nodes) {
        var idx = nodes.length,
            node,
            ancestor,
            replace;

        // Check if each node (or one of its ancestors) is already contained in the
        // array.
        while (--idx > -1) {
          node = ancestor = nodes[idx];

          // Temporarily remove the node under consideration
          nodes[idx] = null;
          replace = true;

          while (ancestor) {
            if (nodes.indexOf(ancestor) > -1) {
              replace = false;
              nodes.splice(idx, 1);
              break;
            }
            ancestor = ancestor.parent;
          }

          // If the node has been found to be unique, re-insert it.
          if (replace) {
            nodes[idx] = node;
          }
        }

        return nodes;
      };

      // Source: http://dom.spec.whatwg.org/#dom-node-comparedocumentposition
      var POSITION = {
        DISCONNECTED: 1,
        PRECEDING: 2,
        FOLLOWING: 4,
        CONTAINS: 8,
        CONTAINED_BY: 16
      };

      // Compare the position of one node against another node in any other document.
      // The return value is a bitmask with the following values:
      //
      // document order:
      // > There is an ordering, document order, defined on all the nodes in the
      // > document corresponding to the order in which the first character of the
      // > XML representation of each node occurs in the XML representation of the
      // > document after expansion of general entities. Thus, the document element
      // > node will be the first node. Element nodes occur before their children.
      // > Thus, document order orders element nodes in order of the occurrence of
      // > their start-tag in the XML (after expansion of entities). The attribute
      // > nodes of an element occur after the element and before its children. The
      // > relative order of attribute nodes is implementation-dependent./
      // Source:
      // http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
      //
      // @argument {Node} nodaA The first node to use in the comparison
      // @argument {Node} nodeB The second node to use in the comparison
      //
      // @return {Number} A bitmask describing the input nodes' relative position.
      //         See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
      //         a description of these values.
      var comparePos = exports.compareDocumentPosition = function (nodeA, nodeB) {
        var aParents = [];
        var bParents = [];
        var current, sharedParent, siblings, aSibling, bSibling, idx;

        if (nodeA === nodeB) {
          return 0;
        }

        current = nodeA;
        while (current) {
          aParents.unshift(current);
          current = current.parent;
        }
        current = nodeB;
        while (current) {
          bParents.unshift(current);
          current = current.parent;
        }

        idx = 0;
        while (aParents[idx] === bParents[idx]) {
          idx++;
        }

        if (idx === 0) {
          return POSITION.DISCONNECTED;
        }

        sharedParent = aParents[idx - 1];
        siblings = sharedParent.children;
        aSibling = aParents[idx];
        bSibling = bParents[idx];

        if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
          if (sharedParent === nodeB) {
            return POSITION.FOLLOWING | POSITION.CONTAINED_BY;
          }
          return POSITION.FOLLOWING;
        } else {
          if (sharedParent === nodeA) {
            return POSITION.PRECEDING | POSITION.CONTAINS;
          }
          return POSITION.PRECEDING;
        }
      };

      // Sort an array of nodes based on their relative position in the document and
      // remove any duplicate nodes. If the array contains nodes that do not belong
      // to the same document, sort order is unspecified.
      //
      // @argument {Array} nodes Array of DOM nodes
      //
      // @returns {Array} collection of unique nodes, sorted in document order
      exports.uniqueSort = function (nodes) {
        var idx = nodes.length,
            node,
            position;

        nodes = nodes.slice();

        while (--idx > -1) {
          node = nodes[idx];
          position = nodes.indexOf(node);
          if (position > -1 && position < idx) {
            nodes.splice(idx, 1);
          }
        }
        nodes.sort(function (a, b) {
          var relative = comparePos(a, b);
          if (relative & POSITION.PRECEDING) {
            return -1;
          } else if (relative & POSITION.FOLLOWING) {
            return 1;
          }
          return 0;
        });

        return nodes;
      };
    }, {}], 9: [function (require, module, exports) {
      var ElementType = require("domelementtype");
      var isTag = exports.isTag = ElementType.isTag;

      exports.testElement = function (options, element) {
        for (var key in options) {
          if (!options.hasOwnProperty(key)) ;else if (key === "tag_name") {
            if (!isTag(element) || !options.tag_name(element.name)) {
              return false;
            }
          } else if (key === "tag_type") {
            if (!options.tag_type(element.type)) return false;
          } else if (key === "tag_contains") {
            if (isTag(element) || !options.tag_contains(element.data)) {
              return false;
            }
          } else if (!element.attribs || !options[key](element.attribs[key])) {
            return false;
          }
        }
        return true;
      };

      var Checks = {
        tag_name: function tag_name(name) {
          if (typeof name === "function") {
            return function (elem) {
              return isTag(elem) && name(elem.name);
            };
          } else if (name === "*") {
            return isTag;
          } else {
            return function (elem) {
              return isTag(elem) && elem.name === name;
            };
          }
        },
        tag_type: function tag_type(type) {
          if (typeof type === "function") {
            return function (elem) {
              return type(elem.type);
            };
          } else {
            return function (elem) {
              return elem.type === type;
            };
          }
        },
        tag_contains: function tag_contains(data) {
          if (typeof data === "function") {
            return function (elem) {
              return !isTag(elem) && data(elem.data);
            };
          } else {
            return function (elem) {
              return !isTag(elem) && elem.data === data;
            };
          }
        }
      };

      function getAttribCheck(attrib, value) {
        if (typeof value === "function") {
          return function (elem) {
            return elem.attribs && value(elem.attribs[attrib]);
          };
        } else {
          return function (elem) {
            return elem.attribs && elem.attribs[attrib] === value;
          };
        }
      }

      function combineFuncs(a, b) {
        return function (elem) {
          return a(elem) || b(elem);
        };
      }

      exports.getElements = function (options, element, recurse, limit) {
        var funcs = Object.keys(options).map(function (key) {
          var value = options[key];
          return key in Checks ? Checks[key](value) : getAttribCheck(key, value);
        });

        return funcs.length === 0 ? [] : this.filter(funcs.reduce(combineFuncs), element, recurse, limit);
      };

      exports.getElementById = function (id, element, recurse) {
        if (!Array.isArray(element)) element = [element];
        return this.findOne(getAttribCheck("id", id), element, recurse !== false);
      };

      exports.getElementsByTagName = function (name, element, recurse, limit) {
        return this.filter(Checks.tag_name(name), element, recurse, limit);
      };

      exports.getElementsByTagType = function (type, element, recurse, limit) {
        return this.filter(Checks.tag_type(type), element, recurse, limit);
      };
    }, { "domelementtype": 3 }], 10: [function (require, module, exports) {
      exports.removeElement = function (elem) {
        if (elem.prev) elem.prev.next = elem.next;
        if (elem.next) elem.next.prev = elem.prev;

        if (elem.parent) {
          var childs = elem.parent.children;
          childs.splice(childs.lastIndexOf(elem), 1);
        }
      };

      exports.replaceElement = function (elem, replacement) {
        var prev = replacement.prev = elem.prev;
        if (prev) {
          prev.next = replacement;
        }

        var next = replacement.next = elem.next;
        if (next) {
          next.prev = replacement;
        }

        var parent = replacement.parent = elem.parent;
        if (parent) {
          var childs = parent.children;
          childs[childs.lastIndexOf(elem)] = replacement;
        }
      };

      exports.appendChild = function (elem, child) {
        child.parent = elem;

        if (elem.children.push(child) !== 1) {
          var sibling = elem.children[elem.children.length - 2];
          sibling.next = child;
          child.prev = sibling;
          child.next = null;
        }
      };

      exports.append = function (elem, next) {
        var parent = elem.parent,
            currNext = elem.next;

        next.next = currNext;
        next.prev = elem;
        elem.next = next;
        next.parent = parent;

        if (currNext) {
          currNext.prev = next;
          if (parent) {
            var childs = parent.children;
            childs.splice(childs.lastIndexOf(currNext), 0, next);
          }
        } else if (parent) {
          parent.children.push(next);
        }
      };

      exports.prepend = function (elem, prev) {
        var parent = elem.parent;
        if (parent) {
          var childs = parent.children;
          childs.splice(childs.lastIndexOf(elem), 0, prev);
        }

        if (elem.prev) {
          elem.prev.next = prev;
        }

        prev.parent = parent;
        prev.prev = elem.prev;
        prev.next = elem;
        elem.prev = prev;
      };
    }, {}], 11: [function (require, module, exports) {
      var isTag = require("domelementtype").isTag;

      module.exports = {
        filter: filter,
        find: find,
        findOneChild: findOneChild,
        findOne: findOne,
        existsOne: existsOne,
        findAll: findAll
      };

      function filter(test, element, recurse, limit) {
        if (!Array.isArray(element)) element = [element];

        if (typeof limit !== "number" || !isFinite(limit)) {
          limit = Infinity;
        }
        return find(test, element, recurse !== false, limit);
      }

      function find(test, elems, recurse, limit) {
        var result = [],
            childs;

        for (var i = 0, j = elems.length; i < j; i++) {
          if (test(elems[i])) {
            result.push(elems[i]);
            if (--limit <= 0) break;
          }

          childs = elems[i].children;
          if (recurse && childs && childs.length > 0) {
            childs = find(test, childs, recurse, limit);
            result = result.concat(childs);
            limit -= childs.length;
            if (limit <= 0) break;
          }
        }

        return result;
      }

      function findOneChild(test, elems) {
        for (var i = 0, l = elems.length; i < l; i++) {
          if (test(elems[i])) return elems[i];
        }

        return null;
      }

      function findOne(test, elems) {
        var elem = null;

        for (var i = 0, l = elems.length; i < l && !elem; i++) {
          if (!isTag(elems[i])) {
            continue;
          } else if (test(elems[i])) {
            elem = elems[i];
          } else if (elems[i].children.length > 0) {
            elem = findOne(test, elems[i].children);
          }
        }

        return elem;
      }

      function existsOne(test, elems) {
        for (var i = 0, l = elems.length; i < l; i++) {
          if (isTag(elems[i]) && (test(elems[i]) || elems[i].children.length > 0 && existsOne(test, elems[i].children))) {
            return true;
          }
        }

        return false;
      }

      function findAll(test, elems) {
        var result = [];
        for (var i = 0, j = elems.length; i < j; i++) {
          if (!isTag(elems[i])) continue;
          if (test(elems[i])) result.push(elems[i]);

          if (elems[i].children.length > 0) {
            result = result.concat(findAll(test, elems[i].children));
          }
        }
        return result;
      }
    }, { "domelementtype": 3 }], 12: [function (require, module, exports) {
      var ElementType = require("domelementtype"),
          getOuterHTML = require("dom-serializer"),
          isTag = ElementType.isTag;

      module.exports = {
        getInnerHTML: getInnerHTML,
        getOuterHTML: getOuterHTML,
        getText: getText
      };

      function getInnerHTML(elem, opts) {
        return elem.children ? elem.children.map(function (elem) {
          return getOuterHTML(elem, opts);
        }).join("") : "";
      }

      function getText(elem) {
        if (Array.isArray(elem)) return elem.map(getText).join("");
        if (isTag(elem) || elem.type === ElementType.CDATA) return getText(elem.children);
        if (elem.type === ElementType.Text) return elem.data;
        return "";
      }
    }, { "dom-serializer": 1, "domelementtype": 3 }], 13: [function (require, module, exports) {
      var getChildren = exports.getChildren = function (elem) {
        return elem.children;
      };

      var getParent = exports.getParent = function (elem) {
        return elem.parent;
      };

      exports.getSiblings = function (elem) {
        var parent = getParent(elem);
        return parent ? getChildren(parent) : [elem];
      };

      exports.getAttributeValue = function (elem, name) {
        return elem.attribs && elem.attribs[name];
      };

      exports.hasAttrib = function (elem, name) {
        return !!elem.attribs && hasOwnProperty.call(elem.attribs, name);
      };

      exports.getName = function (elem) {
        return elem.name;
      };
    }, {}], 14: [function (require, module, exports) {
      var encode = require("./lib/encode.js"),
          decode = require("./lib/decode.js");

      exports.decode = function (data, level) {
        return (!level || level <= 0 ? decode.XML : decode.HTML)(data);
      };

      exports.decodeStrict = function (data, level) {
        return (!level || level <= 0 ? decode.XML : decode.HTMLStrict)(data);
      };

      exports.encode = function (data, level) {
        return (!level || level <= 0 ? encode.XML : encode.HTML)(data);
      };

      exports.encodeXML = encode.XML;

      exports.encodeHTML4 = exports.encodeHTML5 = exports.encodeHTML = encode.HTML;

      exports.decodeXML = exports.decodeXMLStrict = decode.XML;

      exports.decodeHTML4 = exports.decodeHTML5 = exports.decodeHTML = decode.HTML;

      exports.decodeHTML4Strict = exports.decodeHTML5Strict = exports.decodeHTMLStrict = decode.HTMLStrict;

      exports.escape = encode.escape;
    }, { "./lib/decode.js": 15, "./lib/encode.js": 17 }], 15: [function (require, module, exports) {
      var entityMap = require("../maps/entities.json"),
          legacyMap = require("../maps/legacy.json"),
          xmlMap = require("../maps/xml.json"),
          decodeCodePoint = require("./decode_codepoint.js");

      var decodeXMLStrict = getStrictDecoder(xmlMap),
          decodeHTMLStrict = getStrictDecoder(entityMap);

      function getStrictDecoder(map) {
        var keys = Object.keys(map).join("|"),
            replace = getReplacer(map);

        keys += "|#[xX][\\da-fA-F]+|#\\d+";

        var re = new RegExp("&(?:" + keys + ");", "g");

        return function (str) {
          return String(str).replace(re, replace);
        };
      }

      var decodeHTML = function () {
        var legacy = Object.keys(legacyMap).sort(sorter);

        var keys = Object.keys(entityMap).sort(sorter);

        for (var i = 0, j = 0; i < keys.length; i++) {
          if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
          } else {
            keys[i] += ";";
          }
        }

        var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"),
            replace = getReplacer(entityMap);

        function replacer(str) {
          if (str.substr(-1) !== ";") str += ";";
          return replace(str);
        }

        //TODO consider creating a merged map
        return function (str) {
          return String(str).replace(re, replacer);
        };
      }();

      function sorter(a, b) {
        return a < b ? 1 : -1;
      }

      function getReplacer(map) {
        return function replace(str) {
          if (str.charAt(1) === "#") {
            if (str.charAt(2) === "X" || str.charAt(2) === "x") {
              return decodeCodePoint(parseInt(str.substr(3), 16));
            }
            return decodeCodePoint(parseInt(str.substr(2), 10));
          }
          return map[str.slice(1, -1)];
        };
      }

      module.exports = {
        XML: decodeXMLStrict,
        HTML: decodeHTML,
        HTMLStrict: decodeHTMLStrict
      };
    }, { "../maps/entities.json": 19, "../maps/legacy.json": 20, "../maps/xml.json": 21, "./decode_codepoint.js": 16 }], 16: [function (require, module, exports) {
      var decodeMap = require("../maps/decode.json");

      module.exports = decodeCodePoint;

      // modified version of https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
      function decodeCodePoint(codePoint) {

        if (codePoint >= 0xD800 && codePoint <= 0xDFFF || codePoint > 0x10FFFF) {
          return '�';
        }

        if (codePoint in decodeMap) {
          codePoint = decodeMap[codePoint];
        }

        var output = "";

        if (codePoint > 0xFFFF) {
          codePoint -= 0x10000;
          output += String.fromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
          codePoint = 0xDC00 | codePoint & 0x3FF;
        }

        output += String.fromCharCode(codePoint);
        return output;
      }
    }, { "../maps/decode.json": 18 }], 17: [function (require, module, exports) {
      var inverseXML = getInverseObj(require("../maps/xml.json")),
          xmlReplacer = getInverseReplacer(inverseXML);

      exports.XML = getInverse(inverseXML, xmlReplacer);

      var inverseHTML = getInverseObj(require("../maps/entities.json")),
          htmlReplacer = getInverseReplacer(inverseHTML);

      exports.HTML = getInverse(inverseHTML, htmlReplacer);

      function getInverseObj(obj) {
        return Object.keys(obj).sort().reduce(function (inverse, name) {
          inverse[obj[name]] = "&" + name + ";";
          return inverse;
        }, {});
      }

      function getInverseReplacer(inverse) {
        var single = [],
            multiple = [];

        Object.keys(inverse).forEach(function (k) {
          if (k.length === 1) {
            single.push("\\" + k);
          } else {
            multiple.push(k);
          }
        });

        //TODO add ranges
        multiple.unshift("[" + single.join("") + "]");

        return new RegExp(multiple.join("|"), "g");
      }

      var re_nonASCII = /[^\0-\x7F]/g,
          re_astralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

      function singleCharReplacer(c) {
        return "&#x" + c.charCodeAt(0).toString(16).toUpperCase() + ";";
      }

      function astralReplacer(c) {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var high = c.charCodeAt(0);
        var low = c.charCodeAt(1);
        var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
        return "&#x" + codePoint.toString(16).toUpperCase() + ";";
      }

      function getInverse(inverse, re) {
        function func(name) {
          return inverse[name];
        }

        return function (data) {
          return data.replace(re, func).replace(re_astralSymbols, astralReplacer).replace(re_nonASCII, singleCharReplacer);
        };
      }

      var re_xmlChars = getInverseReplacer(inverseXML);

      function escapeXML(data) {
        return data.replace(re_xmlChars, singleCharReplacer).replace(re_astralSymbols, astralReplacer).replace(re_nonASCII, singleCharReplacer);
      }

      exports.escape = escapeXML;
    }, { "../maps/entities.json": 19, "../maps/xml.json": 21 }], 18: [function (require, module, exports) {
      module.exports = { "0": 65533, "128": 8364, "130": 8218, "131": 402, "132": 8222, "133": 8230, "134": 8224, "135": 8225, "136": 710, "137": 8240, "138": 352, "139": 8249, "140": 338, "142": 381, "145": 8216, "146": 8217, "147": 8220, "148": 8221, "149": 8226, "150": 8211, "151": 8212, "152": 732, "153": 8482, "154": 353, "155": 8250, "156": 339, "158": 382, "159": 376 };
    }, {}], 19: [function (require, module, exports) {
      module.exports = { "Aacute": 'Á', "aacute": 'á', "Abreve": 'Ă', "abreve": 'ă', "ac": '∾', "acd": '∿', "acE": '∾̳', "Acirc": 'Â', "acirc": 'â', "acute": '´', "Acy": 'А', "acy": 'а', "AElig": 'Æ', "aelig": 'æ', "af": '⁡', "Afr": '𝔄', "afr": '𝔞', "Agrave": 'À', "agrave": 'à', "alefsym": 'ℵ', "aleph": 'ℵ', "Alpha": 'Α', "alpha": 'α', "Amacr": 'Ā', "amacr": 'ā', "amalg": '⨿', "amp": "&", "AMP": "&", "andand": '⩕', "And": '⩓', "and": '∧', "andd": '⩜', "andslope": '⩘', "andv": '⩚', "ang": '∠', "ange": '⦤', "angle": '∠', "angmsdaa": '⦨', "angmsdab": '⦩', "angmsdac": '⦪', "angmsdad": '⦫', "angmsdae": '⦬', "angmsdaf": '⦭', "angmsdag": '⦮', "angmsdah": '⦯', "angmsd": '∡', "angrt": '∟', "angrtvb": '⊾', "angrtvbd": '⦝', "angsph": '∢', "angst": 'Å', "angzarr": '⍼', "Aogon": 'Ą', "aogon": 'ą', "Aopf": '𝔸', "aopf": '𝕒', "apacir": '⩯', "ap": '≈', "apE": '⩰', "ape": '≊', "apid": '≋', "apos": "'", "ApplyFunction": '⁡', "approx": '≈', "approxeq": '≊', "Aring": 'Å', "aring": 'å', "Ascr": '𝒜', "ascr": '𝒶', "Assign": '≔', "ast": "*", "asymp": '≈', "asympeq": '≍', "Atilde": 'Ã', "atilde": 'ã', "Auml": 'Ä', "auml": 'ä', "awconint": '∳', "awint": '⨑', "backcong": '≌', "backepsilon": '϶', "backprime": '‵', "backsim": '∽', "backsimeq": '⋍', "Backslash": '∖', "Barv": '⫧', "barvee": '⊽', "barwed": '⌅', "Barwed": '⌆', "barwedge": '⌅', "bbrk": '⎵', "bbrktbrk": '⎶', "bcong": '≌', "Bcy": 'Б', "bcy": 'б', "bdquo": '„', "becaus": '∵', "because": '∵', "Because": '∵', "bemptyv": '⦰', "bepsi": '϶', "bernou": 'ℬ', "Bernoullis": 'ℬ', "Beta": 'Β', "beta": 'β', "beth": 'ℶ', "between": '≬', "Bfr": '𝔅', "bfr": '𝔟', "bigcap": '⋂', "bigcirc": '◯', "bigcup": '⋃', "bigodot": '⨀', "bigoplus": '⨁', "bigotimes": '⨂', "bigsqcup": '⨆', "bigstar": '★', "bigtriangledown": '▽', "bigtriangleup": '△', "biguplus": '⨄', "bigvee": '⋁', "bigwedge": '⋀', "bkarow": '⤍', "blacklozenge": '⧫', "blacksquare": '▪', "blacktriangle": '▴', "blacktriangledown": '▾', "blacktriangleleft": '◂', "blacktriangleright": '▸', "blank": '␣', "blk12": '▒', "blk14": '░', "blk34": '▓', "block": '█', "bne": '=⃥', "bnequiv": '≡⃥', "bNot": '⫭', "bnot": '⌐', "Bopf": '𝔹', "bopf": '𝕓', "bot": '⊥', "bottom": '⊥', "bowtie": '⋈', "boxbox": '⧉', "boxdl": '┐', "boxdL": '╕', "boxDl": '╖', "boxDL": '╗', "boxdr": '┌', "boxdR": '╒', "boxDr": '╓', "boxDR": '╔', "boxh": '─', "boxH": '═', "boxhd": '┬', "boxHd": '╤', "boxhD": '╥', "boxHD": '╦', "boxhu": '┴', "boxHu": '╧', "boxhU": '╨', "boxHU": '╩', "boxminus": '⊟', "boxplus": '⊞', "boxtimes": '⊠', "boxul": '┘', "boxuL": '╛', "boxUl": '╜', "boxUL": '╝', "boxur": '└', "boxuR": '╘', "boxUr": '╙', "boxUR": '╚', "boxv": '│', "boxV": '║', "boxvh": '┼', "boxvH": '╪', "boxVh": '╫', "boxVH": '╬', "boxvl": '┤', "boxvL": '╡', "boxVl": '╢', "boxVL": '╣', "boxvr": '├', "boxvR": '╞', "boxVr": '╟', "boxVR": '╠', "bprime": '‵', "breve": '˘', "Breve": '˘', "brvbar": '¦', "bscr": '𝒷', "Bscr": 'ℬ', "bsemi": '⁏', "bsim": '∽', "bsime": '⋍', "bsolb": '⧅', "bsol": "\\", "bsolhsub": '⟈', "bull": '•', "bullet": '•', "bump": '≎', "bumpE": '⪮', "bumpe": '≏', "Bumpeq": '≎', "bumpeq": '≏', "Cacute": 'Ć', "cacute": 'ć', "capand": '⩄', "capbrcup": '⩉', "capcap": '⩋', "cap": '∩', "Cap": '⋒', "capcup": '⩇', "capdot": '⩀', "CapitalDifferentialD": 'ⅅ', "caps": '∩︀', "caret": '⁁', "caron": 'ˇ', "Cayleys": 'ℭ', "ccaps": '⩍', "Ccaron": 'Č', "ccaron": 'č', "Ccedil": 'Ç', "ccedil": 'ç', "Ccirc": 'Ĉ', "ccirc": 'ĉ', "Cconint": '∰', "ccups": '⩌', "ccupssm": '⩐', "Cdot": 'Ċ', "cdot": 'ċ', "cedil": '¸', "Cedilla": '¸', "cemptyv": '⦲', "cent": '¢', "centerdot": '·', "CenterDot": '·', "cfr": '𝔠', "Cfr": 'ℭ', "CHcy": 'Ч', "chcy": 'ч', "check": '✓', "checkmark": '✓', "Chi": 'Χ', "chi": 'χ', "circ": 'ˆ', "circeq": '≗', "circlearrowleft": '↺', "circlearrowright": '↻', "circledast": '⊛', "circledcirc": '⊚', "circleddash": '⊝', "CircleDot": '⊙', "circledR": '®', "circledS": 'Ⓢ', "CircleMinus": '⊖', "CirclePlus": '⊕', "CircleTimes": '⊗', "cir": '○', "cirE": '⧃', "cire": '≗', "cirfnint": '⨐', "cirmid": '⫯', "cirscir": '⧂', "ClockwiseContourIntegral": '∲', "CloseCurlyDoubleQuote": '”', "CloseCurlyQuote": '’', "clubs": '♣', "clubsuit": '♣', "colon": ":", "Colon": '∷', "Colone": '⩴', "colone": '≔', "coloneq": '≔', "comma": ",", "commat": "@", "comp": '∁', "compfn": '∘', "complement": '∁', "complexes": 'ℂ', "cong": '≅', "congdot": '⩭', "Congruent": '≡', "conint": '∮', "Conint": '∯', "ContourIntegral": '∮', "copf": '𝕔', "Copf": 'ℂ', "coprod": '∐', "Coproduct": '∐', "copy": '©', "COPY": '©', "copysr": '℗', "CounterClockwiseContourIntegral": '∳', "crarr": '↵', "cross": '✗', "Cross": '⨯', "Cscr": '𝒞', "cscr": '𝒸', "csub": '⫏', "csube": '⫑', "csup": '⫐', "csupe": '⫒', "ctdot": '⋯', "cudarrl": '⤸', "cudarrr": '⤵', "cuepr": '⋞', "cuesc": '⋟', "cularr": '↶', "cularrp": '⤽', "cupbrcap": '⩈', "cupcap": '⩆', "CupCap": '≍', "cup": '∪', "Cup": '⋓', "cupcup": '⩊', "cupdot": '⊍', "cupor": '⩅', "cups": '∪︀', "curarr": '↷', "curarrm": '⤼', "curlyeqprec": '⋞', "curlyeqsucc": '⋟', "curlyvee": '⋎', "curlywedge": '⋏', "curren": '¤', "curvearrowleft": '↶', "curvearrowright": '↷', "cuvee": '⋎', "cuwed": '⋏', "cwconint": '∲', "cwint": '∱', "cylcty": '⌭', "dagger": '†', "Dagger": '‡', "daleth": 'ℸ', "darr": '↓', "Darr": '↡', "dArr": '⇓', "dash": '‐', "Dashv": '⫤', "dashv": '⊣', "dbkarow": '⤏', "dblac": '˝', "Dcaron": 'Ď', "dcaron": 'ď', "Dcy": 'Д', "dcy": 'д', "ddagger": '‡', "ddarr": '⇊', "DD": 'ⅅ', "dd": 'ⅆ', "DDotrahd": '⤑', "ddotseq": '⩷', "deg": '°', "Del": '∇', "Delta": 'Δ', "delta": 'δ', "demptyv": '⦱', "dfisht": '⥿', "Dfr": '𝔇', "dfr": '𝔡', "dHar": '⥥', "dharl": '⇃', "dharr": '⇂', "DiacriticalAcute": '´', "DiacriticalDot": '˙', "DiacriticalDoubleAcute": '˝', "DiacriticalGrave": "`", "DiacriticalTilde": '˜', "diam": '⋄', "diamond": '⋄', "Diamond": '⋄', "diamondsuit": '♦', "diams": '♦', "die": '¨', "DifferentialD": 'ⅆ', "digamma": 'ϝ', "disin": '⋲', "div": '÷', "divide": '÷', "divideontimes": '⋇', "divonx": '⋇', "DJcy": 'Ђ', "djcy": 'ђ', "dlcorn": '⌞', "dlcrop": '⌍', "dollar": "$", "Dopf": '𝔻', "dopf": '𝕕', "Dot": '¨', "dot": '˙', "DotDot": '⃜', "doteq": '≐', "doteqdot": '≑', "DotEqual": '≐', "dotminus": '∸', "dotplus": '∔', "dotsquare": '⊡', "doublebarwedge": '⌆', "DoubleContourIntegral": '∯', "DoubleDot": '¨', "DoubleDownArrow": '⇓', "DoubleLeftArrow": '⇐', "DoubleLeftRightArrow": '⇔', "DoubleLeftTee": '⫤', "DoubleLongLeftArrow": '⟸', "DoubleLongLeftRightArrow": '⟺', "DoubleLongRightArrow": '⟹', "DoubleRightArrow": '⇒', "DoubleRightTee": '⊨', "DoubleUpArrow": '⇑', "DoubleUpDownArrow": '⇕', "DoubleVerticalBar": '∥', "DownArrowBar": '⤓', "downarrow": '↓', "DownArrow": '↓', "Downarrow": '⇓', "DownArrowUpArrow": '⇵', "DownBreve": '̑', "downdownarrows": '⇊', "downharpoonleft": '⇃', "downharpoonright": '⇂', "DownLeftRightVector": '⥐', "DownLeftTeeVector": '⥞', "DownLeftVectorBar": '⥖', "DownLeftVector": '↽', "DownRightTeeVector": '⥟', "DownRightVectorBar": '⥗', "DownRightVector": '⇁', "DownTeeArrow": '↧', "DownTee": '⊤', "drbkarow": '⤐', "drcorn": '⌟', "drcrop": '⌌', "Dscr": '𝒟', "dscr": '𝒹', "DScy": 'Ѕ', "dscy": 'ѕ', "dsol": '⧶', "Dstrok": 'Đ', "dstrok": 'đ', "dtdot": '⋱', "dtri": '▿', "dtrif": '▾', "duarr": '⇵', "duhar": '⥯', "dwangle": '⦦', "DZcy": 'Џ', "dzcy": 'џ', "dzigrarr": '⟿', "Eacute": 'É', "eacute": 'é', "easter": '⩮', "Ecaron": 'Ě', "ecaron": 'ě', "Ecirc": 'Ê', "ecirc": 'ê', "ecir": '≖', "ecolon": '≕', "Ecy": 'Э', "ecy": 'э', "eDDot": '⩷', "Edot": 'Ė', "edot": 'ė', "eDot": '≑', "ee": 'ⅇ', "efDot": '≒', "Efr": '𝔈', "efr": '𝔢', "eg": '⪚', "Egrave": 'È', "egrave": 'è', "egs": '⪖', "egsdot": '⪘', "el": '⪙', "Element": '∈', "elinters": '⏧', "ell": 'ℓ', "els": '⪕', "elsdot": '⪗', "Emacr": 'Ē', "emacr": 'ē', "empty": '∅', "emptyset": '∅', "EmptySmallSquare": '◻', "emptyv": '∅', "EmptyVerySmallSquare": '▫', "emsp13": ' ', "emsp14": ' ', "emsp": ' ', "ENG": 'Ŋ', "eng": 'ŋ', "ensp": ' ', "Eogon": 'Ę', "eogon": 'ę', "Eopf": '𝔼', "eopf": '𝕖', "epar": '⋕', "eparsl": '⧣', "eplus": '⩱', "epsi": 'ε', "Epsilon": 'Ε', "epsilon": 'ε', "epsiv": 'ϵ', "eqcirc": '≖', "eqcolon": '≕', "eqsim": '≂', "eqslantgtr": '⪖', "eqslantless": '⪕', "Equal": '⩵', "equals": "=", "EqualTilde": '≂', "equest": '≟', "Equilibrium": '⇌', "equiv": '≡', "equivDD": '⩸', "eqvparsl": '⧥', "erarr": '⥱', "erDot": '≓', "escr": 'ℯ', "Escr": 'ℰ', "esdot": '≐', "Esim": '⩳', "esim": '≂', "Eta": 'Η', "eta": 'η', "ETH": 'Ð', "eth": 'ð', "Euml": 'Ë', "euml": 'ë', "euro": '€', "excl": "!", "exist": '∃', "Exists": '∃', "expectation": 'ℰ', "exponentiale": 'ⅇ', "ExponentialE": 'ⅇ', "fallingdotseq": '≒', "Fcy": 'Ф', "fcy": 'ф', "female": '♀', "ffilig": 'ﬃ', "fflig": 'ﬀ', "ffllig": 'ﬄ', "Ffr": '𝔉', "ffr": '𝔣', "filig": 'ﬁ', "FilledSmallSquare": '◼', "FilledVerySmallSquare": '▪', "fjlig": "fj", "flat": '♭', "fllig": 'ﬂ', "fltns": '▱', "fnof": 'ƒ', "Fopf": '𝔽', "fopf": '𝕗', "forall": '∀', "ForAll": '∀', "fork": '⋔', "forkv": '⫙', "Fouriertrf": 'ℱ', "fpartint": '⨍', "frac12": '½', "frac13": '⅓', "frac14": '¼', "frac15": '⅕', "frac16": '⅙', "frac18": '⅛', "frac23": '⅔', "frac25": '⅖', "frac34": '¾', "frac35": '⅗', "frac38": '⅜', "frac45": '⅘', "frac56": '⅚', "frac58": '⅝', "frac78": '⅞', "frasl": '⁄', "frown": '⌢', "fscr": '𝒻', "Fscr": 'ℱ', "gacute": 'ǵ', "Gamma": 'Γ', "gamma": 'γ', "Gammad": 'Ϝ', "gammad": 'ϝ', "gap": '⪆', "Gbreve": 'Ğ', "gbreve": 'ğ', "Gcedil": 'Ģ', "Gcirc": 'Ĝ', "gcirc": 'ĝ', "Gcy": 'Г', "gcy": 'г', "Gdot": 'Ġ', "gdot": 'ġ', "ge": '≥', "gE": '≧', "gEl": '⪌', "gel": '⋛', "geq": '≥', "geqq": '≧', "geqslant": '⩾', "gescc": '⪩', "ges": '⩾', "gesdot": '⪀', "gesdoto": '⪂', "gesdotol": '⪄', "gesl": '⋛︀', "gesles": '⪔', "Gfr": '𝔊', "gfr": '𝔤', "gg": '≫', "Gg": '⋙', "ggg": '⋙', "gimel": 'ℷ', "GJcy": 'Ѓ', "gjcy": 'ѓ', "gla": '⪥', "gl": '≷', "glE": '⪒', "glj": '⪤', "gnap": '⪊', "gnapprox": '⪊', "gne": '⪈', "gnE": '≩', "gneq": '⪈', "gneqq": '≩', "gnsim": '⋧', "Gopf": '𝔾', "gopf": '𝕘', "grave": "`", "GreaterEqual": '≥', "GreaterEqualLess": '⋛', "GreaterFullEqual": '≧', "GreaterGreater": '⪢', "GreaterLess": '≷', "GreaterSlantEqual": '⩾', "GreaterTilde": '≳', "Gscr": '𝒢', "gscr": 'ℊ', "gsim": '≳', "gsime": '⪎', "gsiml": '⪐', "gtcc": '⪧', "gtcir": '⩺', "gt": ">", "GT": ">", "Gt": '≫', "gtdot": '⋗', "gtlPar": '⦕', "gtquest": '⩼', "gtrapprox": '⪆', "gtrarr": '⥸', "gtrdot": '⋗', "gtreqless": '⋛', "gtreqqless": '⪌', "gtrless": '≷', "gtrsim": '≳', "gvertneqq": '≩︀', "gvnE": '≩︀', "Hacek": 'ˇ', "hairsp": ' ', "half": '½', "hamilt": 'ℋ', "HARDcy": 'Ъ', "hardcy": 'ъ', "harrcir": '⥈', "harr": '↔', "hArr": '⇔', "harrw": '↭', "Hat": "^", "hbar": 'ℏ', "Hcirc": 'Ĥ', "hcirc": 'ĥ', "hearts": '♥', "heartsuit": '♥', "hellip": '…', "hercon": '⊹', "hfr": '𝔥', "Hfr": 'ℌ', "HilbertSpace": 'ℋ', "hksearow": '⤥', "hkswarow": '⤦', "hoarr": '⇿', "homtht": '∻', "hookleftarrow": '↩', "hookrightarrow": '↪', "hopf": '𝕙', "Hopf": 'ℍ', "horbar": '―', "HorizontalLine": '─', "hscr": '𝒽', "Hscr": 'ℋ', "hslash": 'ℏ', "Hstrok": 'Ħ', "hstrok": 'ħ', "HumpDownHump": '≎', "HumpEqual": '≏', "hybull": '⁃', "hyphen": '‐', "Iacute": 'Í', "iacute": 'í', "ic": '⁣', "Icirc": 'Î', "icirc": 'î', "Icy": 'И', "icy": 'и', "Idot": 'İ', "IEcy": 'Е', "iecy": 'е', "iexcl": '¡', "iff": '⇔', "ifr": '𝔦', "Ifr": 'ℑ', "Igrave": 'Ì', "igrave": 'ì', "ii": 'ⅈ', "iiiint": '⨌', "iiint": '∭', "iinfin": '⧜', "iiota": '℩', "IJlig": 'Ĳ', "ijlig": 'ĳ', "Imacr": 'Ī', "imacr": 'ī', "image": 'ℑ', "ImaginaryI": 'ⅈ', "imagline": 'ℐ', "imagpart": 'ℑ', "imath": 'ı', "Im": 'ℑ', "imof": '⊷', "imped": 'Ƶ', "Implies": '⇒', "incare": '℅', "in": '∈', "infin": '∞', "infintie": '⧝', "inodot": 'ı', "intcal": '⊺', "int": '∫', "Int": '∬', "integers": 'ℤ', "Integral": '∫', "intercal": '⊺', "Intersection": '⋂', "intlarhk": '⨗', "intprod": '⨼', "InvisibleComma": '⁣', "InvisibleTimes": '⁢', "IOcy": 'Ё', "iocy": 'ё', "Iogon": 'Į', "iogon": 'į', "Iopf": '𝕀', "iopf": '𝕚', "Iota": 'Ι', "iota": 'ι', "iprod": '⨼', "iquest": '¿', "iscr": '𝒾', "Iscr": 'ℐ', "isin": '∈', "isindot": '⋵', "isinE": '⋹', "isins": '⋴', "isinsv": '⋳', "isinv": '∈', "it": '⁢', "Itilde": 'Ĩ', "itilde": 'ĩ', "Iukcy": 'І', "iukcy": 'і', "Iuml": 'Ï', "iuml": 'ï', "Jcirc": 'Ĵ', "jcirc": 'ĵ', "Jcy": 'Й', "jcy": 'й', "Jfr": '𝔍', "jfr": '𝔧', "jmath": 'ȷ', "Jopf": '𝕁', "jopf": '𝕛', "Jscr": '𝒥', "jscr": '𝒿', "Jsercy": 'Ј', "jsercy": 'ј', "Jukcy": 'Є', "jukcy": 'є', "Kappa": 'Κ', "kappa": 'κ', "kappav": 'ϰ', "Kcedil": 'Ķ', "kcedil": 'ķ', "Kcy": 'К', "kcy": 'к', "Kfr": '𝔎', "kfr": '𝔨', "kgreen": 'ĸ', "KHcy": 'Х', "khcy": 'х', "KJcy": 'Ќ', "kjcy": 'ќ', "Kopf": '𝕂', "kopf": '𝕜', "Kscr": '𝒦', "kscr": '𝓀', "lAarr": '⇚', "Lacute": 'Ĺ', "lacute": 'ĺ', "laemptyv": '⦴', "lagran": 'ℒ', "Lambda": 'Λ', "lambda": 'λ', "lang": '⟨', "Lang": '⟪', "langd": '⦑', "langle": '⟨', "lap": '⪅', "Laplacetrf": 'ℒ', "laquo": '«', "larrb": '⇤', "larrbfs": '⤟', "larr": '←', "Larr": '↞', "lArr": '⇐', "larrfs": '⤝', "larrhk": '↩', "larrlp": '↫', "larrpl": '⤹', "larrsim": '⥳', "larrtl": '↢', "latail": '⤙', "lAtail": '⤛', "lat": '⪫', "late": '⪭', "lates": '⪭︀', "lbarr": '⤌', "lBarr": '⤎', "lbbrk": '❲', "lbrace": "{", "lbrack": "[", "lbrke": '⦋', "lbrksld": '⦏', "lbrkslu": '⦍', "Lcaron": 'Ľ', "lcaron": 'ľ', "Lcedil": 'Ļ', "lcedil": 'ļ', "lceil": '⌈', "lcub": "{", "Lcy": 'Л', "lcy": 'л', "ldca": '⤶', "ldquo": '“', "ldquor": '„', "ldrdhar": '⥧', "ldrushar": '⥋', "ldsh": '↲', "le": '≤', "lE": '≦', "LeftAngleBracket": '⟨', "LeftArrowBar": '⇤', "leftarrow": '←', "LeftArrow": '←', "Leftarrow": '⇐', "LeftArrowRightArrow": '⇆', "leftarrowtail": '↢', "LeftCeiling": '⌈', "LeftDoubleBracket": '⟦', "LeftDownTeeVector": '⥡', "LeftDownVectorBar": '⥙', "LeftDownVector": '⇃', "LeftFloor": '⌊', "leftharpoondown": '↽', "leftharpoonup": '↼', "leftleftarrows": '⇇', "leftrightarrow": '↔', "LeftRightArrow": '↔', "Leftrightarrow": '⇔', "leftrightarrows": '⇆', "leftrightharpoons": '⇋', "leftrightsquigarrow": '↭', "LeftRightVector": '⥎', "LeftTeeArrow": '↤', "LeftTee": '⊣', "LeftTeeVector": '⥚', "leftthreetimes": '⋋', "LeftTriangleBar": '⧏', "LeftTriangle": '⊲', "LeftTriangleEqual": '⊴', "LeftUpDownVector": '⥑', "LeftUpTeeVector": '⥠', "LeftUpVectorBar": '⥘', "LeftUpVector": '↿', "LeftVectorBar": '⥒', "LeftVector": '↼', "lEg": '⪋', "leg": '⋚', "leq": '≤', "leqq": '≦', "leqslant": '⩽', "lescc": '⪨', "les": '⩽', "lesdot": '⩿', "lesdoto": '⪁', "lesdotor": '⪃', "lesg": '⋚︀', "lesges": '⪓', "lessapprox": '⪅', "lessdot": '⋖', "lesseqgtr": '⋚', "lesseqqgtr": '⪋', "LessEqualGreater": '⋚', "LessFullEqual": '≦', "LessGreater": '≶', "lessgtr": '≶', "LessLess": '⪡', "lesssim": '≲', "LessSlantEqual": '⩽', "LessTilde": '≲', "lfisht": '⥼', "lfloor": '⌊', "Lfr": '𝔏', "lfr": '𝔩', "lg": '≶', "lgE": '⪑', "lHar": '⥢', "lhard": '↽', "lharu": '↼', "lharul": '⥪', "lhblk": '▄', "LJcy": 'Љ', "ljcy": 'љ', "llarr": '⇇', "ll": '≪', "Ll": '⋘', "llcorner": '⌞', "Lleftarrow": '⇚', "llhard": '⥫', "lltri": '◺', "Lmidot": 'Ŀ', "lmidot": 'ŀ', "lmoustache": '⎰', "lmoust": '⎰', "lnap": '⪉', "lnapprox": '⪉', "lne": '⪇', "lnE": '≨', "lneq": '⪇', "lneqq": '≨', "lnsim": '⋦', "loang": '⟬', "loarr": '⇽', "lobrk": '⟦', "longleftarrow": '⟵', "LongLeftArrow": '⟵', "Longleftarrow": '⟸', "longleftrightarrow": '⟷', "LongLeftRightArrow": '⟷', "Longleftrightarrow": '⟺', "longmapsto": '⟼', "longrightarrow": '⟶', "LongRightArrow": '⟶', "Longrightarrow": '⟹', "looparrowleft": '↫', "looparrowright": '↬', "lopar": '⦅', "Lopf": '𝕃', "lopf": '𝕝', "loplus": '⨭', "lotimes": '⨴', "lowast": '∗', "lowbar": "_", "LowerLeftArrow": '↙', "LowerRightArrow": '↘', "loz": '◊', "lozenge": '◊', "lozf": '⧫', "lpar": "(", "lparlt": '⦓', "lrarr": '⇆', "lrcorner": '⌟', "lrhar": '⇋', "lrhard": '⥭', "lrm": '‎', "lrtri": '⊿', "lsaquo": '‹', "lscr": '𝓁', "Lscr": 'ℒ', "lsh": '↰', "Lsh": '↰', "lsim": '≲', "lsime": '⪍', "lsimg": '⪏', "lsqb": "[", "lsquo": '‘', "lsquor": '‚', "Lstrok": 'Ł', "lstrok": 'ł', "ltcc": '⪦', "ltcir": '⩹', "lt": "<", "LT": "<", "Lt": '≪', "ltdot": '⋖', "lthree": '⋋', "ltimes": '⋉', "ltlarr": '⥶', "ltquest": '⩻', "ltri": '◃', "ltrie": '⊴', "ltrif": '◂', "ltrPar": '⦖', "lurdshar": '⥊', "luruhar": '⥦', "lvertneqq": '≨︀', "lvnE": '≨︀', "macr": '¯', "male": '♂', "malt": '✠', "maltese": '✠', "Map": '⤅', "map": '↦', "mapsto": '↦', "mapstodown": '↧', "mapstoleft": '↤', "mapstoup": '↥', "marker": '▮', "mcomma": '⨩', "Mcy": 'М', "mcy": 'м', "mdash": '—', "mDDot": '∺', "measuredangle": '∡', "MediumSpace": ' ', "Mellintrf": 'ℳ', "Mfr": '𝔐', "mfr": '𝔪', "mho": '℧', "micro": 'µ', "midast": "*", "midcir": '⫰', "mid": '∣', "middot": '·', "minusb": '⊟', "minus": '−', "minusd": '∸', "minusdu": '⨪', "MinusPlus": '∓', "mlcp": '⫛', "mldr": '…', "mnplus": '∓', "models": '⊧', "Mopf": '𝕄', "mopf": '𝕞', "mp": '∓', "mscr": '𝓂', "Mscr": 'ℳ', "mstpos": '∾', "Mu": 'Μ', "mu": 'μ', "multimap": '⊸', "mumap": '⊸', "nabla": '∇', "Nacute": 'Ń', "nacute": 'ń', "nang": '∠⃒', "nap": '≉', "napE": '⩰̸', "napid": '≋̸', "napos": 'ŉ', "napprox": '≉', "natural": '♮', "naturals": 'ℕ', "natur": '♮', "nbsp": ' ', "nbump": '≎̸', "nbumpe": '≏̸', "ncap": '⩃', "Ncaron": 'Ň', "ncaron": 'ň', "Ncedil": 'Ņ', "ncedil": 'ņ', "ncong": '≇', "ncongdot": '⩭̸', "ncup": '⩂', "Ncy": 'Н', "ncy": 'н', "ndash": '–', "nearhk": '⤤', "nearr": '↗', "neArr": '⇗', "nearrow": '↗', "ne": '≠', "nedot": '≐̸', "NegativeMediumSpace": '​', "NegativeThickSpace": '​', "NegativeThinSpace": '​', "NegativeVeryThinSpace": '​', "nequiv": '≢', "nesear": '⤨', "nesim": '≂̸', "NestedGreaterGreater": '≫', "NestedLessLess": '≪', "NewLine": "\n", "nexist": '∄', "nexists": '∄', "Nfr": '𝔑', "nfr": '𝔫', "ngE": '≧̸', "nge": '≱', "ngeq": '≱', "ngeqq": '≧̸', "ngeqslant": '⩾̸', "nges": '⩾̸', "nGg": '⋙̸', "ngsim": '≵', "nGt": '≫⃒', "ngt": '≯', "ngtr": '≯', "nGtv": '≫̸', "nharr": '↮', "nhArr": '⇎', "nhpar": '⫲', "ni": '∋', "nis": '⋼', "nisd": '⋺', "niv": '∋', "NJcy": 'Њ', "njcy": 'њ', "nlarr": '↚', "nlArr": '⇍', "nldr": '‥', "nlE": '≦̸', "nle": '≰', "nleftarrow": '↚', "nLeftarrow": '⇍', "nleftrightarrow": '↮', "nLeftrightarrow": '⇎', "nleq": '≰', "nleqq": '≦̸', "nleqslant": '⩽̸', "nles": '⩽̸', "nless": '≮', "nLl": '⋘̸', "nlsim": '≴', "nLt": '≪⃒', "nlt": '≮', "nltri": '⋪', "nltrie": '⋬', "nLtv": '≪̸', "nmid": '∤', "NoBreak": '⁠', "NonBreakingSpace": ' ', "nopf": '𝕟', "Nopf": 'ℕ', "Not": '⫬', "not": '¬', "NotCongruent": '≢', "NotCupCap": '≭', "NotDoubleVerticalBar": '∦', "NotElement": '∉', "NotEqual": '≠', "NotEqualTilde": '≂̸', "NotExists": '∄', "NotGreater": '≯', "NotGreaterEqual": '≱', "NotGreaterFullEqual": '≧̸', "NotGreaterGreater": '≫̸', "NotGreaterLess": '≹', "NotGreaterSlantEqual": '⩾̸', "NotGreaterTilde": '≵', "NotHumpDownHump": '≎̸', "NotHumpEqual": '≏̸', "notin": '∉', "notindot": '⋵̸', "notinE": '⋹̸', "notinva": '∉', "notinvb": '⋷', "notinvc": '⋶', "NotLeftTriangleBar": '⧏̸', "NotLeftTriangle": '⋪', "NotLeftTriangleEqual": '⋬', "NotLess": '≮', "NotLessEqual": '≰', "NotLessGreater": '≸', "NotLessLess": '≪̸', "NotLessSlantEqual": '⩽̸', "NotLessTilde": '≴', "NotNestedGreaterGreater": '⪢̸', "NotNestedLessLess": '⪡̸', "notni": '∌', "notniva": '∌', "notnivb": '⋾', "notnivc": '⋽', "NotPrecedes": '⊀', "NotPrecedesEqual": '⪯̸', "NotPrecedesSlantEqual": '⋠', "NotReverseElement": '∌', "NotRightTriangleBar": '⧐̸', "NotRightTriangle": '⋫', "NotRightTriangleEqual": '⋭', "NotSquareSubset": '⊏̸', "NotSquareSubsetEqual": '⋢', "NotSquareSuperset": '⊐̸', "NotSquareSupersetEqual": '⋣', "NotSubset": '⊂⃒', "NotSubsetEqual": '⊈', "NotSucceeds": '⊁', "NotSucceedsEqual": '⪰̸', "NotSucceedsSlantEqual": '⋡', "NotSucceedsTilde": '≿̸', "NotSuperset": '⊃⃒', "NotSupersetEqual": '⊉', "NotTilde": '≁', "NotTildeEqual": '≄', "NotTildeFullEqual": '≇', "NotTildeTilde": '≉', "NotVerticalBar": '∤', "nparallel": '∦', "npar": '∦', "nparsl": '⫽⃥', "npart": '∂̸', "npolint": '⨔', "npr": '⊀', "nprcue": '⋠', "nprec": '⊀', "npreceq": '⪯̸', "npre": '⪯̸', "nrarrc": '⤳̸', "nrarr": '↛', "nrArr": '⇏', "nrarrw": '↝̸', "nrightarrow": '↛', "nRightarrow": '⇏', "nrtri": '⋫', "nrtrie": '⋭', "nsc": '⊁', "nsccue": '⋡', "nsce": '⪰̸', "Nscr": '𝒩', "nscr": '𝓃', "nshortmid": '∤', "nshortparallel": '∦', "nsim": '≁', "nsime": '≄', "nsimeq": '≄', "nsmid": '∤', "nspar": '∦', "nsqsube": '⋢', "nsqsupe": '⋣', "nsub": '⊄', "nsubE": '⫅̸', "nsube": '⊈', "nsubset": '⊂⃒', "nsubseteq": '⊈', "nsubseteqq": '⫅̸', "nsucc": '⊁', "nsucceq": '⪰̸', "nsup": '⊅', "nsupE": '⫆̸', "nsupe": '⊉', "nsupset": '⊃⃒', "nsupseteq": '⊉', "nsupseteqq": '⫆̸', "ntgl": '≹', "Ntilde": 'Ñ', "ntilde": 'ñ', "ntlg": '≸', "ntriangleleft": '⋪', "ntrianglelefteq": '⋬', "ntriangleright": '⋫', "ntrianglerighteq": '⋭', "Nu": 'Ν', "nu": 'ν', "num": "#", "numero": '№', "numsp": ' ', "nvap": '≍⃒', "nvdash": '⊬', "nvDash": '⊭', "nVdash": '⊮', "nVDash": '⊯', "nvge": '≥⃒', "nvgt": '>⃒', "nvHarr": '⤄', "nvinfin": '⧞', "nvlArr": '⤂', "nvle": '≤⃒', "nvlt": '<⃒', "nvltrie": '⊴⃒', "nvrArr": '⤃', "nvrtrie": '⊵⃒', "nvsim": '∼⃒', "nwarhk": '⤣', "nwarr": '↖', "nwArr": '⇖', "nwarrow": '↖', "nwnear": '⤧', "Oacute": 'Ó', "oacute": 'ó', "oast": '⊛', "Ocirc": 'Ô', "ocirc": 'ô', "ocir": '⊚', "Ocy": 'О', "ocy": 'о', "odash": '⊝', "Odblac": 'Ő', "odblac": 'ő', "odiv": '⨸', "odot": '⊙', "odsold": '⦼', "OElig": 'Œ', "oelig": 'œ', "ofcir": '⦿', "Ofr": '𝔒', "ofr": '𝔬', "ogon": '˛', "Ograve": 'Ò', "ograve": 'ò', "ogt": '⧁', "ohbar": '⦵', "ohm": 'Ω', "oint": '∮', "olarr": '↺', "olcir": '⦾', "olcross": '⦻', "oline": '‾', "olt": '⧀', "Omacr": 'Ō', "omacr": 'ō', "Omega": 'Ω', "omega": 'ω', "Omicron": 'Ο', "omicron": 'ο', "omid": '⦶', "ominus": '⊖', "Oopf": '𝕆', "oopf": '𝕠', "opar": '⦷', "OpenCurlyDoubleQuote": '“', "OpenCurlyQuote": '‘', "operp": '⦹', "oplus": '⊕', "orarr": '↻', "Or": '⩔', "or": '∨', "ord": '⩝', "order": 'ℴ', "orderof": 'ℴ', "ordf": 'ª', "ordm": 'º', "origof": '⊶', "oror": '⩖', "orslope": '⩗', "orv": '⩛', "oS": 'Ⓢ', "Oscr": '𝒪', "oscr": 'ℴ', "Oslash": 'Ø', "oslash": 'ø', "osol": '⊘', "Otilde": 'Õ', "otilde": 'õ', "otimesas": '⨶', "Otimes": '⨷', "otimes": '⊗', "Ouml": 'Ö', "ouml": 'ö', "ovbar": '⌽', "OverBar": '‾', "OverBrace": '⏞', "OverBracket": '⎴', "OverParenthesis": '⏜', "para": '¶', "parallel": '∥', "par": '∥', "parsim": '⫳', "parsl": '⫽', "part": '∂', "PartialD": '∂', "Pcy": 'П', "pcy": 'п', "percnt": "%", "period": ".", "permil": '‰', "perp": '⊥', "pertenk": '‱', "Pfr": '𝔓', "pfr": '𝔭', "Phi": 'Φ', "phi": 'φ', "phiv": 'ϕ', "phmmat": 'ℳ', "phone": '☎', "Pi": 'Π', "pi": 'π', "pitchfork": '⋔', "piv": 'ϖ', "planck": 'ℏ', "planckh": 'ℎ', "plankv": 'ℏ', "plusacir": '⨣', "plusb": '⊞', "pluscir": '⨢', "plus": "+", "plusdo": '∔', "plusdu": '⨥', "pluse": '⩲', "PlusMinus": '±', "plusmn": '±', "plussim": '⨦', "plustwo": '⨧', "pm": '±', "Poincareplane": 'ℌ', "pointint": '⨕', "popf": '𝕡', "Popf": 'ℙ', "pound": '£', "prap": '⪷', "Pr": '⪻', "pr": '≺', "prcue": '≼', "precapprox": '⪷', "prec": '≺', "preccurlyeq": '≼', "Precedes": '≺', "PrecedesEqual": '⪯', "PrecedesSlantEqual": '≼', "PrecedesTilde": '≾', "preceq": '⪯', "precnapprox": '⪹', "precneqq": '⪵', "precnsim": '⋨', "pre": '⪯', "prE": '⪳', "precsim": '≾', "prime": '′', "Prime": '″', "primes": 'ℙ', "prnap": '⪹', "prnE": '⪵', "prnsim": '⋨', "prod": '∏', "Product": '∏', "profalar": '⌮', "profline": '⌒', "profsurf": '⌓', "prop": '∝', "Proportional": '∝', "Proportion": '∷', "propto": '∝', "prsim": '≾', "prurel": '⊰', "Pscr": '𝒫', "pscr": '𝓅', "Psi": 'Ψ', "psi": 'ψ', "puncsp": ' ', "Qfr": '𝔔', "qfr": '𝔮', "qint": '⨌', "qopf": '𝕢', "Qopf": 'ℚ', "qprime": '⁗', "Qscr": '𝒬', "qscr": '𝓆', "quaternions": 'ℍ', "quatint": '⨖', "quest": "?", "questeq": '≟', "quot": "\"", "QUOT": "\"", "rAarr": '⇛', "race": '∽̱', "Racute": 'Ŕ', "racute": 'ŕ', "radic": '√', "raemptyv": '⦳', "rang": '⟩', "Rang": '⟫', "rangd": '⦒', "range": '⦥', "rangle": '⟩', "raquo": '»', "rarrap": '⥵', "rarrb": '⇥', "rarrbfs": '⤠', "rarrc": '⤳', "rarr": '→', "Rarr": '↠', "rArr": '⇒', "rarrfs": '⤞', "rarrhk": '↪', "rarrlp": '↬', "rarrpl": '⥅', "rarrsim": '⥴', "Rarrtl": '⤖', "rarrtl": '↣', "rarrw": '↝', "ratail": '⤚', "rAtail": '⤜', "ratio": '∶', "rationals": 'ℚ', "rbarr": '⤍', "rBarr": '⤏', "RBarr": '⤐', "rbbrk": '❳', "rbrace": "}", "rbrack": "]", "rbrke": '⦌', "rbrksld": '⦎', "rbrkslu": '⦐', "Rcaron": 'Ř', "rcaron": 'ř', "Rcedil": 'Ŗ', "rcedil": 'ŗ', "rceil": '⌉', "rcub": "}", "Rcy": 'Р', "rcy": 'р', "rdca": '⤷', "rdldhar": '⥩', "rdquo": '”', "rdquor": '”', "rdsh": '↳', "real": 'ℜ', "realine": 'ℛ', "realpart": 'ℜ', "reals": 'ℝ', "Re": 'ℜ', "rect": '▭', "reg": '®', "REG": '®', "ReverseElement": '∋', "ReverseEquilibrium": '⇋', "ReverseUpEquilibrium": '⥯', "rfisht": '⥽', "rfloor": '⌋', "rfr": '𝔯', "Rfr": 'ℜ', "rHar": '⥤', "rhard": '⇁', "rharu": '⇀', "rharul": '⥬', "Rho": 'Ρ', "rho": 'ρ', "rhov": 'ϱ', "RightAngleBracket": '⟩', "RightArrowBar": '⇥', "rightarrow": '→', "RightArrow": '→', "Rightarrow": '⇒', "RightArrowLeftArrow": '⇄', "rightarrowtail": '↣', "RightCeiling": '⌉', "RightDoubleBracket": '⟧', "RightDownTeeVector": '⥝', "RightDownVectorBar": '⥕', "RightDownVector": '⇂', "RightFloor": '⌋', "rightharpoondown": '⇁', "rightharpoonup": '⇀', "rightleftarrows": '⇄', "rightleftharpoons": '⇌', "rightrightarrows": '⇉', "rightsquigarrow": '↝', "RightTeeArrow": '↦', "RightTee": '⊢', "RightTeeVector": '⥛', "rightthreetimes": '⋌', "RightTriangleBar": '⧐', "RightTriangle": '⊳', "RightTriangleEqual": '⊵', "RightUpDownVector": '⥏', "RightUpTeeVector": '⥜', "RightUpVectorBar": '⥔', "RightUpVector": '↾', "RightVectorBar": '⥓', "RightVector": '⇀', "ring": '˚', "risingdotseq": '≓', "rlarr": '⇄', "rlhar": '⇌', "rlm": '‏', "rmoustache": '⎱', "rmoust": '⎱', "rnmid": '⫮', "roang": '⟭', "roarr": '⇾', "robrk": '⟧', "ropar": '⦆', "ropf": '𝕣', "Ropf": 'ℝ', "roplus": '⨮', "rotimes": '⨵', "RoundImplies": '⥰', "rpar": ")", "rpargt": '⦔', "rppolint": '⨒', "rrarr": '⇉', "Rrightarrow": '⇛', "rsaquo": '›', "rscr": '𝓇', "Rscr": 'ℛ', "rsh": '↱', "Rsh": '↱', "rsqb": "]", "rsquo": '’', "rsquor": '’', "rthree": '⋌', "rtimes": '⋊', "rtri": '▹', "rtrie": '⊵', "rtrif": '▸', "rtriltri": '⧎', "RuleDelayed": '⧴', "ruluhar": '⥨', "rx": '℞', "Sacute": 'Ś', "sacute": 'ś', "sbquo": '‚', "scap": '⪸', "Scaron": 'Š', "scaron": 'š', "Sc": '⪼', "sc": '≻', "sccue": '≽', "sce": '⪰', "scE": '⪴', "Scedil": 'Ş', "scedil": 'ş', "Scirc": 'Ŝ', "scirc": 'ŝ', "scnap": '⪺', "scnE": '⪶', "scnsim": '⋩', "scpolint": '⨓', "scsim": '≿', "Scy": 'С', "scy": 'с', "sdotb": '⊡', "sdot": '⋅', "sdote": '⩦', "searhk": '⤥', "searr": '↘', "seArr": '⇘', "searrow": '↘', "sect": '§', "semi": ";", "seswar": '⤩', "setminus": '∖', "setmn": '∖', "sext": '✶', "Sfr": '𝔖', "sfr": '𝔰', "sfrown": '⌢', "sharp": '♯', "SHCHcy": 'Щ', "shchcy": 'щ', "SHcy": 'Ш', "shcy": 'ш', "ShortDownArrow": '↓', "ShortLeftArrow": '←', "shortmid": '∣', "shortparallel": '∥', "ShortRightArrow": '→', "ShortUpArrow": '↑', "shy": '­', "Sigma": 'Σ', "sigma": 'σ', "sigmaf": 'ς', "sigmav": 'ς', "sim": '∼', "simdot": '⩪', "sime": '≃', "simeq": '≃', "simg": '⪞', "simgE": '⪠', "siml": '⪝', "simlE": '⪟', "simne": '≆', "simplus": '⨤', "simrarr": '⥲', "slarr": '←', "SmallCircle": '∘', "smallsetminus": '∖', "smashp": '⨳', "smeparsl": '⧤', "smid": '∣', "smile": '⌣', "smt": '⪪', "smte": '⪬', "smtes": '⪬︀', "SOFTcy": 'Ь', "softcy": 'ь', "solbar": '⌿', "solb": '⧄', "sol": "/", "Sopf": '𝕊', "sopf": '𝕤', "spades": '♠', "spadesuit": '♠', "spar": '∥', "sqcap": '⊓', "sqcaps": '⊓︀', "sqcup": '⊔', "sqcups": '⊔︀', "Sqrt": '√', "sqsub": '⊏', "sqsube": '⊑', "sqsubset": '⊏', "sqsubseteq": '⊑', "sqsup": '⊐', "sqsupe": '⊒', "sqsupset": '⊐', "sqsupseteq": '⊒', "square": '□', "Square": '□', "SquareIntersection": '⊓', "SquareSubset": '⊏', "SquareSubsetEqual": '⊑', "SquareSuperset": '⊐', "SquareSupersetEqual": '⊒', "SquareUnion": '⊔', "squarf": '▪', "squ": '□', "squf": '▪', "srarr": '→', "Sscr": '𝒮', "sscr": '𝓈', "ssetmn": '∖', "ssmile": '⌣', "sstarf": '⋆', "Star": '⋆', "star": '☆', "starf": '★', "straightepsilon": 'ϵ', "straightphi": 'ϕ', "strns": '¯', "sub": '⊂', "Sub": '⋐', "subdot": '⪽', "subE": '⫅', "sube": '⊆', "subedot": '⫃', "submult": '⫁', "subnE": '⫋', "subne": '⊊', "subplus": '⪿', "subrarr": '⥹', "subset": '⊂', "Subset": '⋐', "subseteq": '⊆', "subseteqq": '⫅', "SubsetEqual": '⊆', "subsetneq": '⊊', "subsetneqq": '⫋', "subsim": '⫇', "subsub": '⫕', "subsup": '⫓', "succapprox": '⪸', "succ": '≻', "succcurlyeq": '≽', "Succeeds": '≻', "SucceedsEqual": '⪰', "SucceedsSlantEqual": '≽', "SucceedsTilde": '≿', "succeq": '⪰', "succnapprox": '⪺', "succneqq": '⪶', "succnsim": '⋩', "succsim": '≿', "SuchThat": '∋', "sum": '∑', "Sum": '∑', "sung": '♪', "sup1": '¹', "sup2": '²', "sup3": '³', "sup": '⊃', "Sup": '⋑', "supdot": '⪾', "supdsub": '⫘', "supE": '⫆', "supe": '⊇', "supedot": '⫄', "Superset": '⊃', "SupersetEqual": '⊇', "suphsol": '⟉', "suphsub": '⫗', "suplarr": '⥻', "supmult": '⫂', "supnE": '⫌', "supne": '⊋', "supplus": '⫀', "supset": '⊃', "Supset": '⋑', "supseteq": '⊇', "supseteqq": '⫆', "supsetneq": '⊋', "supsetneqq": '⫌', "supsim": '⫈', "supsub": '⫔', "supsup": '⫖', "swarhk": '⤦', "swarr": '↙', "swArr": '⇙', "swarrow": '↙', "swnwar": '⤪', "szlig": 'ß', "Tab": "\t", "target": '⌖', "Tau": 'Τ', "tau": 'τ', "tbrk": '⎴', "Tcaron": 'Ť', "tcaron": 'ť', "Tcedil": 'Ţ', "tcedil": 'ţ', "Tcy": 'Т', "tcy": 'т', "tdot": '⃛', "telrec": '⌕', "Tfr": '𝔗', "tfr": '𝔱', "there4": '∴', "therefore": '∴', "Therefore": '∴', "Theta": 'Θ', "theta": 'θ', "thetasym": 'ϑ', "thetav": 'ϑ', "thickapprox": '≈', "thicksim": '∼', "ThickSpace": '  ', "ThinSpace": ' ', "thinsp": ' ', "thkap": '≈', "thksim": '∼', "THORN": 'Þ', "thorn": 'þ', "tilde": '˜', "Tilde": '∼', "TildeEqual": '≃', "TildeFullEqual": '≅', "TildeTilde": '≈', "timesbar": '⨱', "timesb": '⊠', "times": '×', "timesd": '⨰', "tint": '∭', "toea": '⤨', "topbot": '⌶', "topcir": '⫱', "top": '⊤', "Topf": '𝕋', "topf": '𝕥', "topfork": '⫚', "tosa": '⤩', "tprime": '‴', "trade": '™', "TRADE": '™', "triangle": '▵', "triangledown": '▿', "triangleleft": '◃', "trianglelefteq": '⊴', "triangleq": '≜', "triangleright": '▹', "trianglerighteq": '⊵', "tridot": '◬', "trie": '≜', "triminus": '⨺', "TripleDot": '⃛', "triplus": '⨹', "trisb": '⧍', "tritime": '⨻', "trpezium": '⏢', "Tscr": '𝒯', "tscr": '𝓉', "TScy": 'Ц', "tscy": 'ц', "TSHcy": 'Ћ', "tshcy": 'ћ', "Tstrok": 'Ŧ', "tstrok": 'ŧ', "twixt": '≬', "twoheadleftarrow": '↞', "twoheadrightarrow": '↠', "Uacute": 'Ú', "uacute": 'ú', "uarr": '↑', "Uarr": '↟', "uArr": '⇑', "Uarrocir": '⥉', "Ubrcy": 'Ў', "ubrcy": 'ў', "Ubreve": 'Ŭ', "ubreve": 'ŭ', "Ucirc": 'Û', "ucirc": 'û', "Ucy": 'У', "ucy": 'у', "udarr": '⇅', "Udblac": 'Ű', "udblac": 'ű', "udhar": '⥮', "ufisht": '⥾', "Ufr": '𝔘', "ufr": '𝔲', "Ugrave": 'Ù', "ugrave": 'ù', "uHar": '⥣', "uharl": '↿', "uharr": '↾', "uhblk": '▀', "ulcorn": '⌜', "ulcorner": '⌜', "ulcrop": '⌏', "ultri": '◸', "Umacr": 'Ū', "umacr": 'ū', "uml": '¨', "UnderBar": "_", "UnderBrace": '⏟', "UnderBracket": '⎵', "UnderParenthesis": '⏝', "Union": '⋃', "UnionPlus": '⊎', "Uogon": 'Ų', "uogon": 'ų', "Uopf": '𝕌', "uopf": '𝕦', "UpArrowBar": '⤒', "uparrow": '↑', "UpArrow": '↑', "Uparrow": '⇑', "UpArrowDownArrow": '⇅', "updownarrow": '↕', "UpDownArrow": '↕', "Updownarrow": '⇕', "UpEquilibrium": '⥮', "upharpoonleft": '↿', "upharpoonright": '↾', "uplus": '⊎', "UpperLeftArrow": '↖', "UpperRightArrow": '↗', "upsi": 'υ', "Upsi": 'ϒ', "upsih": 'ϒ', "Upsilon": 'Υ', "upsilon": 'υ', "UpTeeArrow": '↥', "UpTee": '⊥', "upuparrows": '⇈', "urcorn": '⌝', "urcorner": '⌝', "urcrop": '⌎', "Uring": 'Ů', "uring": 'ů', "urtri": '◹', "Uscr": '𝒰', "uscr": '𝓊', "utdot": '⋰', "Utilde": 'Ũ', "utilde": 'ũ', "utri": '▵', "utrif": '▴', "uuarr": '⇈', "Uuml": 'Ü', "uuml": 'ü', "uwangle": '⦧', "vangrt": '⦜', "varepsilon": 'ϵ', "varkappa": 'ϰ', "varnothing": '∅', "varphi": 'ϕ', "varpi": 'ϖ', "varpropto": '∝', "varr": '↕', "vArr": '⇕', "varrho": 'ϱ', "varsigma": 'ς', "varsubsetneq": '⊊︀', "varsubsetneqq": '⫋︀', "varsupsetneq": '⊋︀', "varsupsetneqq": '⫌︀', "vartheta": 'ϑ', "vartriangleleft": '⊲', "vartriangleright": '⊳', "vBar": '⫨', "Vbar": '⫫', "vBarv": '⫩', "Vcy": 'В', "vcy": 'в', "vdash": '⊢', "vDash": '⊨', "Vdash": '⊩', "VDash": '⊫', "Vdashl": '⫦', "veebar": '⊻', "vee": '∨', "Vee": '⋁', "veeeq": '≚', "vellip": '⋮', "verbar": "|", "Verbar": '‖', "vert": "|", "Vert": '‖', "VerticalBar": '∣', "VerticalLine": "|", "VerticalSeparator": '❘', "VerticalTilde": '≀', "VeryThinSpace": ' ', "Vfr": '𝔙', "vfr": '𝔳', "vltri": '⊲', "vnsub": '⊂⃒', "vnsup": '⊃⃒', "Vopf": '𝕍', "vopf": '𝕧', "vprop": '∝', "vrtri": '⊳', "Vscr": '𝒱', "vscr": '𝓋', "vsubnE": '⫋︀', "vsubne": '⊊︀', "vsupnE": '⫌︀', "vsupne": '⊋︀', "Vvdash": '⊪', "vzigzag": '⦚', "Wcirc": 'Ŵ', "wcirc": 'ŵ', "wedbar": '⩟', "wedge": '∧', "Wedge": '⋀', "wedgeq": '≙', "weierp": '℘', "Wfr": '𝔚', "wfr": '𝔴', "Wopf": '𝕎', "wopf": '𝕨', "wp": '℘', "wr": '≀', "wreath": '≀', "Wscr": '𝒲', "wscr": '𝓌', "xcap": '⋂', "xcirc": '◯', "xcup": '⋃', "xdtri": '▽', "Xfr": '𝔛', "xfr": '𝔵', "xharr": '⟷', "xhArr": '⟺', "Xi": 'Ξ', "xi": 'ξ', "xlarr": '⟵', "xlArr": '⟸', "xmap": '⟼', "xnis": '⋻', "xodot": '⨀', "Xopf": '𝕏', "xopf": '𝕩', "xoplus": '⨁', "xotime": '⨂', "xrarr": '⟶', "xrArr": '⟹', "Xscr": '𝒳', "xscr": '𝓍', "xsqcup": '⨆', "xuplus": '⨄', "xutri": '△', "xvee": '⋁', "xwedge": '⋀', "Yacute": 'Ý', "yacute": 'ý', "YAcy": 'Я', "yacy": 'я', "Ycirc": 'Ŷ', "ycirc": 'ŷ', "Ycy": 'Ы', "ycy": 'ы', "yen": '¥', "Yfr": '𝔜', "yfr": '𝔶', "YIcy": 'Ї', "yicy": 'ї', "Yopf": '𝕐', "yopf": '𝕪', "Yscr": '𝒴', "yscr": '𝓎', "YUcy": 'Ю', "yucy": 'ю', "yuml": 'ÿ', "Yuml": 'Ÿ', "Zacute": 'Ź', "zacute": 'ź', "Zcaron": 'Ž', "zcaron": 'ž', "Zcy": 'З', "zcy": 'з', "Zdot": 'Ż', "zdot": 'ż', "zeetrf": 'ℨ', "ZeroWidthSpace": '​', "Zeta": 'Ζ', "zeta": 'ζ', "zfr": '𝔷', "Zfr": 'ℨ', "ZHcy": 'Ж', "zhcy": 'ж', "zigrarr": '⇝', "zopf": '𝕫', "Zopf": 'ℤ', "Zscr": '𝒵', "zscr": '𝓏', "zwj": '‍', "zwnj": '‌' };
    }, {}], 20: [function (require, module, exports) {
      module.exports = { "Aacute": 'Á', "aacute": 'á', "Acirc": 'Â', "acirc": 'â', "acute": '´', "AElig": 'Æ', "aelig": 'æ', "Agrave": 'À', "agrave": 'à', "amp": "&", "AMP": "&", "Aring": 'Å', "aring": 'å', "Atilde": 'Ã', "atilde": 'ã', "Auml": 'Ä', "auml": 'ä', "brvbar": '¦', "Ccedil": 'Ç', "ccedil": 'ç', "cedil": '¸', "cent": '¢', "copy": '©', "COPY": '©', "curren": '¤', "deg": '°', "divide": '÷', "Eacute": 'É', "eacute": 'é', "Ecirc": 'Ê', "ecirc": 'ê', "Egrave": 'È', "egrave": 'è', "ETH": 'Ð', "eth": 'ð', "Euml": 'Ë', "euml": 'ë', "frac12": '½', "frac14": '¼', "frac34": '¾', "gt": ">", "GT": ">", "Iacute": 'Í', "iacute": 'í', "Icirc": 'Î', "icirc": 'î', "iexcl": '¡', "Igrave": 'Ì', "igrave": 'ì', "iquest": '¿', "Iuml": 'Ï', "iuml": 'ï', "laquo": '«', "lt": "<", "LT": "<", "macr": '¯', "micro": 'µ', "middot": '·', "nbsp": ' ', "not": '¬', "Ntilde": 'Ñ', "ntilde": 'ñ', "Oacute": 'Ó', "oacute": 'ó', "Ocirc": 'Ô', "ocirc": 'ô', "Ograve": 'Ò', "ograve": 'ò', "ordf": 'ª', "ordm": 'º', "Oslash": 'Ø', "oslash": 'ø', "Otilde": 'Õ', "otilde": 'õ', "Ouml": 'Ö', "ouml": 'ö', "para": '¶', "plusmn": '±', "pound": '£', "quot": "\"", "QUOT": "\"", "raquo": '»', "reg": '®', "REG": '®', "sect": '§', "shy": '­', "sup1": '¹', "sup2": '²', "sup3": '³', "szlig": 'ß', "THORN": 'Þ', "thorn": 'þ', "times": '×', "Uacute": 'Ú', "uacute": 'ú', "Ucirc": 'Û', "ucirc": 'û', "Ugrave": 'Ù', "ugrave": 'ù', "uml": '¨', "Uuml": 'Ü', "uuml": 'ü', "Yacute": 'Ý', "yacute": 'ý', "yen": '¥', "yuml": 'ÿ' };
    }, {}], 21: [function (require, module, exports) {
      module.exports = { "amp": "&", "apos": "'", "gt": ">", "lt": "<", "quot": "\"" };
    }, {}], 22: [function (require, module, exports) {
      module.exports = CollectingHandler;

      function CollectingHandler(cbs) {
        this._cbs = cbs || {};
        this.events = [];
      }

      var EVENTS = require("./").EVENTS;
      Object.keys(EVENTS).forEach(function (name) {
        if (EVENTS[name] === 0) {
          name = "on" + name;
          CollectingHandler.prototype[name] = function () {
            this.events.push([name]);
            if (this._cbs[name]) this._cbs[name]();
          };
        } else if (EVENTS[name] === 1) {
          name = "on" + name;
          CollectingHandler.prototype[name] = function (a) {
            this.events.push([name, a]);
            if (this._cbs[name]) this._cbs[name](a);
          };
        } else if (EVENTS[name] === 2) {
          name = "on" + name;
          CollectingHandler.prototype[name] = function (a, b) {
            this.events.push([name, a, b]);
            if (this._cbs[name]) this._cbs[name](a, b);
          };
        } else {
          throw Error("wrong number of arguments");
        }
      });

      CollectingHandler.prototype.onreset = function () {
        this.events = [];
        if (this._cbs.onreset) this._cbs.onreset();
      };

      CollectingHandler.prototype.restart = function () {
        if (this._cbs.onreset) this._cbs.onreset();

        for (var i = 0, len = this.events.length; i < len; i++) {
          if (this._cbs[this.events[i][0]]) {

            var num = this.events[i].length;

            if (num === 1) {
              this._cbs[this.events[i][0]]();
            } else if (num === 2) {
              this._cbs[this.events[i][0]](this.events[i][1]);
            } else {
              this._cbs[this.events[i][0]](this.events[i][1], this.events[i][2]);
            }
          }
        }
      };
    }, { "./": "htmlparser2" }], 23: [function (require, module, exports) {
      var index = require("./index.js"),
          DomHandler = index.DomHandler,
          DomUtils = index.DomUtils;

      //TODO: make this a streamable handler
      function FeedHandler(callback, options) {
        this.init(callback, options);
      }

      require("util").inherits(FeedHandler, DomHandler);

      FeedHandler.prototype.init = DomHandler;

      function getElements(what, where) {
        return DomUtils.getElementsByTagName(what, where, true);
      }
      function getOneElement(what, where) {
        return DomUtils.getElementsByTagName(what, where, true, 1)[0];
      }
      function fetch(what, where, recurse) {
        return DomUtils.getText(DomUtils.getElementsByTagName(what, where, recurse, 1)).trim();
      }

      function addConditionally(obj, prop, what, where, recurse) {
        var tmp = fetch(what, where, recurse);
        if (tmp) obj[prop] = tmp;
      }

      var isValidFeed = function isValidFeed(value) {
        return value === "rss" || value === "feed" || value === "rdf:RDF";
      };

      FeedHandler.prototype.onend = function () {
        var feed = {},
            feedRoot = getOneElement(isValidFeed, this.dom),
            tmp,
            childs;

        if (feedRoot) {
          if (feedRoot.name === "feed") {
            childs = feedRoot.children;

            feed.type = "atom";
            addConditionally(feed, "id", "id", childs);
            addConditionally(feed, "title", "title", childs);
            if ((tmp = getOneElement("link", childs)) && (tmp = tmp.attribs) && (tmp = tmp.href)) feed.link = tmp;
            addConditionally(feed, "description", "subtitle", childs);
            if (tmp = fetch("updated", childs)) feed.updated = new Date(tmp);
            addConditionally(feed, "author", "email", childs, true);

            feed.items = getElements("entry", childs).map(function (item) {
              var entry = {},
                  tmp;

              item = item.children;

              addConditionally(entry, "id", "id", item);
              addConditionally(entry, "title", "title", item);
              if ((tmp = getOneElement("link", item)) && (tmp = tmp.attribs) && (tmp = tmp.href)) entry.link = tmp;
              if (tmp = fetch("summary", item) || fetch("content", item)) entry.description = tmp;
              if (tmp = fetch("updated", item)) entry.pubDate = new Date(tmp);
              return entry;
            });
          } else {
            childs = getOneElement("channel", feedRoot.children).children;

            feed.type = feedRoot.name.substr(0, 3);
            feed.id = "";
            addConditionally(feed, "title", "title", childs);
            addConditionally(feed, "link", "link", childs);
            addConditionally(feed, "description", "description", childs);
            if (tmp = fetch("lastBuildDate", childs)) feed.updated = new Date(tmp);
            addConditionally(feed, "author", "managingEditor", childs, true);

            feed.items = getElements("item", feedRoot.children).map(function (item) {
              var entry = {},
                  tmp;

              item = item.children;

              addConditionally(entry, "id", "guid", item);
              addConditionally(entry, "title", "title", item);
              addConditionally(entry, "link", "link", item);
              addConditionally(entry, "description", "description", item);
              if (tmp = fetch("pubDate", item)) entry.pubDate = new Date(tmp);
              return entry;
            });
          }
        }
        this.dom = feed;
        DomHandler.prototype._handleCallback.call(this, feedRoot ? null : Error("couldn't find root of feed"));
      };

      module.exports = FeedHandler;
    }, { "./index.js": "htmlparser2", "util": 55 }], 24: [function (require, module, exports) {
      var Tokenizer = require("./Tokenizer.js");

      /*
      	Options:
      
      	xmlMode: Disables the special behavior for script/style tags (false by default)
      	lowerCaseAttributeNames: call .toLowerCase for each attribute name (true if xmlMode is `false`)
      	lowerCaseTags: call .toLowerCase for each tag name (true if xmlMode is `false`)
      */

      /*
      	Callbacks:
      
      	oncdataend,
      	oncdatastart,
      	onclosetag,
      	oncomment,
      	oncommentend,
      	onerror,
      	onopentag,
      	onprocessinginstruction,
      	onreset,
      	ontext
      */

      var formTags = {
        input: true,
        option: true,
        optgroup: true,
        select: true,
        button: true,
        datalist: true,
        textarea: true
      };

      var openImpliesClose = {
        tr: { tr: true, th: true, td: true },
        th: { th: true },
        td: { thead: true, th: true, td: true },
        body: { head: true, link: true, script: true },
        li: { li: true },
        p: { p: true },
        h1: { p: true },
        h2: { p: true },
        h3: { p: true },
        h4: { p: true },
        h5: { p: true },
        h6: { p: true },
        select: formTags,
        input: formTags,
        output: formTags,
        button: formTags,
        datalist: formTags,
        textarea: formTags,
        option: { option: true },
        optgroup: { optgroup: true }
      };

      var voidElements = {
        __proto__: null,
        area: true,
        base: true,
        basefont: true,
        br: true,
        col: true,
        command: true,
        embed: true,
        frame: true,
        hr: true,
        img: true,
        input: true,
        isindex: true,
        keygen: true,
        link: true,
        meta: true,
        param: true,
        source: true,
        track: true,
        wbr: true,

        //common self closing svg elements
        path: true,
        circle: true,
        ellipse: true,
        line: true,
        rect: true,
        use: true,
        stop: true,
        polyline: true,
        polygon: true
      };

      var re_nameEnd = /\s|\//;

      function Parser(cbs, options) {
        this._options = options || {};
        this._cbs = cbs || {};

        this._tagname = "";
        this._attribname = "";
        this._attribvalue = "";
        this._attribs = null;
        this._stack = [];

        this.startIndex = 0;
        this.endIndex = null;

        this._lowerCaseTagNames = "lowerCaseTags" in this._options ? !!this._options.lowerCaseTags : !this._options.xmlMode;
        this._lowerCaseAttributeNames = "lowerCaseAttributeNames" in this._options ? !!this._options.lowerCaseAttributeNames : !this._options.xmlMode;
        if (!!this._options.Tokenizer) {
          Tokenizer = this._options.Tokenizer;
        }
        this._tokenizer = new Tokenizer(this._options, this);

        if (this._cbs.onparserinit) this._cbs.onparserinit(this);
      }

      require("util").inherits(Parser, require("events").EventEmitter);

      Parser.prototype._updatePosition = function (initialOffset) {
        if (this.endIndex === null) {
          if (this._tokenizer._sectionStart <= initialOffset) {
            this.startIndex = 0;
          } else {
            this.startIndex = this._tokenizer._sectionStart - initialOffset;
          }
        } else this.startIndex = this.endIndex + 1;
        this.endIndex = this._tokenizer.getAbsoluteIndex();
      };

      //Tokenizer event handlers
      Parser.prototype.ontext = function (data) {
        this._updatePosition(1);
        this.endIndex--;

        if (this._cbs.ontext) this._cbs.ontext(data);
      };

      Parser.prototype.onopentagname = function (name) {
        if (this._lowerCaseTagNames) {
          name = name.toLowerCase();
        }

        this._tagname = name;

        if (!this._options.xmlMode && name in openImpliesClose) {
          for (var el; (el = this._stack[this._stack.length - 1]) in openImpliesClose[name]; this.onclosetag(el)) {}
        }

        if (this._options.xmlMode || !(name in voidElements)) {
          this._stack.push(name);
        }

        if (this._cbs.onopentagname) this._cbs.onopentagname(name);
        if (this._cbs.onopentag) this._attribs = {};
      };

      Parser.prototype.onopentagend = function () {
        this._updatePosition(1);

        if (this._attribs) {
          if (this._cbs.onopentag) this._cbs.onopentag(this._tagname, this._attribs);
          this._attribs = null;
        }

        if (!this._options.xmlMode && this._cbs.onclosetag && this._tagname in voidElements) {
          this._cbs.onclosetag(this._tagname);
        }

        this._tagname = "";
      };

      Parser.prototype.onclosetag = function (name) {
        this._updatePosition(1);

        if (this._lowerCaseTagNames) {
          name = name.toLowerCase();
        }

        if (this._stack.length && (!(name in voidElements) || this._options.xmlMode)) {
          var pos = this._stack.lastIndexOf(name);
          if (pos !== -1) {
            if (this._cbs.onclosetag) {
              pos = this._stack.length - pos;
              while (pos--) {
                this._cbs.onclosetag(this._stack.pop());
              }
            } else this._stack.length = pos;
          } else if (name === "p" && !this._options.xmlMode) {
            this.onopentagname(name);
            this._closeCurrentTag();
          }
        } else if (!this._options.xmlMode && (name === "br" || name === "p")) {
          this.onopentagname(name);
          this._closeCurrentTag();
        }
      };

      Parser.prototype.onselfclosingtag = function () {
        if (this._options.xmlMode || this._options.recognizeSelfClosing) {
          this._closeCurrentTag();
        } else {
          this.onopentagend();
        }
      };

      Parser.prototype._closeCurrentTag = function () {
        var name = this._tagname;

        this.onopentagend();

        //self-closing tags will be on the top of the stack
        //(cheaper check than in onclosetag)
        if (this._stack[this._stack.length - 1] === name) {
          if (this._cbs.onclosetag) {
            this._cbs.onclosetag(name);
          }
          this._stack.pop();
        }
      };

      Parser.prototype.onattribname = function (name) {
        if (this._lowerCaseAttributeNames) {
          name = name.toLowerCase();
        }
        this._attribname = name;
      };

      Parser.prototype.onattribdata = function (value) {
        this._attribvalue += value;
      };

      Parser.prototype.onattribend = function () {
        if (this._cbs.onattribute) this._cbs.onattribute(this._attribname, this._attribvalue);
        if (this._attribs && !Object.prototype.hasOwnProperty.call(this._attribs, this._attribname)) {
          this._attribs[this._attribname] = this._attribvalue;
        }
        this._attribname = "";
        this._attribvalue = "";
      };

      Parser.prototype._getInstructionName = function (value) {
        var idx = value.search(re_nameEnd),
            name = idx < 0 ? value : value.substr(0, idx);

        if (this._lowerCaseTagNames) {
          name = name.toLowerCase();
        }

        return name;
      };

      Parser.prototype.ondeclaration = function (value) {
        if (this._cbs.onprocessinginstruction) {
          var name = this._getInstructionName(value);
          this._cbs.onprocessinginstruction("!" + name, "!" + value);
        }
      };

      Parser.prototype.onprocessinginstruction = function (value) {
        if (this._cbs.onprocessinginstruction) {
          var name = this._getInstructionName(value);
          this._cbs.onprocessinginstruction("?" + name, "?" + value);
        }
      };

      Parser.prototype.oncomment = function (value) {
        this._updatePosition(4);

        if (this._cbs.oncomment) this._cbs.oncomment(value);
        if (this._cbs.oncommentend) this._cbs.oncommentend();
      };

      Parser.prototype.oncdata = function (value) {
        this._updatePosition(1);

        if (this._options.xmlMode || this._options.recognizeCDATA) {
          if (this._cbs.oncdatastart) this._cbs.oncdatastart();
          if (this._cbs.ontext) this._cbs.ontext(value);
          if (this._cbs.oncdataend) this._cbs.oncdataend();
        } else {
          this.oncomment("[CDATA[" + value + "]]");
        }
      };

      Parser.prototype.onerror = function (err) {
        if (this._cbs.onerror) this._cbs.onerror(err);
      };

      Parser.prototype.onend = function () {
        if (this._cbs.onclosetag) {
          for (var i = this._stack.length; i > 0; this._cbs.onclosetag(this._stack[--i])) {}
        }
        if (this._cbs.onend) this._cbs.onend();
      };

      //Resets the parser to a blank state, ready to parse a new HTML document
      Parser.prototype.reset = function () {
        if (this._cbs.onreset) this._cbs.onreset();
        this._tokenizer.reset();

        this._tagname = "";
        this._attribname = "";
        this._attribs = null;
        this._stack = [];

        if (this._cbs.onparserinit) this._cbs.onparserinit(this);
      };

      //Parses a complete HTML document and pushes it to the handler
      Parser.prototype.parseComplete = function (data) {
        this.reset();
        this.end(data);
      };

      Parser.prototype.write = function (chunk) {
        this._tokenizer.write(chunk);
      };

      Parser.prototype.end = function (chunk) {
        this._tokenizer.end(chunk);
      };

      Parser.prototype.pause = function () {
        this._tokenizer.pause();
      };

      Parser.prototype.resume = function () {
        this._tokenizer.resume();
      };

      //alias for backwards compat
      Parser.prototype.parseChunk = Parser.prototype.write;
      Parser.prototype.done = Parser.prototype.end;

      module.exports = Parser;
    }, { "./Tokenizer.js": 27, "events": 34, "util": 55 }], 25: [function (require, module, exports) {
      module.exports = ProxyHandler;

      function ProxyHandler(cbs) {
        this._cbs = cbs || {};
      }

      var EVENTS = require("./").EVENTS;
      Object.keys(EVENTS).forEach(function (name) {
        if (EVENTS[name] === 0) {
          name = "on" + name;
          ProxyHandler.prototype[name] = function () {
            if (this._cbs[name]) this._cbs[name]();
          };
        } else if (EVENTS[name] === 1) {
          name = "on" + name;
          ProxyHandler.prototype[name] = function (a) {
            if (this._cbs[name]) this._cbs[name](a);
          };
        } else if (EVENTS[name] === 2) {
          name = "on" + name;
          ProxyHandler.prototype[name] = function (a, b) {
            if (this._cbs[name]) this._cbs[name](a, b);
          };
        } else {
          throw Error("wrong number of arguments");
        }
      });
    }, { "./": "htmlparser2" }], 26: [function (require, module, exports) {
      module.exports = Stream;

      var Parser = require("./WritableStream.js");

      function Stream(options) {
        Parser.call(this, new Cbs(this), options);
      }

      require("util").inherits(Stream, Parser);

      Stream.prototype.readable = true;

      function Cbs(scope) {
        this.scope = scope;
      }

      var EVENTS = require("../").EVENTS;

      Object.keys(EVENTS).forEach(function (name) {
        if (EVENTS[name] === 0) {
          Cbs.prototype["on" + name] = function () {
            this.scope.emit(name);
          };
        } else if (EVENTS[name] === 1) {
          Cbs.prototype["on" + name] = function (a) {
            this.scope.emit(name, a);
          };
        } else if (EVENTS[name] === 2) {
          Cbs.prototype["on" + name] = function (a, b) {
            this.scope.emit(name, a, b);
          };
        } else {
          throw Error("wrong number of arguments!");
        }
      });
    }, { "../": "htmlparser2", "./WritableStream.js": 28, "util": 55 }], 27: [function (require, module, exports) {
      module.exports = Tokenizer;

      var decodeCodePoint = require("entities/lib/decode_codepoint.js"),
          entityMap = require("entities/maps/entities.json"),
          legacyMap = require("entities/maps/legacy.json"),
          xmlMap = require("entities/maps/xml.json"),
          i = 0,
          TEXT = i++,
          BEFORE_TAG_NAME = i++,
          //after <
      IN_TAG_NAME = i++,
          IN_SELF_CLOSING_TAG = i++,
          BEFORE_CLOSING_TAG_NAME = i++,
          IN_CLOSING_TAG_NAME = i++,
          AFTER_CLOSING_TAG_NAME = i++,

      //attributes
      BEFORE_ATTRIBUTE_NAME = i++,
          IN_ATTRIBUTE_NAME = i++,
          AFTER_ATTRIBUTE_NAME = i++,
          BEFORE_ATTRIBUTE_VALUE = i++,
          IN_ATTRIBUTE_VALUE_DQ = i++,
          // "
      IN_ATTRIBUTE_VALUE_SQ = i++,
          // '
      IN_ATTRIBUTE_VALUE_NQ = i++,

      //declarations
      BEFORE_DECLARATION = i++,
          // !
      IN_DECLARATION = i++,

      //processing instructions
      IN_PROCESSING_INSTRUCTION = i++,
          // ?

      //comments
      BEFORE_COMMENT = i++,
          IN_COMMENT = i++,
          AFTER_COMMENT_1 = i++,
          AFTER_COMMENT_2 = i++,

      //cdata
      BEFORE_CDATA_1 = i++,
          // [
      BEFORE_CDATA_2 = i++,
          // C
      BEFORE_CDATA_3 = i++,
          // D
      BEFORE_CDATA_4 = i++,
          // A
      BEFORE_CDATA_5 = i++,
          // T
      BEFORE_CDATA_6 = i++,
          // A
      IN_CDATA = i++,
          // [
      AFTER_CDATA_1 = i++,
          // ]
      AFTER_CDATA_2 = i++,
          // ]

      //special tags
      BEFORE_SPECIAL = i++,
          //S
      BEFORE_SPECIAL_END = i++,
          //S

      BEFORE_SCRIPT_1 = i++,
          //C
      BEFORE_SCRIPT_2 = i++,
          //R
      BEFORE_SCRIPT_3 = i++,
          //I
      BEFORE_SCRIPT_4 = i++,
          //P
      BEFORE_SCRIPT_5 = i++,
          //T
      AFTER_SCRIPT_1 = i++,
          //C
      AFTER_SCRIPT_2 = i++,
          //R
      AFTER_SCRIPT_3 = i++,
          //I
      AFTER_SCRIPT_4 = i++,
          //P
      AFTER_SCRIPT_5 = i++,
          //T

      BEFORE_STYLE_1 = i++,
          //T
      BEFORE_STYLE_2 = i++,
          //Y
      BEFORE_STYLE_3 = i++,
          //L
      BEFORE_STYLE_4 = i++,
          //E
      AFTER_STYLE_1 = i++,
          //T
      AFTER_STYLE_2 = i++,
          //Y
      AFTER_STYLE_3 = i++,
          //L
      AFTER_STYLE_4 = i++,
          //E

      BEFORE_ENTITY = i++,
          //&
      BEFORE_NUMERIC_ENTITY = i++,
          //#
      IN_NAMED_ENTITY = i++,
          IN_NUMERIC_ENTITY = i++,
          IN_HEX_ENTITY = i++,
          //X

      j = 0,
          SPECIAL_NONE = j++,
          SPECIAL_SCRIPT = j++,
          SPECIAL_STYLE = j++;

      function whitespace(c) {
        return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
      }

      function characterState(char, SUCCESS) {
        return function (c) {
          if (c === char) this._state = SUCCESS;
        };
      }

      function ifElseState(upper, SUCCESS, FAILURE) {
        var lower = upper.toLowerCase();

        if (upper === lower) {
          return function (c) {
            if (c === lower) {
              this._state = SUCCESS;
            } else {
              this._state = FAILURE;
              this._index--;
            }
          };
        } else {
          return function (c) {
            if (c === lower || c === upper) {
              this._state = SUCCESS;
            } else {
              this._state = FAILURE;
              this._index--;
            }
          };
        }
      }

      function consumeSpecialNameChar(upper, NEXT_STATE) {
        var lower = upper.toLowerCase();

        return function (c) {
          if (c === lower || c === upper) {
            this._state = NEXT_STATE;
          } else {
            this._state = IN_TAG_NAME;
            this._index--; //consume the token again
          }
        };
      }

      function Tokenizer(options, cbs) {
        this._state = TEXT;
        this._buffer = "";
        this._sectionStart = 0;
        this._index = 0;
        this._bufferOffset = 0; //chars removed from _buffer
        this._baseState = TEXT;
        this._special = SPECIAL_NONE;
        this._cbs = cbs;
        this._running = true;
        this._ended = false;
        this._xmlMode = !!(options && options.xmlMode);
        this._decodeEntities = !!(options && options.decodeEntities);
      }

      Tokenizer.prototype._stateText = function (c) {
        if (c === "<") {
          if (this._index > this._sectionStart) {
            this._cbs.ontext(this._getSection());
          }
          this._state = BEFORE_TAG_NAME;
          this._sectionStart = this._index;
        } else if (this._decodeEntities && this._special === SPECIAL_NONE && c === "&") {
          if (this._index > this._sectionStart) {
            this._cbs.ontext(this._getSection());
          }
          this._baseState = TEXT;
          this._state = BEFORE_ENTITY;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateBeforeTagName = function (c) {
        if (c === "/") {
          this._state = BEFORE_CLOSING_TAG_NAME;
        } else if (c === ">" || this._special !== SPECIAL_NONE || whitespace(c)) {
          this._state = TEXT;
        } else if (c === "!") {
          this._state = BEFORE_DECLARATION;
          this._sectionStart = this._index + 1;
        } else if (c === "?") {
          this._state = IN_PROCESSING_INSTRUCTION;
          this._sectionStart = this._index + 1;
        } else if (c === "<") {
          this._cbs.ontext(this._getSection());
          this._sectionStart = this._index;
        } else {
          this._state = !this._xmlMode && (c === "s" || c === "S") ? BEFORE_SPECIAL : IN_TAG_NAME;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateInTagName = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
          this._emitToken("onopentagname");
          this._state = BEFORE_ATTRIBUTE_NAME;
          this._index--;
        }
      };

      Tokenizer.prototype._stateBeforeCloseingTagName = function (c) {
        if (whitespace(c)) ;else if (c === ">") {
          this._state = TEXT;
        } else if (this._special !== SPECIAL_NONE) {
          if (c === "s" || c === "S") {
            this._state = BEFORE_SPECIAL_END;
          } else {
            this._state = TEXT;
            this._index--;
          }
        } else {
          this._state = IN_CLOSING_TAG_NAME;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateInCloseingTagName = function (c) {
        if (c === ">" || whitespace(c)) {
          this._emitToken("onclosetag");
          this._state = AFTER_CLOSING_TAG_NAME;
          this._index--;
        }
      };

      Tokenizer.prototype._stateAfterCloseingTagName = function (c) {
        //skip everything until ">"
        if (c === ">") {
          this._state = TEXT;
          this._sectionStart = this._index + 1;
        }
      };

      Tokenizer.prototype._stateBeforeAttributeName = function (c) {
        if (c === ">") {
          this._cbs.onopentagend();
          this._state = TEXT;
          this._sectionStart = this._index + 1;
        } else if (c === "/") {
          this._state = IN_SELF_CLOSING_TAG;
        } else if (!whitespace(c)) {
          this._state = IN_ATTRIBUTE_NAME;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateInSelfClosingTag = function (c) {
        if (c === ">") {
          this._cbs.onselfclosingtag();
          this._state = TEXT;
          this._sectionStart = this._index + 1;
        } else if (!whitespace(c)) {
          this._state = BEFORE_ATTRIBUTE_NAME;
          this._index--;
        }
      };

      Tokenizer.prototype._stateInAttributeName = function (c) {
        if (c === "=" || c === "/" || c === ">" || whitespace(c)) {
          this._cbs.onattribname(this._getSection());
          this._sectionStart = -1;
          this._state = AFTER_ATTRIBUTE_NAME;
          this._index--;
        }
      };

      Tokenizer.prototype._stateAfterAttributeName = function (c) {
        if (c === "=") {
          this._state = BEFORE_ATTRIBUTE_VALUE;
        } else if (c === "/" || c === ">") {
          this._cbs.onattribend();
          this._state = BEFORE_ATTRIBUTE_NAME;
          this._index--;
        } else if (!whitespace(c)) {
          this._cbs.onattribend();
          this._state = IN_ATTRIBUTE_NAME;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateBeforeAttributeValue = function (c) {
        if (c === "\"") {
          this._state = IN_ATTRIBUTE_VALUE_DQ;
          this._sectionStart = this._index + 1;
        } else if (c === "'") {
          this._state = IN_ATTRIBUTE_VALUE_SQ;
          this._sectionStart = this._index + 1;
        } else if (!whitespace(c)) {
          this._state = IN_ATTRIBUTE_VALUE_NQ;
          this._sectionStart = this._index;
          this._index--; //reconsume token
        }
      };

      Tokenizer.prototype._stateInAttributeValueDoubleQuotes = function (c) {
        if (c === "\"") {
          this._emitToken("onattribdata");
          this._cbs.onattribend();
          this._state = BEFORE_ATTRIBUTE_NAME;
        } else if (this._decodeEntities && c === "&") {
          this._emitToken("onattribdata");
          this._baseState = this._state;
          this._state = BEFORE_ENTITY;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateInAttributeValueSingleQuotes = function (c) {
        if (c === "'") {
          this._emitToken("onattribdata");
          this._cbs.onattribend();
          this._state = BEFORE_ATTRIBUTE_NAME;
        } else if (this._decodeEntities && c === "&") {
          this._emitToken("onattribdata");
          this._baseState = this._state;
          this._state = BEFORE_ENTITY;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateInAttributeValueNoQuotes = function (c) {
        if (whitespace(c) || c === ">") {
          this._emitToken("onattribdata");
          this._cbs.onattribend();
          this._state = BEFORE_ATTRIBUTE_NAME;
          this._index--;
        } else if (this._decodeEntities && c === "&") {
          this._emitToken("onattribdata");
          this._baseState = this._state;
          this._state = BEFORE_ENTITY;
          this._sectionStart = this._index;
        }
      };

      Tokenizer.prototype._stateBeforeDeclaration = function (c) {
        this._state = c === "[" ? BEFORE_CDATA_1 : c === "-" ? BEFORE_COMMENT : IN_DECLARATION;
      };

      Tokenizer.prototype._stateInDeclaration = function (c) {
        if (c === ">") {
          this._cbs.ondeclaration(this._getSection());
          this._state = TEXT;
          this._sectionStart = this._index + 1;
        }
      };

      Tokenizer.prototype._stateInProcessingInstruction = function (c) {
        if (c === ">") {
          this._cbs.onprocessinginstruction(this._getSection());
          this._state = TEXT;
          this._sectionStart = this._index + 1;
        }
      };

      Tokenizer.prototype._stateBeforeComment = function (c) {
        if (c === "-") {
          this._state = IN_COMMENT;
          this._sectionStart = this._index + 1;
        } else {
          this._state = IN_DECLARATION;
        }
      };

      Tokenizer.prototype._stateInComment = function (c) {
        if (c === "-") this._state = AFTER_COMMENT_1;
      };

      Tokenizer.prototype._stateAfterComment1 = function (c) {
        if (c === "-") {
          this._state = AFTER_COMMENT_2;
        } else {
          this._state = IN_COMMENT;
        }
      };

      Tokenizer.prototype._stateAfterComment2 = function (c) {
        if (c === ">") {
          //remove 2 trailing chars
          this._cbs.oncomment(this._buffer.substring(this._sectionStart, this._index - 2));
          this._state = TEXT;
          this._sectionStart = this._index + 1;
        } else if (c !== "-") {
          this._state = IN_COMMENT;
        }
        // else: stay in AFTER_COMMENT_2 (`--->`)
      };

      Tokenizer.prototype._stateBeforeCdata1 = ifElseState("C", BEFORE_CDATA_2, IN_DECLARATION);
      Tokenizer.prototype._stateBeforeCdata2 = ifElseState("D", BEFORE_CDATA_3, IN_DECLARATION);
      Tokenizer.prototype._stateBeforeCdata3 = ifElseState("A", BEFORE_CDATA_4, IN_DECLARATION);
      Tokenizer.prototype._stateBeforeCdata4 = ifElseState("T", BEFORE_CDATA_5, IN_DECLARATION);
      Tokenizer.prototype._stateBeforeCdata5 = ifElseState("A", BEFORE_CDATA_6, IN_DECLARATION);

      Tokenizer.prototype._stateBeforeCdata6 = function (c) {
        if (c === "[") {
          this._state = IN_CDATA;
          this._sectionStart = this._index + 1;
        } else {
          this._state = IN_DECLARATION;
          this._index--;
        }
      };

      Tokenizer.prototype._stateInCdata = function (c) {
        if (c === "]") this._state = AFTER_CDATA_1;
      };

      Tokenizer.prototype._stateAfterCdata1 = characterState("]", AFTER_CDATA_2);

      Tokenizer.prototype._stateAfterCdata2 = function (c) {
        if (c === ">") {
          //remove 2 trailing chars
          this._cbs.oncdata(this._buffer.substring(this._sectionStart, this._index - 2));
          this._state = TEXT;
          this._sectionStart = this._index + 1;
        } else if (c !== "]") {
          this._state = IN_CDATA;
        }
        //else: stay in AFTER_CDATA_2 (`]]]>`)
      };

      Tokenizer.prototype._stateBeforeSpecial = function (c) {
        if (c === "c" || c === "C") {
          this._state = BEFORE_SCRIPT_1;
        } else if (c === "t" || c === "T") {
          this._state = BEFORE_STYLE_1;
        } else {
          this._state = IN_TAG_NAME;
          this._index--; //consume the token again
        }
      };

      Tokenizer.prototype._stateBeforeSpecialEnd = function (c) {
        if (this._special === SPECIAL_SCRIPT && (c === "c" || c === "C")) {
          this._state = AFTER_SCRIPT_1;
        } else if (this._special === SPECIAL_STYLE && (c === "t" || c === "T")) {
          this._state = AFTER_STYLE_1;
        } else this._state = TEXT;
      };

      Tokenizer.prototype._stateBeforeScript1 = consumeSpecialNameChar("R", BEFORE_SCRIPT_2);
      Tokenizer.prototype._stateBeforeScript2 = consumeSpecialNameChar("I", BEFORE_SCRIPT_3);
      Tokenizer.prototype._stateBeforeScript3 = consumeSpecialNameChar("P", BEFORE_SCRIPT_4);
      Tokenizer.prototype._stateBeforeScript4 = consumeSpecialNameChar("T", BEFORE_SCRIPT_5);

      Tokenizer.prototype._stateBeforeScript5 = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
          this._special = SPECIAL_SCRIPT;
        }
        this._state = IN_TAG_NAME;
        this._index--; //consume the token again
      };

      Tokenizer.prototype._stateAfterScript1 = ifElseState("R", AFTER_SCRIPT_2, TEXT);
      Tokenizer.prototype._stateAfterScript2 = ifElseState("I", AFTER_SCRIPT_3, TEXT);
      Tokenizer.prototype._stateAfterScript3 = ifElseState("P", AFTER_SCRIPT_4, TEXT);
      Tokenizer.prototype._stateAfterScript4 = ifElseState("T", AFTER_SCRIPT_5, TEXT);

      Tokenizer.prototype._stateAfterScript5 = function (c) {
        if (c === ">" || whitespace(c)) {
          this._special = SPECIAL_NONE;
          this._state = IN_CLOSING_TAG_NAME;
          this._sectionStart = this._index - 6;
          this._index--; //reconsume the token
        } else this._state = TEXT;
      };

      Tokenizer.prototype._stateBeforeStyle1 = consumeSpecialNameChar("Y", BEFORE_STYLE_2);
      Tokenizer.prototype._stateBeforeStyle2 = consumeSpecialNameChar("L", BEFORE_STYLE_3);
      Tokenizer.prototype._stateBeforeStyle3 = consumeSpecialNameChar("E", BEFORE_STYLE_4);

      Tokenizer.prototype._stateBeforeStyle4 = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
          this._special = SPECIAL_STYLE;
        }
        this._state = IN_TAG_NAME;
        this._index--; //consume the token again
      };

      Tokenizer.prototype._stateAfterStyle1 = ifElseState("Y", AFTER_STYLE_2, TEXT);
      Tokenizer.prototype._stateAfterStyle2 = ifElseState("L", AFTER_STYLE_3, TEXT);
      Tokenizer.prototype._stateAfterStyle3 = ifElseState("E", AFTER_STYLE_4, TEXT);

      Tokenizer.prototype._stateAfterStyle4 = function (c) {
        if (c === ">" || whitespace(c)) {
          this._special = SPECIAL_NONE;
          this._state = IN_CLOSING_TAG_NAME;
          this._sectionStart = this._index - 5;
          this._index--; //reconsume the token
        } else this._state = TEXT;
      };

      Tokenizer.prototype._stateBeforeEntity = ifElseState("#", BEFORE_NUMERIC_ENTITY, IN_NAMED_ENTITY);
      Tokenizer.prototype._stateBeforeNumericEntity = ifElseState("X", IN_HEX_ENTITY, IN_NUMERIC_ENTITY);

      //for entities terminated with a semicolon
      Tokenizer.prototype._parseNamedEntityStrict = function () {
        //offset = 1
        if (this._sectionStart + 1 < this._index) {
          var entity = this._buffer.substring(this._sectionStart + 1, this._index),
              map = this._xmlMode ? xmlMap : entityMap;

          if (map.hasOwnProperty(entity)) {
            this._emitPartial(map[entity]);
            this._sectionStart = this._index + 1;
          }
        }
      };

      //parses legacy entities (without trailing semicolon)
      Tokenizer.prototype._parseLegacyEntity = function () {
        var start = this._sectionStart + 1,
            limit = this._index - start;

        if (limit > 6) limit = 6; //the max length of legacy entities is 6

        while (limit >= 2) {
          //the min length of legacy entities is 2
          var entity = this._buffer.substr(start, limit);

          if (legacyMap.hasOwnProperty(entity)) {
            this._emitPartial(legacyMap[entity]);
            this._sectionStart += limit + 1;
            return;
          } else {
            limit--;
          }
        }
      };

      Tokenizer.prototype._stateInNamedEntity = function (c) {
        if (c === ";") {
          this._parseNamedEntityStrict();
          if (this._sectionStart + 1 < this._index && !this._xmlMode) {
            this._parseLegacyEntity();
          }
          this._state = this._baseState;
        } else if ((c < "a" || c > "z") && (c < "A" || c > "Z") && (c < "0" || c > "9")) {
          if (this._xmlMode) ;else if (this._sectionStart + 1 === this._index) ;else if (this._baseState !== TEXT) {
            if (c !== "=") {
              this._parseNamedEntityStrict();
            }
          } else {
            this._parseLegacyEntity();
          }

          this._state = this._baseState;
          this._index--;
        }
      };

      Tokenizer.prototype._decodeNumericEntity = function (offset, base) {
        var sectionStart = this._sectionStart + offset;

        if (sectionStart !== this._index) {
          //parse entity
          var entity = this._buffer.substring(sectionStart, this._index);
          var parsed = parseInt(entity, base);

          this._emitPartial(decodeCodePoint(parsed));
          this._sectionStart = this._index;
        } else {
          this._sectionStart--;
        }

        this._state = this._baseState;
      };

      Tokenizer.prototype._stateInNumericEntity = function (c) {
        if (c === ";") {
          this._decodeNumericEntity(2, 10);
          this._sectionStart++;
        } else if (c < "0" || c > "9") {
          if (!this._xmlMode) {
            this._decodeNumericEntity(2, 10);
          } else {
            this._state = this._baseState;
          }
          this._index--;
        }
      };

      Tokenizer.prototype._stateInHexEntity = function (c) {
        if (c === ";") {
          this._decodeNumericEntity(3, 16);
          this._sectionStart++;
        } else if ((c < "a" || c > "f") && (c < "A" || c > "F") && (c < "0" || c > "9")) {
          if (!this._xmlMode) {
            this._decodeNumericEntity(3, 16);
          } else {
            this._state = this._baseState;
          }
          this._index--;
        }
      };

      Tokenizer.prototype._cleanup = function () {
        if (this._sectionStart < 0) {
          this._buffer = "";
          this._index = 0;
          this._bufferOffset += this._index;
        } else if (this._running) {
          if (this._state === TEXT) {
            if (this._sectionStart !== this._index) {
              this._cbs.ontext(this._buffer.substr(this._sectionStart));
            }
            this._buffer = "";
            this._index = 0;
            this._bufferOffset += this._index;
          } else if (this._sectionStart === this._index) {
            //the section just started
            this._buffer = "";
            this._index = 0;
            this._bufferOffset += this._index;
          } else {
            //remove everything unnecessary
            this._buffer = this._buffer.substr(this._sectionStart);
            this._index -= this._sectionStart;
            this._bufferOffset += this._sectionStart;
          }

          this._sectionStart = 0;
        }
      };

      //TODO make events conditional
      Tokenizer.prototype.write = function (chunk) {
        if (this._ended) this._cbs.onerror(Error(".write() after done!"));

        this._buffer += chunk;
        this._parse();
      };

      Tokenizer.prototype._parse = function () {
        while (this._index < this._buffer.length && this._running) {
          var c = this._buffer.charAt(this._index);
          if (this._state === TEXT) {
            this._stateText(c);
          } else if (this._state === BEFORE_TAG_NAME) {
            this._stateBeforeTagName(c);
          } else if (this._state === IN_TAG_NAME) {
            this._stateInTagName(c);
          } else if (this._state === BEFORE_CLOSING_TAG_NAME) {
            this._stateBeforeCloseingTagName(c);
          } else if (this._state === IN_CLOSING_TAG_NAME) {
            this._stateInCloseingTagName(c);
          } else if (this._state === AFTER_CLOSING_TAG_NAME) {
            this._stateAfterCloseingTagName(c);
          } else if (this._state === IN_SELF_CLOSING_TAG) {
            this._stateInSelfClosingTag(c);
          }

          /*
          *	attributes
          */
          else if (this._state === BEFORE_ATTRIBUTE_NAME) {
              this._stateBeforeAttributeName(c);
            } else if (this._state === IN_ATTRIBUTE_NAME) {
              this._stateInAttributeName(c);
            } else if (this._state === AFTER_ATTRIBUTE_NAME) {
              this._stateAfterAttributeName(c);
            } else if (this._state === BEFORE_ATTRIBUTE_VALUE) {
              this._stateBeforeAttributeValue(c);
            } else if (this._state === IN_ATTRIBUTE_VALUE_DQ) {
              this._stateInAttributeValueDoubleQuotes(c);
            } else if (this._state === IN_ATTRIBUTE_VALUE_SQ) {
              this._stateInAttributeValueSingleQuotes(c);
            } else if (this._state === IN_ATTRIBUTE_VALUE_NQ) {
              this._stateInAttributeValueNoQuotes(c);
            }

            /*
            *	declarations
            */
            else if (this._state === BEFORE_DECLARATION) {
                this._stateBeforeDeclaration(c);
              } else if (this._state === IN_DECLARATION) {
                this._stateInDeclaration(c);
              }

              /*
              *	processing instructions
              */
              else if (this._state === IN_PROCESSING_INSTRUCTION) {
                  this._stateInProcessingInstruction(c);
                }

                /*
                *	comments
                */
                else if (this._state === BEFORE_COMMENT) {
                    this._stateBeforeComment(c);
                  } else if (this._state === IN_COMMENT) {
                    this._stateInComment(c);
                  } else if (this._state === AFTER_COMMENT_1) {
                    this._stateAfterComment1(c);
                  } else if (this._state === AFTER_COMMENT_2) {
                    this._stateAfterComment2(c);
                  }

                  /*
                  *	cdata
                  */
                  else if (this._state === BEFORE_CDATA_1) {
                      this._stateBeforeCdata1(c);
                    } else if (this._state === BEFORE_CDATA_2) {
                      this._stateBeforeCdata2(c);
                    } else if (this._state === BEFORE_CDATA_3) {
                      this._stateBeforeCdata3(c);
                    } else if (this._state === BEFORE_CDATA_4) {
                      this._stateBeforeCdata4(c);
                    } else if (this._state === BEFORE_CDATA_5) {
                      this._stateBeforeCdata5(c);
                    } else if (this._state === BEFORE_CDATA_6) {
                      this._stateBeforeCdata6(c);
                    } else if (this._state === IN_CDATA) {
                      this._stateInCdata(c);
                    } else if (this._state === AFTER_CDATA_1) {
                      this._stateAfterCdata1(c);
                    } else if (this._state === AFTER_CDATA_2) {
                      this._stateAfterCdata2(c);
                    }

                    /*
                    * special tags
                    */
                    else if (this._state === BEFORE_SPECIAL) {
                        this._stateBeforeSpecial(c);
                      } else if (this._state === BEFORE_SPECIAL_END) {
                        this._stateBeforeSpecialEnd(c);
                      }

                      /*
                      * script
                      */
                      else if (this._state === BEFORE_SCRIPT_1) {
                          this._stateBeforeScript1(c);
                        } else if (this._state === BEFORE_SCRIPT_2) {
                          this._stateBeforeScript2(c);
                        } else if (this._state === BEFORE_SCRIPT_3) {
                          this._stateBeforeScript3(c);
                        } else if (this._state === BEFORE_SCRIPT_4) {
                          this._stateBeforeScript4(c);
                        } else if (this._state === BEFORE_SCRIPT_5) {
                          this._stateBeforeScript5(c);
                        } else if (this._state === AFTER_SCRIPT_1) {
                          this._stateAfterScript1(c);
                        } else if (this._state === AFTER_SCRIPT_2) {
                          this._stateAfterScript2(c);
                        } else if (this._state === AFTER_SCRIPT_3) {
                          this._stateAfterScript3(c);
                        } else if (this._state === AFTER_SCRIPT_4) {
                          this._stateAfterScript4(c);
                        } else if (this._state === AFTER_SCRIPT_5) {
                          this._stateAfterScript5(c);
                        }

                        /*
                        * style
                        */
                        else if (this._state === BEFORE_STYLE_1) {
                            this._stateBeforeStyle1(c);
                          } else if (this._state === BEFORE_STYLE_2) {
                            this._stateBeforeStyle2(c);
                          } else if (this._state === BEFORE_STYLE_3) {
                            this._stateBeforeStyle3(c);
                          } else if (this._state === BEFORE_STYLE_4) {
                            this._stateBeforeStyle4(c);
                          } else if (this._state === AFTER_STYLE_1) {
                            this._stateAfterStyle1(c);
                          } else if (this._state === AFTER_STYLE_2) {
                            this._stateAfterStyle2(c);
                          } else if (this._state === AFTER_STYLE_3) {
                            this._stateAfterStyle3(c);
                          } else if (this._state === AFTER_STYLE_4) {
                            this._stateAfterStyle4(c);
                          }

                          /*
                          * entities
                          */
                          else if (this._state === BEFORE_ENTITY) {
                              this._stateBeforeEntity(c);
                            } else if (this._state === BEFORE_NUMERIC_ENTITY) {
                              this._stateBeforeNumericEntity(c);
                            } else if (this._state === IN_NAMED_ENTITY) {
                              this._stateInNamedEntity(c);
                            } else if (this._state === IN_NUMERIC_ENTITY) {
                              this._stateInNumericEntity(c);
                            } else if (this._state === IN_HEX_ENTITY) {
                              this._stateInHexEntity(c);
                            } else {
                              this._cbs.onerror(Error("unknown _state"), this._state);
                            }

          this._index++;
        }

        this._cleanup();
      };

      Tokenizer.prototype.pause = function () {
        this._running = false;
      };
      Tokenizer.prototype.resume = function () {
        this._running = true;

        if (this._index < this._buffer.length) {
          this._parse();
        }
        if (this._ended) {
          this._finish();
        }
      };

      Tokenizer.prototype.end = function (chunk) {
        if (this._ended) this._cbs.onerror(Error(".end() after done!"));
        if (chunk) this.write(chunk);

        this._ended = true;

        if (this._running) this._finish();
      };

      Tokenizer.prototype._finish = function () {
        //if there is remaining data, emit it in a reasonable way
        if (this._sectionStart < this._index) {
          this._handleTrailingData();
        }

        this._cbs.onend();
      };

      Tokenizer.prototype._handleTrailingData = function () {
        var data = this._buffer.substr(this._sectionStart);

        if (this._state === IN_CDATA || this._state === AFTER_CDATA_1 || this._state === AFTER_CDATA_2) {
          this._cbs.oncdata(data);
        } else if (this._state === IN_COMMENT || this._state === AFTER_COMMENT_1 || this._state === AFTER_COMMENT_2) {
          this._cbs.oncomment(data);
        } else if (this._state === IN_NAMED_ENTITY && !this._xmlMode) {
          this._parseLegacyEntity();
          if (this._sectionStart < this._index) {
            this._state = this._baseState;
            this._handleTrailingData();
          }
        } else if (this._state === IN_NUMERIC_ENTITY && !this._xmlMode) {
          this._decodeNumericEntity(2, 10);
          if (this._sectionStart < this._index) {
            this._state = this._baseState;
            this._handleTrailingData();
          }
        } else if (this._state === IN_HEX_ENTITY && !this._xmlMode) {
          this._decodeNumericEntity(3, 16);
          if (this._sectionStart < this._index) {
            this._state = this._baseState;
            this._handleTrailingData();
          }
        } else if (this._state !== IN_TAG_NAME && this._state !== BEFORE_ATTRIBUTE_NAME && this._state !== BEFORE_ATTRIBUTE_VALUE && this._state !== AFTER_ATTRIBUTE_NAME && this._state !== IN_ATTRIBUTE_NAME && this._state !== IN_ATTRIBUTE_VALUE_SQ && this._state !== IN_ATTRIBUTE_VALUE_DQ && this._state !== IN_ATTRIBUTE_VALUE_NQ && this._state !== IN_CLOSING_TAG_NAME) {
          this._cbs.ontext(data);
        }
        //else, ignore remaining data
        //TODO add a way to remove current tag
      };

      Tokenizer.prototype.reset = function () {
        Tokenizer.call(this, { xmlMode: this._xmlMode, decodeEntities: this._decodeEntities }, this._cbs);
      };

      Tokenizer.prototype.getAbsoluteIndex = function () {
        return this._bufferOffset + this._index;
      };

      Tokenizer.prototype._getSection = function () {
        return this._buffer.substring(this._sectionStart, this._index);
      };

      Tokenizer.prototype._emitToken = function (name) {
        this._cbs[name](this._getSection());
        this._sectionStart = -1;
      };

      Tokenizer.prototype._emitPartial = function (value) {
        if (this._baseState !== TEXT) {
          this._cbs.onattribdata(value); //TODO implement the new event
        } else {
            this._cbs.ontext(value);
          }
      };
    }, { "entities/lib/decode_codepoint.js": 16, "entities/maps/entities.json": 19, "entities/maps/legacy.json": 20, "entities/maps/xml.json": 21 }], 28: [function (require, module, exports) {
      module.exports = Stream;

      var Parser = require("./Parser.js"),
          WritableStream = require("stream").Writable || require("readable-stream").Writable;

      function Stream(cbs, options) {
        var parser = this._parser = new Parser(cbs, options);

        WritableStream.call(this, { decodeStrings: false });

        this.once("finish", function () {
          parser.end();
        });
      }

      require("util").inherits(Stream, WritableStream);

      WritableStream.prototype._write = function (chunk, encoding, cb) {
        this._parser.write(chunk);
        cb();
      };
    }, { "./Parser.js": 24, "readable-stream": 30, "stream": 51, "util": 55 }], 29: [function (require, module, exports) {
      var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

      ;(function (exports) {
        'use strict';

        var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

        var PLUS = '+'.charCodeAt(0);
        var SLASH = '/'.charCodeAt(0);
        var NUMBER = '0'.charCodeAt(0);
        var LOWER = 'a'.charCodeAt(0);
        var UPPER = 'A'.charCodeAt(0);
        var PLUS_URL_SAFE = '-'.charCodeAt(0);
        var SLASH_URL_SAFE = '_'.charCodeAt(0);

        function decode(elt) {
          var code = elt.charCodeAt(0);
          if (code === PLUS || code === PLUS_URL_SAFE) return 62; // '+'
          if (code === SLASH || code === SLASH_URL_SAFE) return 63; // '/'
          if (code < NUMBER) return -1; //no match
          if (code < NUMBER + 10) return code - NUMBER + 26 + 26;
          if (code < UPPER + 26) return code - UPPER;
          if (code < LOWER + 26) return code - LOWER + 26;
        }

        function b64ToByteArray(b64) {
          var i, j, l, tmp, placeHolders, arr;

          if (b64.length % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4');
          }

          // the number of equal signs (place holders)
          // if there are two placeholders, than the two characters before it
          // represent one byte
          // if there is only one, then the three characters before it represent 2 bytes
          // this is just a cheap hack to not do indexOf twice
          var len = b64.length;
          placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0;

          // base64 is 4/3 + up to two characters of the original data
          arr = new Arr(b64.length * 3 / 4 - placeHolders);

          // if there are placeholders, only get up to the last complete 4 chars
          l = placeHolders > 0 ? b64.length - 4 : b64.length;

          var L = 0;

          function push(v) {
            arr[L++] = v;
          }

          for (i = 0, j = 0; i < l; i += 4, j += 3) {
            tmp = decode(b64.charAt(i)) << 18 | decode(b64.charAt(i + 1)) << 12 | decode(b64.charAt(i + 2)) << 6 | decode(b64.charAt(i + 3));
            push((tmp & 0xFF0000) >> 16);
            push((tmp & 0xFF00) >> 8);
            push(tmp & 0xFF);
          }

          if (placeHolders === 2) {
            tmp = decode(b64.charAt(i)) << 2 | decode(b64.charAt(i + 1)) >> 4;
            push(tmp & 0xFF);
          } else if (placeHolders === 1) {
            tmp = decode(b64.charAt(i)) << 10 | decode(b64.charAt(i + 1)) << 4 | decode(b64.charAt(i + 2)) >> 2;
            push(tmp >> 8 & 0xFF);
            push(tmp & 0xFF);
          }

          return arr;
        }

        function uint8ToBase64(uint8) {
          var i,
              extraBytes = uint8.length % 3,
              // if we have 1 byte left, pad 2 bytes
          output = "",
              temp,
              length;

          function encode(num) {
            return lookup.charAt(num);
          }

          function tripletToBase64(num) {
            return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
          }

          // go through the array every three bytes, we'll deal with trailing stuff later
          for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
            temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
            output += tripletToBase64(temp);
          }

          // pad the end with zeros, but make sure to not forget the extra bytes
          switch (extraBytes) {
            case 1:
              temp = uint8[uint8.length - 1];
              output += encode(temp >> 2);
              output += encode(temp << 4 & 0x3F);
              output += '==';
              break;
            case 2:
              temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1];
              output += encode(temp >> 10);
              output += encode(temp >> 4 & 0x3F);
              output += encode(temp << 2 & 0x3F);
              output += '=';
              break;
          }

          return output;
        }

        exports.toByteArray = b64ToByteArray;
        exports.fromByteArray = uint8ToBase64;
      })(typeof exports === 'undefined' ? this.base64js = {} : exports);
    }, {}], 30: [function (require, module, exports) {}, {}], 31: [function (require, module, exports) {
      (function (global) {
        /*!
         * The buffer module from node.js, for the browser.
         *
         * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
         * @license  MIT
         */
        /* eslint-disable no-proto */

        'use strict';

        var base64 = require('base64-js');
        var ieee754 = require('ieee754');
        var isArray = require('isarray');

        exports.Buffer = Buffer;
        exports.SlowBuffer = SlowBuffer;
        exports.INSPECT_MAX_BYTES = 50;
        Buffer.poolSize = 8192; // not used by this implementation

        var rootParent = {};

        /**
         * If `Buffer.TYPED_ARRAY_SUPPORT`:
         *   === true    Use Uint8Array implementation (fastest)
         *   === false   Use Object implementation (most compatible, even IE6)
         *
         * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
         * Opera 11.6+, iOS 4.2+.
         *
         * Due to various browser bugs, sometimes the Object implementation will be used even
         * when the browser supports typed arrays.
         *
         * Note:
         *
         *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
         *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
         *
         *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
         *     on objects.
         *
         *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
         *
         *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
         *     incorrect length in some situations.
        
         * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
         * get the Object implementation, which is slower but behaves correctly.
         */
        Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined ? global.TYPED_ARRAY_SUPPORT : typedArraySupport();

        function typedArraySupport() {
          function Bar() {}
          try {
            var arr = new Uint8Array(1);
            arr.foo = function () {
              return 42;
            };
            arr.constructor = Bar;
            return arr.foo() === 42 && // typed array instances can be augmented
            arr.constructor === Bar && // constructor can be set
            typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
            arr.subarray(1, 1).byteLength === 0; // ie10 has broken `subarray`
          } catch (e) {
            return false;
          }
        }

        function kMaxLength() {
          return Buffer.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
        }

        /**
         * Class: Buffer
         * =============
         *
         * The Buffer constructor returns instances of `Uint8Array` that are augmented
         * with function properties for all the node `Buffer` API functions. We use
         * `Uint8Array` so that square bracket notation works as expected -- it returns
         * a single octet.
         *
         * By augmenting the instances, we can avoid modifying the `Uint8Array`
         * prototype.
         */
        function Buffer(arg) {
          if (!(this instanceof Buffer)) {
            // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
            if (arguments.length > 1) return new Buffer(arg, arguments[1]);
            return new Buffer(arg);
          }

          if (!Buffer.TYPED_ARRAY_SUPPORT) {
            this.length = 0;
            this.parent = undefined;
          }

          // Common case.
          if (typeof arg === 'number') {
            return fromNumber(this, arg);
          }

          // Slightly less common case.
          if (typeof arg === 'string') {
            return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8');
          }

          // Unusual.
          return fromObject(this, arg);
        }

        function fromNumber(that, length) {
          that = allocate(that, length < 0 ? 0 : checked(length) | 0);
          if (!Buffer.TYPED_ARRAY_SUPPORT) {
            for (var i = 0; i < length; i++) {
              that[i] = 0;
            }
          }
          return that;
        }

        function fromString(that, string, encoding) {
          if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8';

          // Assumption: byteLength() return value is always < kMaxLength.
          var length = byteLength(string, encoding) | 0;
          that = allocate(that, length);

          that.write(string, encoding);
          return that;
        }

        function fromObject(that, object) {
          if (Buffer.isBuffer(object)) return fromBuffer(that, object);

          if (isArray(object)) return fromArray(that, object);

          if (object == null) {
            throw new TypeError('must start with number, buffer, array or string');
          }

          if (typeof ArrayBuffer !== 'undefined') {
            if (object.buffer instanceof ArrayBuffer) {
              return fromTypedArray(that, object);
            }
            if (object instanceof ArrayBuffer) {
              return fromArrayBuffer(that, object);
            }
          }

          if (object.length) return fromArrayLike(that, object);

          return fromJsonObject(that, object);
        }

        function fromBuffer(that, buffer) {
          var length = checked(buffer.length) | 0;
          that = allocate(that, length);
          buffer.copy(that, 0, 0, length);
          return that;
        }

        function fromArray(that, array) {
          var length = checked(array.length) | 0;
          that = allocate(that, length);
          for (var i = 0; i < length; i += 1) {
            that[i] = array[i] & 255;
          }
          return that;
        }

        // Duplicate of fromArray() to keep fromArray() monomorphic.
        function fromTypedArray(that, array) {
          var length = checked(array.length) | 0;
          that = allocate(that, length);
          // Truncating the elements is probably not what people expect from typed
          // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
          // of the old Buffer constructor.
          for (var i = 0; i < length; i += 1) {
            that[i] = array[i] & 255;
          }
          return that;
        }

        function fromArrayBuffer(that, array) {
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            // Return an augmented `Uint8Array` instance, for best performance
            array.byteLength;
            that = Buffer._augment(new Uint8Array(array));
          } else {
            // Fallback: Return an object instance of the Buffer class
            that = fromTypedArray(that, new Uint8Array(array));
          }
          return that;
        }

        function fromArrayLike(that, array) {
          var length = checked(array.length) | 0;
          that = allocate(that, length);
          for (var i = 0; i < length; i += 1) {
            that[i] = array[i] & 255;
          }
          return that;
        }

        // Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
        // Returns a zero-length buffer for inputs that don't conform to the spec.
        function fromJsonObject(that, object) {
          var array;
          var length = 0;

          if (object.type === 'Buffer' && isArray(object.data)) {
            array = object.data;
            length = checked(array.length) | 0;
          }
          that = allocate(that, length);

          for (var i = 0; i < length; i += 1) {
            that[i] = array[i] & 255;
          }
          return that;
        }

        if (Buffer.TYPED_ARRAY_SUPPORT) {
          Buffer.prototype.__proto__ = Uint8Array.prototype;
          Buffer.__proto__ = Uint8Array;
        } else {
          // pre-set for values that may exist in the future
          Buffer.prototype.length = undefined;
          Buffer.prototype.parent = undefined;
        }

        function allocate(that, length) {
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            // Return an augmented `Uint8Array` instance, for best performance
            that = Buffer._augment(new Uint8Array(length));
            that.__proto__ = Buffer.prototype;
          } else {
            // Fallback: Return an object instance of the Buffer class
            that.length = length;
            that._isBuffer = true;
          }

          var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1;
          if (fromPool) that.parent = rootParent;

          return that;
        }

        function checked(length) {
          // Note: cannot use `length < kMaxLength` here because that fails when
          // length is NaN (which is otherwise coerced to zero.)
          if (length >= kMaxLength()) {
            throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
          }
          return length | 0;
        }

        function SlowBuffer(subject, encoding) {
          if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding);

          var buf = new Buffer(subject, encoding);
          delete buf.parent;
          return buf;
        }

        Buffer.isBuffer = function isBuffer(b) {
          return !!(b != null && b._isBuffer);
        };

        Buffer.compare = function compare(a, b) {
          if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
            throw new TypeError('Arguments must be Buffers');
          }

          if (a === b) return 0;

          var x = a.length;
          var y = b.length;

          var i = 0;
          var len = Math.min(x, y);
          while (i < len) {
            if (a[i] !== b[i]) break;

            ++i;
          }

          if (i !== len) {
            x = a[i];
            y = b[i];
          }

          if (x < y) return -1;
          if (y < x) return 1;
          return 0;
        };

        Buffer.isEncoding = function isEncoding(encoding) {
          switch (String(encoding).toLowerCase()) {
            case 'hex':
            case 'utf8':
            case 'utf-8':
            case 'ascii':
            case 'binary':
            case 'base64':
            case 'raw':
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return true;
            default:
              return false;
          }
        };

        Buffer.concat = function concat(list, length) {
          if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.');

          if (list.length === 0) {
            return new Buffer(0);
          }

          var i;
          if (length === undefined) {
            length = 0;
            for (i = 0; i < list.length; i++) {
              length += list[i].length;
            }
          }

          var buf = new Buffer(length);
          var pos = 0;
          for (i = 0; i < list.length; i++) {
            var item = list[i];
            item.copy(buf, pos);
            pos += item.length;
          }
          return buf;
        };

        function byteLength(string, encoding) {
          if (typeof string !== 'string') string = '' + string;

          var len = string.length;
          if (len === 0) return 0;

          // Use a for loop to avoid recursion
          var loweredCase = false;
          for (;;) {
            switch (encoding) {
              case 'ascii':
              case 'binary':
              // Deprecated
              case 'raw':
              case 'raws':
                return len;
              case 'utf8':
              case 'utf-8':
                return utf8ToBytes(string).length;
              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
                return len * 2;
              case 'hex':
                return len >>> 1;
              case 'base64':
                return base64ToBytes(string).length;
              default:
                if (loweredCase) return utf8ToBytes(string).length; // assume utf8
                encoding = ('' + encoding).toLowerCase();
                loweredCase = true;
            }
          }
        }
        Buffer.byteLength = byteLength;

        function slowToString(encoding, start, end) {
          var loweredCase = false;

          start = start | 0;
          end = end === undefined || end === Infinity ? this.length : end | 0;

          if (!encoding) encoding = 'utf8';
          if (start < 0) start = 0;
          if (end > this.length) end = this.length;
          if (end <= start) return '';

          while (true) {
            switch (encoding) {
              case 'hex':
                return hexSlice(this, start, end);

              case 'utf8':
              case 'utf-8':
                return utf8Slice(this, start, end);

              case 'ascii':
                return asciiSlice(this, start, end);

              case 'binary':
                return binarySlice(this, start, end);

              case 'base64':
                return base64Slice(this, start, end);

              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
                return utf16leSlice(this, start, end);

              default:
                if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                encoding = (encoding + '').toLowerCase();
                loweredCase = true;
            }
          }
        }

        Buffer.prototype.toString = function toString() {
          var length = this.length | 0;
          if (length === 0) return '';
          if (arguments.length === 0) return utf8Slice(this, 0, length);
          return slowToString.apply(this, arguments);
        };

        Buffer.prototype.equals = function equals(b) {
          if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
          if (this === b) return true;
          return Buffer.compare(this, b) === 0;
        };

        Buffer.prototype.inspect = function inspect() {
          var str = '';
          var max = exports.INSPECT_MAX_BYTES;
          if (this.length > 0) {
            str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
            if (this.length > max) str += ' ... ';
          }
          return '<Buffer ' + str + '>';
        };

        Buffer.prototype.compare = function compare(b) {
          if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
          if (this === b) return 0;
          return Buffer.compare(this, b);
        };

        Buffer.prototype.indexOf = function indexOf(val, byteOffset) {
          if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff;else if (byteOffset < -0x80000000) byteOffset = -0x80000000;
          byteOffset >>= 0;

          if (this.length === 0) return -1;
          if (byteOffset >= this.length) return -1;

          // Negative offsets start from the end of the buffer
          if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0);

          if (typeof val === 'string') {
            if (val.length === 0) return -1; // special case: looking for empty string always fails
            return String.prototype.indexOf.call(this, val, byteOffset);
          }
          if (Buffer.isBuffer(val)) {
            return arrayIndexOf(this, val, byteOffset);
          }
          if (typeof val === 'number') {
            if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
              return Uint8Array.prototype.indexOf.call(this, val, byteOffset);
            }
            return arrayIndexOf(this, [val], byteOffset);
          }

          function arrayIndexOf(arr, val, byteOffset) {
            var foundIndex = -1;
            for (var i = 0; byteOffset + i < arr.length; i++) {
              if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
                if (foundIndex === -1) foundIndex = i;
                if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex;
              } else {
                foundIndex = -1;
              }
            }
            return -1;
          }

          throw new TypeError('val must be string, number or Buffer');
        };

        // `get` is deprecated
        Buffer.prototype.get = function get(offset) {
          console.log('.get() is deprecated. Access using array indexes instead.');
          return this.readUInt8(offset);
        };

        // `set` is deprecated
        Buffer.prototype.set = function set(v, offset) {
          console.log('.set() is deprecated. Access using array indexes instead.');
          return this.writeUInt8(v, offset);
        };

        function hexWrite(buf, string, offset, length) {
          offset = Number(offset) || 0;
          var remaining = buf.length - offset;
          if (!length) {
            length = remaining;
          } else {
            length = Number(length);
            if (length > remaining) {
              length = remaining;
            }
          }

          // must be an even number of digits
          var strLen = string.length;
          if (strLen % 2 !== 0) throw new Error('Invalid hex string');

          if (length > strLen / 2) {
            length = strLen / 2;
          }
          for (var i = 0; i < length; i++) {
            var parsed = parseInt(string.substr(i * 2, 2), 16);
            if (isNaN(parsed)) throw new Error('Invalid hex string');
            buf[offset + i] = parsed;
          }
          return i;
        }

        function utf8Write(buf, string, offset, length) {
          return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
        }

        function asciiWrite(buf, string, offset, length) {
          return blitBuffer(asciiToBytes(string), buf, offset, length);
        }

        function binaryWrite(buf, string, offset, length) {
          return asciiWrite(buf, string, offset, length);
        }

        function base64Write(buf, string, offset, length) {
          return blitBuffer(base64ToBytes(string), buf, offset, length);
        }

        function ucs2Write(buf, string, offset, length) {
          return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
        }

        Buffer.prototype.write = function write(string, offset, length, encoding) {
          // Buffer#write(string)
          if (offset === undefined) {
            encoding = 'utf8';
            length = this.length;
            offset = 0;
            // Buffer#write(string, encoding)
          } else if (length === undefined && typeof offset === 'string') {
              encoding = offset;
              length = this.length;
              offset = 0;
              // Buffer#write(string, offset[, length][, encoding])
            } else if (isFinite(offset)) {
                offset = offset | 0;
                if (isFinite(length)) {
                  length = length | 0;
                  if (encoding === undefined) encoding = 'utf8';
                } else {
                  encoding = length;
                  length = undefined;
                }
                // legacy write(string, encoding, offset, length) - remove in v0.13
              } else {
                  var swap = encoding;
                  encoding = offset;
                  offset = length | 0;
                  length = swap;
                }

          var remaining = this.length - offset;
          if (length === undefined || length > remaining) length = remaining;

          if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
            throw new RangeError('attempt to write outside buffer bounds');
          }

          if (!encoding) encoding = 'utf8';

          var loweredCase = false;
          for (;;) {
            switch (encoding) {
              case 'hex':
                return hexWrite(this, string, offset, length);

              case 'utf8':
              case 'utf-8':
                return utf8Write(this, string, offset, length);

              case 'ascii':
                return asciiWrite(this, string, offset, length);

              case 'binary':
                return binaryWrite(this, string, offset, length);

              case 'base64':
                // Warning: maxLength not taken into account in base64Write
                return base64Write(this, string, offset, length);

              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
                return ucs2Write(this, string, offset, length);

              default:
                if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                encoding = ('' + encoding).toLowerCase();
                loweredCase = true;
            }
          }
        };

        Buffer.prototype.toJSON = function toJSON() {
          return {
            type: 'Buffer',
            data: Array.prototype.slice.call(this._arr || this, 0)
          };
        };

        function base64Slice(buf, start, end) {
          if (start === 0 && end === buf.length) {
            return base64.fromByteArray(buf);
          } else {
            return base64.fromByteArray(buf.slice(start, end));
          }
        }

        function utf8Slice(buf, start, end) {
          end = Math.min(buf.length, end);
          var res = [];

          var i = start;
          while (i < end) {
            var firstByte = buf[i];
            var codePoint = null;
            var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

            if (i + bytesPerSequence <= end) {
              var secondByte, thirdByte, fourthByte, tempCodePoint;

              switch (bytesPerSequence) {
                case 1:
                  if (firstByte < 0x80) {
                    codePoint = firstByte;
                  }
                  break;
                case 2:
                  secondByte = buf[i + 1];
                  if ((secondByte & 0xC0) === 0x80) {
                    tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
                    if (tempCodePoint > 0x7F) {
                      codePoint = tempCodePoint;
                    }
                  }
                  break;
                case 3:
                  secondByte = buf[i + 1];
                  thirdByte = buf[i + 2];
                  if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                    tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
                    if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                      codePoint = tempCodePoint;
                    }
                  }
                  break;
                case 4:
                  secondByte = buf[i + 1];
                  thirdByte = buf[i + 2];
                  fourthByte = buf[i + 3];
                  if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                    tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
                    if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                      codePoint = tempCodePoint;
                    }
                  }
              }
            }

            if (codePoint === null) {
              // we did not generate a valid codePoint so insert a
              // replacement char (U+FFFD) and advance only 1 byte
              codePoint = 0xFFFD;
              bytesPerSequence = 1;
            } else if (codePoint > 0xFFFF) {
              // encode to utf16 (surrogate pair dance)
              codePoint -= 0x10000;
              res.push(codePoint >>> 10 & 0x3FF | 0xD800);
              codePoint = 0xDC00 | codePoint & 0x3FF;
            }

            res.push(codePoint);
            i += bytesPerSequence;
          }

          return decodeCodePointsArray(res);
        }

        // Based on http://stackoverflow.com/a/22747272/680742, the browser with
        // the lowest limit is Chrome, with 0x10000 args.
        // We go 1 magnitude less, for safety
        var MAX_ARGUMENTS_LENGTH = 0x1000;

        function decodeCodePointsArray(codePoints) {
          var len = codePoints.length;
          if (len <= MAX_ARGUMENTS_LENGTH) {
            return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
          }

          // Decode in chunks to avoid "call stack size exceeded".
          var res = '';
          var i = 0;
          while (i < len) {
            res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
          }
          return res;
        }

        function asciiSlice(buf, start, end) {
          var ret = '';
          end = Math.min(buf.length, end);

          for (var i = start; i < end; i++) {
            ret += String.fromCharCode(buf[i] & 0x7F);
          }
          return ret;
        }

        function binarySlice(buf, start, end) {
          var ret = '';
          end = Math.min(buf.length, end);

          for (var i = start; i < end; i++) {
            ret += String.fromCharCode(buf[i]);
          }
          return ret;
        }

        function hexSlice(buf, start, end) {
          var len = buf.length;

          if (!start || start < 0) start = 0;
          if (!end || end < 0 || end > len) end = len;

          var out = '';
          for (var i = start; i < end; i++) {
            out += toHex(buf[i]);
          }
          return out;
        }

        function utf16leSlice(buf, start, end) {
          var bytes = buf.slice(start, end);
          var res = '';
          for (var i = 0; i < bytes.length; i += 2) {
            res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
          }
          return res;
        }

        Buffer.prototype.slice = function slice(start, end) {
          var len = this.length;
          start = ~ ~start;
          end = end === undefined ? len : ~ ~end;

          if (start < 0) {
            start += len;
            if (start < 0) start = 0;
          } else if (start > len) {
            start = len;
          }

          if (end < 0) {
            end += len;
            if (end < 0) end = 0;
          } else if (end > len) {
            end = len;
          }

          if (end < start) end = start;

          var newBuf;
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            newBuf = Buffer._augment(this.subarray(start, end));
          } else {
            var sliceLen = end - start;
            newBuf = new Buffer(sliceLen, undefined);
            for (var i = 0; i < sliceLen; i++) {
              newBuf[i] = this[i + start];
            }
          }

          if (newBuf.length) newBuf.parent = this.parent || this;

          return newBuf;
        };

        /*
         * Need to make sure that buffer isn't trying to write out of bounds.
         */
        function checkOffset(offset, ext, length) {
          if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
          if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
        }

        Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
          offset = offset | 0;
          byteLength = byteLength | 0;
          if (!noAssert) checkOffset(offset, byteLength, this.length);

          var val = this[offset];
          var mul = 1;
          var i = 0;
          while (++i < byteLength && (mul *= 0x100)) {
            val += this[offset + i] * mul;
          }

          return val;
        };

        Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
          offset = offset | 0;
          byteLength = byteLength | 0;
          if (!noAssert) {
            checkOffset(offset, byteLength, this.length);
          }

          var val = this[offset + --byteLength];
          var mul = 1;
          while (byteLength > 0 && (mul *= 0x100)) {
            val += this[offset + --byteLength] * mul;
          }

          return val;
        };

        Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 1, this.length);
          return this[offset];
        };

        Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 2, this.length);
          return this[offset] | this[offset + 1] << 8;
        };

        Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 2, this.length);
          return this[offset] << 8 | this[offset + 1];
        };

        Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 4, this.length);

          return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
        };

        Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 4, this.length);

          return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
        };

        Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
          offset = offset | 0;
          byteLength = byteLength | 0;
          if (!noAssert) checkOffset(offset, byteLength, this.length);

          var val = this[offset];
          var mul = 1;
          var i = 0;
          while (++i < byteLength && (mul *= 0x100)) {
            val += this[offset + i] * mul;
          }
          mul *= 0x80;

          if (val >= mul) val -= Math.pow(2, 8 * byteLength);

          return val;
        };

        Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
          offset = offset | 0;
          byteLength = byteLength | 0;
          if (!noAssert) checkOffset(offset, byteLength, this.length);

          var i = byteLength;
          var mul = 1;
          var val = this[offset + --i];
          while (i > 0 && (mul *= 0x100)) {
            val += this[offset + --i] * mul;
          }
          mul *= 0x80;

          if (val >= mul) val -= Math.pow(2, 8 * byteLength);

          return val;
        };

        Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 1, this.length);
          if (!(this[offset] & 0x80)) return this[offset];
          return (0xff - this[offset] + 1) * -1;
        };

        Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 2, this.length);
          var val = this[offset] | this[offset + 1] << 8;
          return val & 0x8000 ? val | 0xFFFF0000 : val;
        };

        Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 2, this.length);
          var val = this[offset + 1] | this[offset] << 8;
          return val & 0x8000 ? val | 0xFFFF0000 : val;
        };

        Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 4, this.length);

          return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
        };

        Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 4, this.length);

          return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
        };

        Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 4, this.length);
          return ieee754.read(this, offset, true, 23, 4);
        };

        Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 4, this.length);
          return ieee754.read(this, offset, false, 23, 4);
        };

        Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 8, this.length);
          return ieee754.read(this, offset, true, 52, 8);
        };

        Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
          if (!noAssert) checkOffset(offset, 8, this.length);
          return ieee754.read(this, offset, false, 52, 8);
        };

        function checkInt(buf, value, offset, ext, max, min) {
          if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance');
          if (value > max || value < min) throw new RangeError('value is out of bounds');
          if (offset + ext > buf.length) throw new RangeError('index out of range');
        }

        Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
          value = +value;
          offset = offset | 0;
          byteLength = byteLength | 0;
          if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);

          var mul = 1;
          var i = 0;
          this[offset] = value & 0xFF;
          while (++i < byteLength && (mul *= 0x100)) {
            this[offset + i] = value / mul & 0xFF;
          }

          return offset + byteLength;
        };

        Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
          value = +value;
          offset = offset | 0;
          byteLength = byteLength | 0;
          if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);

          var i = byteLength - 1;
          var mul = 1;
          this[offset + i] = value & 0xFF;
          while (--i >= 0 && (mul *= 0x100)) {
            this[offset + i] = value / mul & 0xFF;
          }

          return offset + byteLength;
        };

        Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
          if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
          this[offset] = value & 0xff;
          return offset + 1;
        };

        function objectWriteUInt16(buf, value, offset, littleEndian) {
          if (value < 0) value = 0xffff + value + 1;
          for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
            buf[offset + i] = (value & 0xff << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
          }
        }

        Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value & 0xff;
            this[offset + 1] = value >>> 8;
          } else {
            objectWriteUInt16(this, value, offset, true);
          }
          return offset + 2;
        };

        Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 8;
            this[offset + 1] = value & 0xff;
          } else {
            objectWriteUInt16(this, value, offset, false);
          }
          return offset + 2;
        };

        function objectWriteUInt32(buf, value, offset, littleEndian) {
          if (value < 0) value = 0xffffffff + value + 1;
          for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
            buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 0xff;
          }
        }

        Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset + 3] = value >>> 24;
            this[offset + 2] = value >>> 16;
            this[offset + 1] = value >>> 8;
            this[offset] = value & 0xff;
          } else {
            objectWriteUInt32(this, value, offset, true);
          }
          return offset + 4;
        };

        Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 24;
            this[offset + 1] = value >>> 16;
            this[offset + 2] = value >>> 8;
            this[offset + 3] = value & 0xff;
          } else {
            objectWriteUInt32(this, value, offset, false);
          }
          return offset + 4;
        };

        Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) {
            var limit = Math.pow(2, 8 * byteLength - 1);

            checkInt(this, value, offset, byteLength, limit - 1, -limit);
          }

          var i = 0;
          var mul = 1;
          var sub = value < 0 ? 1 : 0;
          this[offset] = value & 0xFF;
          while (++i < byteLength && (mul *= 0x100)) {
            this[offset + i] = (value / mul >> 0) - sub & 0xFF;
          }

          return offset + byteLength;
        };

        Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) {
            var limit = Math.pow(2, 8 * byteLength - 1);

            checkInt(this, value, offset, byteLength, limit - 1, -limit);
          }

          var i = byteLength - 1;
          var mul = 1;
          var sub = value < 0 ? 1 : 0;
          this[offset + i] = value & 0xFF;
          while (--i >= 0 && (mul *= 0x100)) {
            this[offset + i] = (value / mul >> 0) - sub & 0xFF;
          }

          return offset + byteLength;
        };

        Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
          if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
          if (value < 0) value = 0xff + value + 1;
          this[offset] = value & 0xff;
          return offset + 1;
        };

        Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value & 0xff;
            this[offset + 1] = value >>> 8;
          } else {
            objectWriteUInt16(this, value, offset, true);
          }
          return offset + 2;
        };

        Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 8;
            this[offset + 1] = value & 0xff;
          } else {
            objectWriteUInt16(this, value, offset, false);
          }
          return offset + 2;
        };

        Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value & 0xff;
            this[offset + 1] = value >>> 8;
            this[offset + 2] = value >>> 16;
            this[offset + 3] = value >>> 24;
          } else {
            objectWriteUInt32(this, value, offset, true);
          }
          return offset + 4;
        };

        Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
          value = +value;
          offset = offset | 0;
          if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
          if (value < 0) value = 0xffffffff + value + 1;
          if (Buffer.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 24;
            this[offset + 1] = value >>> 16;
            this[offset + 2] = value >>> 8;
            this[offset + 3] = value & 0xff;
          } else {
            objectWriteUInt32(this, value, offset, false);
          }
          return offset + 4;
        };

        function checkIEEE754(buf, value, offset, ext, max, min) {
          if (value > max || value < min) throw new RangeError('value is out of bounds');
          if (offset + ext > buf.length) throw new RangeError('index out of range');
          if (offset < 0) throw new RangeError('index out of range');
        }

        function writeFloat(buf, value, offset, littleEndian, noAssert) {
          if (!noAssert) {
            checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
          }
          ieee754.write(buf, value, offset, littleEndian, 23, 4);
          return offset + 4;
        }

        Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
          return writeFloat(this, value, offset, true, noAssert);
        };

        Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
          return writeFloat(this, value, offset, false, noAssert);
        };

        function writeDouble(buf, value, offset, littleEndian, noAssert) {
          if (!noAssert) {
            checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
          }
          ieee754.write(buf, value, offset, littleEndian, 52, 8);
          return offset + 8;
        }

        Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
          return writeDouble(this, value, offset, true, noAssert);
        };

        Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
          return writeDouble(this, value, offset, false, noAssert);
        };

        // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
        Buffer.prototype.copy = function copy(target, targetStart, start, end) {
          if (!start) start = 0;
          if (!end && end !== 0) end = this.length;
          if (targetStart >= target.length) targetStart = target.length;
          if (!targetStart) targetStart = 0;
          if (end > 0 && end < start) end = start;

          // Copy 0 bytes; we're done
          if (end === start) return 0;
          if (target.length === 0 || this.length === 0) return 0;

          // Fatal error conditions
          if (targetStart < 0) {
            throw new RangeError('targetStart out of bounds');
          }
          if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
          if (end < 0) throw new RangeError('sourceEnd out of bounds');

          // Are we oob?
          if (end > this.length) end = this.length;
          if (target.length - targetStart < end - start) {
            end = target.length - targetStart + start;
          }

          var len = end - start;
          var i;

          if (this === target && start < targetStart && targetStart < end) {
            // descending copy from end
            for (i = len - 1; i >= 0; i--) {
              target[i + targetStart] = this[i + start];
            }
          } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
            // ascending copy from start
            for (i = 0; i < len; i++) {
              target[i + targetStart] = this[i + start];
            }
          } else {
            target._set(this.subarray(start, start + len), targetStart);
          }

          return len;
        };

        // fill(value, start=0, end=buffer.length)
        Buffer.prototype.fill = function fill(value, start, end) {
          if (!value) value = 0;
          if (!start) start = 0;
          if (!end) end = this.length;

          if (end < start) throw new RangeError('end < start');

          // Fill 0 bytes; we're done
          if (end === start) return;
          if (this.length === 0) return;

          if (start < 0 || start >= this.length) throw new RangeError('start out of bounds');
          if (end < 0 || end > this.length) throw new RangeError('end out of bounds');

          var i;
          if (typeof value === 'number') {
            for (i = start; i < end; i++) {
              this[i] = value;
            }
          } else {
            var bytes = utf8ToBytes(value.toString());
            var len = bytes.length;
            for (i = start; i < end; i++) {
              this[i] = bytes[i % len];
            }
          }

          return this;
        };

        /**
         * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
         * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
         */
        Buffer.prototype.toArrayBuffer = function toArrayBuffer() {
          if (typeof Uint8Array !== 'undefined') {
            if (Buffer.TYPED_ARRAY_SUPPORT) {
              return new Buffer(this).buffer;
            } else {
              var buf = new Uint8Array(this.length);
              for (var i = 0, len = buf.length; i < len; i += 1) {
                buf[i] = this[i];
              }
              return buf.buffer;
            }
          } else {
            throw new TypeError('Buffer.toArrayBuffer not supported in this browser');
          }
        };

        // HELPER FUNCTIONS
        // ================

        var BP = Buffer.prototype;

        /**
         * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
         */
        Buffer._augment = function _augment(arr) {
          arr.constructor = Buffer;
          arr._isBuffer = true;

          // save reference to original Uint8Array set method before overwriting
          arr._set = arr.set;

          // deprecated
          arr.get = BP.get;
          arr.set = BP.set;

          arr.write = BP.write;
          arr.toString = BP.toString;
          arr.toLocaleString = BP.toString;
          arr.toJSON = BP.toJSON;
          arr.equals = BP.equals;
          arr.compare = BP.compare;
          arr.indexOf = BP.indexOf;
          arr.copy = BP.copy;
          arr.slice = BP.slice;
          arr.readUIntLE = BP.readUIntLE;
          arr.readUIntBE = BP.readUIntBE;
          arr.readUInt8 = BP.readUInt8;
          arr.readUInt16LE = BP.readUInt16LE;
          arr.readUInt16BE = BP.readUInt16BE;
          arr.readUInt32LE = BP.readUInt32LE;
          arr.readUInt32BE = BP.readUInt32BE;
          arr.readIntLE = BP.readIntLE;
          arr.readIntBE = BP.readIntBE;
          arr.readInt8 = BP.readInt8;
          arr.readInt16LE = BP.readInt16LE;
          arr.readInt16BE = BP.readInt16BE;
          arr.readInt32LE = BP.readInt32LE;
          arr.readInt32BE = BP.readInt32BE;
          arr.readFloatLE = BP.readFloatLE;
          arr.readFloatBE = BP.readFloatBE;
          arr.readDoubleLE = BP.readDoubleLE;
          arr.readDoubleBE = BP.readDoubleBE;
          arr.writeUInt8 = BP.writeUInt8;
          arr.writeUIntLE = BP.writeUIntLE;
          arr.writeUIntBE = BP.writeUIntBE;
          arr.writeUInt16LE = BP.writeUInt16LE;
          arr.writeUInt16BE = BP.writeUInt16BE;
          arr.writeUInt32LE = BP.writeUInt32LE;
          arr.writeUInt32BE = BP.writeUInt32BE;
          arr.writeIntLE = BP.writeIntLE;
          arr.writeIntBE = BP.writeIntBE;
          arr.writeInt8 = BP.writeInt8;
          arr.writeInt16LE = BP.writeInt16LE;
          arr.writeInt16BE = BP.writeInt16BE;
          arr.writeInt32LE = BP.writeInt32LE;
          arr.writeInt32BE = BP.writeInt32BE;
          arr.writeFloatLE = BP.writeFloatLE;
          arr.writeFloatBE = BP.writeFloatBE;
          arr.writeDoubleLE = BP.writeDoubleLE;
          arr.writeDoubleBE = BP.writeDoubleBE;
          arr.fill = BP.fill;
          arr.inspect = BP.inspect;
          arr.toArrayBuffer = BP.toArrayBuffer;

          return arr;
        };

        var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

        function base64clean(str) {
          // Node strips out invalid characters like \n and \t from the string, base64-js does not
          str = stringtrim(str).replace(INVALID_BASE64_RE, '');
          // Node converts strings with length < 2 to ''
          if (str.length < 2) return '';
          // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
          while (str.length % 4 !== 0) {
            str = str + '=';
          }
          return str;
        }

        function stringtrim(str) {
          if (str.trim) return str.trim();
          return str.replace(/^\s+|\s+$/g, '');
        }

        function toHex(n) {
          if (n < 16) return '0' + n.toString(16);
          return n.toString(16);
        }

        function utf8ToBytes(string, units) {
          units = units || Infinity;
          var codePoint;
          var length = string.length;
          var leadSurrogate = null;
          var bytes = [];

          for (var i = 0; i < length; i++) {
            codePoint = string.charCodeAt(i);

            // is surrogate component
            if (codePoint > 0xD7FF && codePoint < 0xE000) {
              // last char was a lead
              if (!leadSurrogate) {
                // no lead yet
                if (codePoint > 0xDBFF) {
                  // unexpected trail
                  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                  continue;
                } else if (i + 1 === length) {
                  // unpaired lead
                  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                  continue;
                }

                // valid lead
                leadSurrogate = codePoint;

                continue;
              }

              // 2 leads in a row
              if (codePoint < 0xDC00) {
                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                leadSurrogate = codePoint;
                continue;
              }

              // valid surrogate pair
              codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
            } else if (leadSurrogate) {
              // valid bmp char, but last char was a lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            }

            leadSurrogate = null;

            // encode utf8
            if (codePoint < 0x80) {
              if ((units -= 1) < 0) break;
              bytes.push(codePoint);
            } else if (codePoint < 0x800) {
              if ((units -= 2) < 0) break;
              bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
            } else if (codePoint < 0x10000) {
              if ((units -= 3) < 0) break;
              bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
            } else if (codePoint < 0x110000) {
              if ((units -= 4) < 0) break;
              bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
            } else {
              throw new Error('Invalid code point');
            }
          }

          return bytes;
        }

        function asciiToBytes(str) {
          var byteArray = [];
          for (var i = 0; i < str.length; i++) {
            // Node's code seems to be doing this and not & 0x7F..
            byteArray.push(str.charCodeAt(i) & 0xFF);
          }
          return byteArray;
        }

        function utf16leToBytes(str, units) {
          var c, hi, lo;
          var byteArray = [];
          for (var i = 0; i < str.length; i++) {
            if ((units -= 2) < 0) break;

            c = str.charCodeAt(i);
            hi = c >> 8;
            lo = c % 256;
            byteArray.push(lo);
            byteArray.push(hi);
          }

          return byteArray;
        }

        function base64ToBytes(str) {
          return base64.toByteArray(base64clean(str));
        }

        function blitBuffer(src, dst, offset, length) {
          for (var i = 0; i < length; i++) {
            if (i + offset >= dst.length || i >= src.length) break;
            dst[i + offset] = src[i];
          }
          return i;
        }
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, { "base64-js": 29, "ieee754": 35, "isarray": 32 }], 32: [function (require, module, exports) {
      var toString = {}.toString;

      module.exports = Array.isArray || function (arr) {
        return toString.call(arr) == '[object Array]';
      };
    }, {}], 33: [function (require, module, exports) {
      (function (Buffer) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        // NOTE: These type checking functions intentionally don't use `instanceof`
        // because it is fragile and can be easily faked with `Object.create()`.

        function isArray(arg) {
          if (Array.isArray) {
            return Array.isArray(arg);
          }
          return objectToString(arg) === '[object Array]';
        }
        exports.isArray = isArray;

        function isBoolean(arg) {
          return typeof arg === 'boolean';
        }
        exports.isBoolean = isBoolean;

        function isNull(arg) {
          return arg === null;
        }
        exports.isNull = isNull;

        function isNullOrUndefined(arg) {
          return arg == null;
        }
        exports.isNullOrUndefined = isNullOrUndefined;

        function isNumber(arg) {
          return typeof arg === 'number';
        }
        exports.isNumber = isNumber;

        function isString(arg) {
          return typeof arg === 'string';
        }
        exports.isString = isString;

        function isSymbol(arg) {
          return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol';
        }
        exports.isSymbol = isSymbol;

        function isUndefined(arg) {
          return arg === void 0;
        }
        exports.isUndefined = isUndefined;

        function isRegExp(re) {
          return objectToString(re) === '[object RegExp]';
        }
        exports.isRegExp = isRegExp;

        function isObject(arg) {
          return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg !== null;
        }
        exports.isObject = isObject;

        function isDate(d) {
          return objectToString(d) === '[object Date]';
        }
        exports.isDate = isDate;

        function isError(e) {
          return objectToString(e) === '[object Error]' || e instanceof Error;
        }
        exports.isError = isError;

        function isFunction(arg) {
          return typeof arg === 'function';
        }
        exports.isFunction = isFunction;

        function isPrimitive(arg) {
          return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol' || // ES6 symbol
          typeof arg === 'undefined';
        }
        exports.isPrimitive = isPrimitive;

        exports.isBuffer = Buffer.isBuffer;

        function objectToString(o) {
          return Object.prototype.toString.call(o);
        }
      }).call(this, { "isBuffer": require("../../is-buffer/index.js") });
    }, { "../../is-buffer/index.js": 37 }], 34: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      function EventEmitter() {
        this._events = this._events || {};
        this._maxListeners = this._maxListeners || undefined;
      }
      module.exports = EventEmitter;

      // Backwards-compat with node 0.10.x
      EventEmitter.EventEmitter = EventEmitter;

      EventEmitter.prototype._events = undefined;
      EventEmitter.prototype._maxListeners = undefined;

      // By default EventEmitters will print a warning if more than 10 listeners are
      // added to it. This is a useful default which helps finding memory leaks.
      EventEmitter.defaultMaxListeners = 10;

      // Obviously not all Emitters should be limited to 10. This function allows
      // that to be increased. Set to zero for unlimited.
      EventEmitter.prototype.setMaxListeners = function (n) {
        if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
        this._maxListeners = n;
        return this;
      };

      EventEmitter.prototype.emit = function (type) {
        var er, handler, len, args, i, listeners;

        if (!this._events) this._events = {};

        // If there is no 'error' event listener then throw.
        if (type === 'error') {
          if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
            er = arguments[1];
            if (er instanceof Error) {
              throw er; // Unhandled 'error' event
            }
            throw TypeError('Uncaught, unspecified "error" event.');
          }
        }

        handler = this._events[type];

        if (isUndefined(handler)) return false;

        if (isFunction(handler)) {
          switch (arguments.length) {
            // fast cases
            case 1:
              handler.call(this);
              break;
            case 2:
              handler.call(this, arguments[1]);
              break;
            case 3:
              handler.call(this, arguments[1], arguments[2]);
              break;
            // slower
            default:
              args = Array.prototype.slice.call(arguments, 1);
              handler.apply(this, args);
          }
        } else if (isObject(handler)) {
          args = Array.prototype.slice.call(arguments, 1);
          listeners = handler.slice();
          len = listeners.length;
          for (i = 0; i < len; i++) {
            listeners[i].apply(this, args);
          }
        }

        return true;
      };

      EventEmitter.prototype.addListener = function (type, listener) {
        var m;

        if (!isFunction(listener)) throw TypeError('listener must be a function');

        if (!this._events) this._events = {};

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);

        if (!this._events[type])
          // Optimize the case of one listener. Don't need the extra array object.
          this._events[type] = listener;else if (isObject(this._events[type]))
          // If we've already got an array, just append.
          this._events[type].push(listener);else
          // Adding the second element, need to change to array.
          this._events[type] = [this._events[type], listener];

        // Check for listener leak
        if (isObject(this._events[type]) && !this._events[type].warned) {
          if (!isUndefined(this._maxListeners)) {
            m = this._maxListeners;
          } else {
            m = EventEmitter.defaultMaxListeners;
          }

          if (m && m > 0 && this._events[type].length > m) {
            this._events[type].warned = true;
            console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
            if (typeof console.trace === 'function') {
              // not supported in IE 10
              console.trace();
            }
          }
        }

        return this;
      };

      EventEmitter.prototype.on = EventEmitter.prototype.addListener;

      EventEmitter.prototype.once = function (type, listener) {
        if (!isFunction(listener)) throw TypeError('listener must be a function');

        var fired = false;

        function g() {
          this.removeListener(type, g);

          if (!fired) {
            fired = true;
            listener.apply(this, arguments);
          }
        }

        g.listener = listener;
        this.on(type, g);

        return this;
      };

      // emits a 'removeListener' event iff the listener was removed
      EventEmitter.prototype.removeListener = function (type, listener) {
        var list, position, length, i;

        if (!isFunction(listener)) throw TypeError('listener must be a function');

        if (!this._events || !this._events[type]) return this;

        list = this._events[type];
        length = list.length;
        position = -1;

        if (list === listener || isFunction(list.listener) && list.listener === listener) {
          delete this._events[type];
          if (this._events.removeListener) this.emit('removeListener', type, listener);
        } else if (isObject(list)) {
          for (i = length; i-- > 0;) {
            if (list[i] === listener || list[i].listener && list[i].listener === listener) {
              position = i;
              break;
            }
          }

          if (position < 0) return this;

          if (list.length === 1) {
            list.length = 0;
            delete this._events[type];
          } else {
            list.splice(position, 1);
          }

          if (this._events.removeListener) this.emit('removeListener', type, listener);
        }

        return this;
      };

      EventEmitter.prototype.removeAllListeners = function (type) {
        var key, listeners;

        if (!this._events) return this;

        // not listening for removeListener, no need to emit
        if (!this._events.removeListener) {
          if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          for (key in this._events) {
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = {};
          return this;
        }

        listeners = this._events[type];

        if (isFunction(listeners)) {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          while (listeners.length) {
            this.removeListener(type, listeners[listeners.length - 1]);
          }
        }
        delete this._events[type];

        return this;
      };

      EventEmitter.prototype.listeners = function (type) {
        var ret;
        if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
        return ret;
      };

      EventEmitter.prototype.listenerCount = function (type) {
        if (this._events) {
          var evlistener = this._events[type];

          if (isFunction(evlistener)) return 1;else if (evlistener) return evlistener.length;
        }
        return 0;
      };

      EventEmitter.listenerCount = function (emitter, type) {
        return emitter.listenerCount(type);
      };

      function isFunction(arg) {
        return typeof arg === 'function';
      }

      function isNumber(arg) {
        return typeof arg === 'number';
      }

      function isObject(arg) {
        return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg !== null;
      }

      function isUndefined(arg) {
        return arg === void 0;
      }
    }, {}], 35: [function (require, module, exports) {
      exports.read = function (buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];

        i += d;

        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };

      exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;

        value = Math.abs(value);

        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }

          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }

        for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

        buffer[offset + i - d] |= s * 128;
      };
    }, {}], 36: [function (require, module, exports) {
      if (typeof Object.create === 'function') {
        // implementation from standard node.js 'util' module
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        };
      } else {
        // old school shim for old browsers
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function TempCtor() {};
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        };
      }
    }, {}], 37: [function (require, module, exports) {
      /**
       * Determine if an object is Buffer
       *
       * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
       * License:  MIT
       *
       * `npm install is-buffer`
       */

      module.exports = function (obj) {
        return !!(obj != null && (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
        obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)));
      };
    }, {}], 38: [function (require, module, exports) {
      module.exports = Array.isArray || function (arr) {
        return Object.prototype.toString.call(arr) == '[object Array]';
      };
    }, {}], 39: [function (require, module, exports) {
      (function (process) {
        'use strict';

        if (!process.version || process.version.indexOf('v0.') === 0 || process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
          module.exports = nextTick;
        } else {
          module.exports = process.nextTick;
        }

        function nextTick(fn) {
          var args = new Array(arguments.length - 1);
          var i = 0;
          while (i < args.length) {
            args[i++] = arguments[i];
          }
          process.nextTick(function afterTick() {
            fn.apply(null, args);
          });
        }
      }).call(this, require('_process'));
    }, { "_process": 40 }], 40: [function (require, module, exports) {
      // shim for using process in browser

      var process = module.exports = {};
      var queue = [];
      var draining = false;
      var currentQueue;
      var queueIndex = -1;

      function cleanUpNextTick() {
        draining = false;
        if (currentQueue.length) {
          queue = currentQueue.concat(queue);
        } else {
          queueIndex = -1;
        }
        if (queue.length) {
          drainQueue();
        }
      }

      function drainQueue() {
        if (draining) {
          return;
        }
        var timeout = setTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while (len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
            if (currentQueue) {
              currentQueue[queueIndex].run();
            }
          }
          queueIndex = -1;
          len = queue.length;
        }
        currentQueue = null;
        draining = false;
        clearTimeout(timeout);
      }

      process.nextTick = function (fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
          }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
          setTimeout(drainQueue, 0);
        }
      };

      // v8 likes predictible objects
      function Item(fun, array) {
        this.fun = fun;
        this.array = array;
      }
      Item.prototype.run = function () {
        this.fun.apply(null, this.array);
      };
      process.title = 'browser';
      process.browser = true;
      process.env = {};
      process.argv = [];
      process.version = ''; // empty string to avoid regexp issues
      process.versions = {};

      function noop() {}

      process.on = noop;
      process.addListener = noop;
      process.once = noop;
      process.off = noop;
      process.removeListener = noop;
      process.removeAllListeners = noop;
      process.emit = noop;

      process.binding = function (name) {
        throw new Error('process.binding is not supported');
      };

      process.cwd = function () {
        return '/';
      };
      process.chdir = function (dir) {
        throw new Error('process.chdir is not supported');
      };
      process.umask = function () {
        return 0;
      };
    }, {}], 41: [function (require, module, exports) {
      module.exports = require("./lib/_stream_duplex.js");
    }, { "./lib/_stream_duplex.js": 42 }], 42: [function (require, module, exports) {
      // a duplex stream is just a stream that is both readable and writable.
      // Since JS doesn't have multiple prototypal inheritance, this class
      // prototypally inherits from Readable, and then parasitically from
      // Writable.

      /*<replacement>*/
      var objectKeys = Object.keys || function (obj) {
        var keys = [];
        for (var key in obj) {
          keys.push(key);
        }return keys;
      };
      /*</replacement>*/

      module.exports = Duplex;

      /*<replacement>*/
      var processNextTick = require('process-nextick-args');
      /*</replacement>*/

      /*<replacement>*/
      var util = require('core-util-is');
      util.inherits = require('inherits');
      /*</replacement>*/

      var Readable = require('./_stream_readable');
      var Writable = require('./_stream_writable');

      util.inherits(Duplex, Readable);

      var keys = objectKeys(Writable.prototype);
      for (var v = 0; v < keys.length; v++) {
        var method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }

      function Duplex(options) {
        if (!(this instanceof Duplex)) return new Duplex(options);

        Readable.call(this, options);
        Writable.call(this, options);

        if (options && options.readable === false) this.readable = false;

        if (options && options.writable === false) this.writable = false;

        this.allowHalfOpen = true;
        if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

        this.once('end', onend);
      }

      // the no-half-open enforcer
      function onend() {
        // if we allow half-open state, or if the writable side ended,
        // then we're ok.
        if (this.allowHalfOpen || this._writableState.ended) return;

        // no more data can be written.
        // But allow more writes to happen in this tick.
        processNextTick(onEndNT, this);
      }

      function onEndNT(self) {
        self.end();
      }

      function forEach(xs, f) {
        for (var i = 0, l = xs.length; i < l; i++) {
          f(xs[i], i);
        }
      }
    }, { "./_stream_readable": 44, "./_stream_writable": 46, "core-util-is": 33, "inherits": 36, "process-nextick-args": 39 }], 43: [function (require, module, exports) {
      // a passthrough stream.
      // basically just the most minimal sort of Transform stream.
      // Every written chunk gets output as-is.

      module.exports = PassThrough;

      var Transform = require('./_stream_transform');

      /*<replacement>*/
      var util = require('core-util-is');
      util.inherits = require('inherits');
      /*</replacement>*/

      util.inherits(PassThrough, Transform);

      function PassThrough(options) {
        if (!(this instanceof PassThrough)) return new PassThrough(options);

        Transform.call(this, options);
      }

      PassThrough.prototype._transform = function (chunk, encoding, cb) {
        cb(null, chunk);
      };
    }, { "./_stream_transform": 45, "core-util-is": 33, "inherits": 36 }], 44: [function (require, module, exports) {
      (function (process) {
        'use strict';

        module.exports = Readable;

        /*<replacement>*/
        var processNextTick = require('process-nextick-args');
        /*</replacement>*/

        /*<replacement>*/
        var isArray = require('isarray');
        /*</replacement>*/

        /*<replacement>*/
        var Buffer = require('buffer').Buffer;
        /*</replacement>*/

        Readable.ReadableState = ReadableState;

        var EE = require('events');

        /*<replacement>*/
        var EElistenerCount = function EElistenerCount(emitter, type) {
          return emitter.listeners(type).length;
        };
        /*</replacement>*/

        /*<replacement>*/
        var Stream;
        (function () {
          try {
            Stream = require('st' + 'ream');
          } catch (_) {} finally {
            if (!Stream) Stream = require('events').EventEmitter;
          }
        })();
        /*</replacement>*/

        var Buffer = require('buffer').Buffer;

        /*<replacement>*/
        var util = require('core-util-is');
        util.inherits = require('inherits');
        /*</replacement>*/

        /*<replacement>*/
        var debugUtil = require('util');
        var debug;
        if (debugUtil && debugUtil.debuglog) {
          debug = debugUtil.debuglog('stream');
        } else {
          debug = function debug() {};
        }
        /*</replacement>*/

        var StringDecoder;

        util.inherits(Readable, Stream);

        var Duplex;
        function ReadableState(options, stream) {
          Duplex = Duplex || require('./_stream_duplex');

          options = options || {};

          // object stream flag. Used to make read(n) ignore n and to
          // make all the buffer merging and length checks go away
          this.objectMode = !!options.objectMode;

          if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

          // the point at which it stops calling _read() to fill the buffer
          // Note: 0 is a valid value, means "don't call _read preemptively ever"
          var hwm = options.highWaterMark;
          var defaultHwm = this.objectMode ? 16 : 16 * 1024;
          this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

          // cast to ints.
          this.highWaterMark = ~ ~this.highWaterMark;

          this.buffer = [];
          this.length = 0;
          this.pipes = null;
          this.pipesCount = 0;
          this.flowing = null;
          this.ended = false;
          this.endEmitted = false;
          this.reading = false;

          // a flag to be able to tell if the onwrite cb is called immediately,
          // or on a later tick.  We set this to true at first, because any
          // actions that shouldn't happen until "later" should generally also
          // not happen before the first write call.
          this.sync = true;

          // whenever we return null, then we set a flag to say
          // that we're awaiting a 'readable' event emission.
          this.needReadable = false;
          this.emittedReadable = false;
          this.readableListening = false;

          // Crypto is kind of old and crusty.  Historically, its default string
          // encoding is 'binary' so we have to make this configurable.
          // Everything else in the universe uses 'utf8', though.
          this.defaultEncoding = options.defaultEncoding || 'utf8';

          // when piping, we only care about 'readable' events that happen
          // after read()ing all the bytes and not getting any pushback.
          this.ranOut = false;

          // the number of writers that are awaiting a drain event in .pipe()s
          this.awaitDrain = 0;

          // if true, a maybeReadMore has been scheduled
          this.readingMore = false;

          this.decoder = null;
          this.encoding = null;
          if (options.encoding) {
            if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
            this.decoder = new StringDecoder(options.encoding);
            this.encoding = options.encoding;
          }
        }

        var Duplex;
        function Readable(options) {
          Duplex = Duplex || require('./_stream_duplex');

          if (!(this instanceof Readable)) return new Readable(options);

          this._readableState = new ReadableState(options, this);

          // legacy
          this.readable = true;

          if (options && typeof options.read === 'function') this._read = options.read;

          Stream.call(this);
        }

        // Manually shove something into the read() buffer.
        // This returns true if the highWaterMark has not been hit yet,
        // similar to how Writable.write() returns true if you should
        // write() some more.
        Readable.prototype.push = function (chunk, encoding) {
          var state = this._readableState;

          if (!state.objectMode && typeof chunk === 'string') {
            encoding = encoding || state.defaultEncoding;
            if (encoding !== state.encoding) {
              chunk = new Buffer(chunk, encoding);
              encoding = '';
            }
          }

          return readableAddChunk(this, state, chunk, encoding, false);
        };

        // Unshift should *always* be something directly out of read()
        Readable.prototype.unshift = function (chunk) {
          var state = this._readableState;
          return readableAddChunk(this, state, chunk, '', true);
        };

        Readable.prototype.isPaused = function () {
          return this._readableState.flowing === false;
        };

        function readableAddChunk(stream, state, chunk, encoding, addToFront) {
          var er = chunkInvalid(state, chunk);
          if (er) {
            stream.emit('error', er);
          } else if (chunk === null) {
            state.reading = false;
            onEofChunk(stream, state);
          } else if (state.objectMode || chunk && chunk.length > 0) {
            if (state.ended && !addToFront) {
              var e = new Error('stream.push() after EOF');
              stream.emit('error', e);
            } else if (state.endEmitted && addToFront) {
              var e = new Error('stream.unshift() after end event');
              stream.emit('error', e);
            } else {
              if (state.decoder && !addToFront && !encoding) chunk = state.decoder.write(chunk);

              if (!addToFront) state.reading = false;

              // if we want the data now, just emit it.
              if (state.flowing && state.length === 0 && !state.sync) {
                stream.emit('data', chunk);
                stream.read(0);
              } else {
                // update the buffer info.
                state.length += state.objectMode ? 1 : chunk.length;
                if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

                if (state.needReadable) emitReadable(stream);
              }

              maybeReadMore(stream, state);
            }
          } else if (!addToFront) {
            state.reading = false;
          }

          return needMoreData(state);
        }

        // if it's past the high water mark, we can push in some more.
        // Also, if we have no data yet, we can stand some
        // more bytes.  This is to work around cases where hwm=0,
        // such as the repl.  Also, if the push() triggered a
        // readable event, and the user called read(largeNumber) such that
        // needReadable was set, then we ought to push more, so that another
        // 'readable' event will be triggered.
        function needMoreData(state) {
          return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
        }

        // backwards compatibility.
        Readable.prototype.setEncoding = function (enc) {
          if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
          this._readableState.decoder = new StringDecoder(enc);
          this._readableState.encoding = enc;
          return this;
        };

        // Don't raise the hwm > 8MB
        var MAX_HWM = 0x800000;
        function computeNewHighWaterMark(n) {
          if (n >= MAX_HWM) {
            n = MAX_HWM;
          } else {
            // Get the next highest power of 2
            n--;
            n |= n >>> 1;
            n |= n >>> 2;
            n |= n >>> 4;
            n |= n >>> 8;
            n |= n >>> 16;
            n++;
          }
          return n;
        }

        function howMuchToRead(n, state) {
          if (state.length === 0 && state.ended) return 0;

          if (state.objectMode) return n === 0 ? 0 : 1;

          if (n === null || isNaN(n)) {
            // only flow one buffer at a time
            if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
          }

          if (n <= 0) return 0;

          // If we're asking for more than the target buffer level,
          // then raise the water mark.  Bump up to the next highest
          // power of 2, to prevent increasing it excessively in tiny
          // amounts.
          if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);

          // don't have that much.  return null, unless we've ended.
          if (n > state.length) {
            if (!state.ended) {
              state.needReadable = true;
              return 0;
            } else {
              return state.length;
            }
          }

          return n;
        }

        // you can override either this method, or the async _read(n) below.
        Readable.prototype.read = function (n) {
          debug('read', n);
          var state = this._readableState;
          var nOrig = n;

          if (typeof n !== 'number' || n > 0) state.emittedReadable = false;

          // if we're doing read(0) to trigger a readable event, but we
          // already have a bunch of data in the buffer, then just trigger
          // the 'readable' event and move on.
          if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
            debug('read: emitReadable', state.length, state.ended);
            if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
            return null;
          }

          n = howMuchToRead(n, state);

          // if we've ended, and we're now clear, then finish it up.
          if (n === 0 && state.ended) {
            if (state.length === 0) endReadable(this);
            return null;
          }

          // All the actual chunk generation logic needs to be
          // *below* the call to _read.  The reason is that in certain
          // synthetic stream cases, such as passthrough streams, _read
          // may be a completely synchronous operation which may change
          // the state of the read buffer, providing enough data when
          // before there was *not* enough.
          //
          // So, the steps are:
          // 1. Figure out what the state of things will be after we do
          // a read from the buffer.
          //
          // 2. If that resulting state will trigger a _read, then call _read.
          // Note that this may be asynchronous, or synchronous.  Yes, it is
          // deeply ugly to write APIs this way, but that still doesn't mean
          // that the Readable class should behave improperly, as streams are
          // designed to be sync/async agnostic.
          // Take note if the _read call is sync or async (ie, if the read call
          // has returned yet), so that we know whether or not it's safe to emit
          // 'readable' etc.
          //
          // 3. Actually pull the requested chunks out of the buffer and return.

          // if we need a readable event, then we need to do some reading.
          var doRead = state.needReadable;
          debug('need readable', doRead);

          // if we currently have less than the highWaterMark, then also read some
          if (state.length === 0 || state.length - n < state.highWaterMark) {
            doRead = true;
            debug('length less than watermark', doRead);
          }

          // however, if we've ended, then there's no point, and if we're already
          // reading, then it's unnecessary.
          if (state.ended || state.reading) {
            doRead = false;
            debug('reading or ended', doRead);
          }

          if (doRead) {
            debug('do read');
            state.reading = true;
            state.sync = true;
            // if the length is currently zero, then we *need* a readable event.
            if (state.length === 0) state.needReadable = true;
            // call internal read method
            this._read(state.highWaterMark);
            state.sync = false;
          }

          // If _read pushed data synchronously, then `reading` will be false,
          // and we need to re-evaluate how much data we can return to the user.
          if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

          var ret;
          if (n > 0) ret = fromList(n, state);else ret = null;

          if (ret === null) {
            state.needReadable = true;
            n = 0;
          }

          state.length -= n;

          // If we have nothing in the buffer, then we want to know
          // as soon as we *do* get something into the buffer.
          if (state.length === 0 && !state.ended) state.needReadable = true;

          // If we tried to read() past the EOF, then emit end on the next tick.
          if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

          if (ret !== null) this.emit('data', ret);

          return ret;
        };

        function chunkInvalid(state, chunk) {
          var er = null;
          if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
            er = new TypeError('Invalid non-string/buffer chunk');
          }
          return er;
        }

        function onEofChunk(stream, state) {
          if (state.ended) return;
          if (state.decoder) {
            var chunk = state.decoder.end();
            if (chunk && chunk.length) {
              state.buffer.push(chunk);
              state.length += state.objectMode ? 1 : chunk.length;
            }
          }
          state.ended = true;

          // emit 'readable' now to make sure it gets picked up.
          emitReadable(stream);
        }

        // Don't emit readable right away in sync mode, because this can trigger
        // another read() call => stack overflow.  This way, it might trigger
        // a nextTick recursion warning, but that's not so bad.
        function emitReadable(stream) {
          var state = stream._readableState;
          state.needReadable = false;
          if (!state.emittedReadable) {
            debug('emitReadable', state.flowing);
            state.emittedReadable = true;
            if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
          }
        }

        function emitReadable_(stream) {
          debug('emit readable');
          stream.emit('readable');
          flow(stream);
        }

        // at this point, the user has presumably seen the 'readable' event,
        // and called read() to consume some data.  that may have triggered
        // in turn another _read(n) call, in which case reading = true if
        // it's in progress.
        // However, if we're not ended, or reading, and the length < hwm,
        // then go ahead and try to read some more preemptively.
        function maybeReadMore(stream, state) {
          if (!state.readingMore) {
            state.readingMore = true;
            processNextTick(maybeReadMore_, stream, state);
          }
        }

        function maybeReadMore_(stream, state) {
          var len = state.length;
          while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
            debug('maybeReadMore read 0');
            stream.read(0);
            if (len === state.length)
              // didn't get any data, stop spinning.
              break;else len = state.length;
          }
          state.readingMore = false;
        }

        // abstract method.  to be overridden in specific implementation classes.
        // call cb(er, data) where data is <= n in length.
        // for virtual (non-string, non-buffer) streams, "length" is somewhat
        // arbitrary, and perhaps not very meaningful.
        Readable.prototype._read = function (n) {
          this.emit('error', new Error('not implemented'));
        };

        Readable.prototype.pipe = function (dest, pipeOpts) {
          var src = this;
          var state = this._readableState;

          switch (state.pipesCount) {
            case 0:
              state.pipes = dest;
              break;
            case 1:
              state.pipes = [state.pipes, dest];
              break;
            default:
              state.pipes.push(dest);
              break;
          }
          state.pipesCount += 1;
          debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

          var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

          var endFn = doEnd ? onend : cleanup;
          if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

          dest.on('unpipe', onunpipe);
          function onunpipe(readable) {
            debug('onunpipe');
            if (readable === src) {
              cleanup();
            }
          }

          function onend() {
            debug('onend');
            dest.end();
          }

          // when the dest drains, it reduces the awaitDrain counter
          // on the source.  This would be more elegant with a .once()
          // handler in flow(), but adding and removing repeatedly is
          // too slow.
          var ondrain = pipeOnDrain(src);
          dest.on('drain', ondrain);

          var cleanedUp = false;
          function cleanup() {
            debug('cleanup');
            // cleanup event handlers once the pipe is broken
            dest.removeListener('close', onclose);
            dest.removeListener('finish', onfinish);
            dest.removeListener('drain', ondrain);
            dest.removeListener('error', onerror);
            dest.removeListener('unpipe', onunpipe);
            src.removeListener('end', onend);
            src.removeListener('end', cleanup);
            src.removeListener('data', ondata);

            cleanedUp = true;

            // if the reader is waiting for a drain event from this
            // specific writer, then it would cause it to never start
            // flowing again.
            // So, if this is awaiting a drain, then we just call it now.
            // If we don't know, then assume that we are waiting for one.
            if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
          }

          src.on('data', ondata);
          function ondata(chunk) {
            debug('ondata');
            var ret = dest.write(chunk);
            if (false === ret) {
              // If the user unpiped during `dest.write()`, it is possible
              // to get stuck in a permanently paused state if that write
              // also returned false.
              if (state.pipesCount === 1 && state.pipes[0] === dest && src.listenerCount('data') === 1 && !cleanedUp) {
                debug('false write response, pause', src._readableState.awaitDrain);
                src._readableState.awaitDrain++;
              }
              src.pause();
            }
          }

          // if the dest has an error, then stop piping into it.
          // however, don't suppress the throwing behavior for this.
          function onerror(er) {
            debug('onerror', er);
            unpipe();
            dest.removeListener('error', onerror);
            if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
          }
          // This is a brutally ugly hack to make sure that our error handler
          // is attached before any userland ones.  NEVER DO THIS.
          if (!dest._events || !dest._events.error) dest.on('error', onerror);else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);else dest._events.error = [onerror, dest._events.error];

          // Both close and finish should trigger unpipe, but only once.
          function onclose() {
            dest.removeListener('finish', onfinish);
            unpipe();
          }
          dest.once('close', onclose);
          function onfinish() {
            debug('onfinish');
            dest.removeListener('close', onclose);
            unpipe();
          }
          dest.once('finish', onfinish);

          function unpipe() {
            debug('unpipe');
            src.unpipe(dest);
          }

          // tell the dest that it's being piped to
          dest.emit('pipe', src);

          // start the flow if it hasn't been started already.
          if (!state.flowing) {
            debug('pipe resume');
            src.resume();
          }

          return dest;
        };

        function pipeOnDrain(src) {
          return function () {
            var state = src._readableState;
            debug('pipeOnDrain', state.awaitDrain);
            if (state.awaitDrain) state.awaitDrain--;
            if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
              state.flowing = true;
              flow(src);
            }
          };
        }

        Readable.prototype.unpipe = function (dest) {
          var state = this._readableState;

          // if we're not piping anywhere, then do nothing.
          if (state.pipesCount === 0) return this;

          // just one destination.  most common case.
          if (state.pipesCount === 1) {
            // passed in one, but it's not the right one.
            if (dest && dest !== state.pipes) return this;

            if (!dest) dest = state.pipes;

            // got a match.
            state.pipes = null;
            state.pipesCount = 0;
            state.flowing = false;
            if (dest) dest.emit('unpipe', this);
            return this;
          }

          // slow case. multiple pipe destinations.

          if (!dest) {
            // remove all.
            var dests = state.pipes;
            var len = state.pipesCount;
            state.pipes = null;
            state.pipesCount = 0;
            state.flowing = false;

            for (var i = 0; i < len; i++) {
              dests[i].emit('unpipe', this);
            }return this;
          }

          // try to find the right one.
          var i = indexOf(state.pipes, dest);
          if (i === -1) return this;

          state.pipes.splice(i, 1);
          state.pipesCount -= 1;
          if (state.pipesCount === 1) state.pipes = state.pipes[0];

          dest.emit('unpipe', this);

          return this;
        };

        // set up data events if they are asked for
        // Ensure readable listeners eventually get something
        Readable.prototype.on = function (ev, fn) {
          var res = Stream.prototype.on.call(this, ev, fn);

          // If listening to data, and it has not explicitly been paused,
          // then call resume to start the flow of data on the next tick.
          if (ev === 'data' && false !== this._readableState.flowing) {
            this.resume();
          }

          if (ev === 'readable' && this.readable) {
            var state = this._readableState;
            if (!state.readableListening) {
              state.readableListening = true;
              state.emittedReadable = false;
              state.needReadable = true;
              if (!state.reading) {
                processNextTick(nReadingNextTick, this);
              } else if (state.length) {
                emitReadable(this, state);
              }
            }
          }

          return res;
        };
        Readable.prototype.addListener = Readable.prototype.on;

        function nReadingNextTick(self) {
          debug('readable nexttick read 0');
          self.read(0);
        }

        // pause() and resume() are remnants of the legacy readable stream API
        // If the user uses them, then switch into old mode.
        Readable.prototype.resume = function () {
          var state = this._readableState;
          if (!state.flowing) {
            debug('resume');
            state.flowing = true;
            resume(this, state);
          }
          return this;
        };

        function resume(stream, state) {
          if (!state.resumeScheduled) {
            state.resumeScheduled = true;
            processNextTick(resume_, stream, state);
          }
        }

        function resume_(stream, state) {
          if (!state.reading) {
            debug('resume read 0');
            stream.read(0);
          }

          state.resumeScheduled = false;
          stream.emit('resume');
          flow(stream);
          if (state.flowing && !state.reading) stream.read(0);
        }

        Readable.prototype.pause = function () {
          debug('call pause flowing=%j', this._readableState.flowing);
          if (false !== this._readableState.flowing) {
            debug('pause');
            this._readableState.flowing = false;
            this.emit('pause');
          }
          return this;
        };

        function flow(stream) {
          var state = stream._readableState;
          debug('flow', state.flowing);
          if (state.flowing) {
            do {
              var chunk = stream.read();
            } while (null !== chunk && state.flowing);
          }
        }

        // wrap an old-style stream as the async data source.
        // This is *not* part of the readable stream interface.
        // It is an ugly unfortunate mess of history.
        Readable.prototype.wrap = function (stream) {
          var state = this._readableState;
          var paused = false;

          var self = this;
          stream.on('end', function () {
            debug('wrapped end');
            if (state.decoder && !state.ended) {
              var chunk = state.decoder.end();
              if (chunk && chunk.length) self.push(chunk);
            }

            self.push(null);
          });

          stream.on('data', function (chunk) {
            debug('wrapped data');
            if (state.decoder) chunk = state.decoder.write(chunk);

            // don't skip over falsy values in objectMode
            if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

            var ret = self.push(chunk);
            if (!ret) {
              paused = true;
              stream.pause();
            }
          });

          // proxy all the other methods.
          // important when wrapping filters and duplexes.
          for (var i in stream) {
            if (this[i] === undefined && typeof stream[i] === 'function') {
              this[i] = function (method) {
                return function () {
                  return stream[method].apply(stream, arguments);
                };
              }(i);
            }
          }

          // proxy certain important events.
          var events = ['error', 'close', 'destroy', 'pause', 'resume'];
          forEach(events, function (ev) {
            stream.on(ev, self.emit.bind(self, ev));
          });

          // when we try to consume some more bytes, simply unpause the
          // underlying stream.
          self._read = function (n) {
            debug('wrapped _read', n);
            if (paused) {
              paused = false;
              stream.resume();
            }
          };

          return self;
        };

        // exposed for testing purposes only.
        Readable._fromList = fromList;

        // Pluck off n bytes from an array of buffers.
        // Length is the combined lengths of all the buffers in the list.
        function fromList(n, state) {
          var list = state.buffer;
          var length = state.length;
          var stringMode = !!state.decoder;
          var objectMode = !!state.objectMode;
          var ret;

          // nothing in the list, definitely empty.
          if (list.length === 0) return null;

          if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
            // read it all, truncate the array.
            if (stringMode) ret = list.join('');else if (list.length === 1) ret = list[0];else ret = Buffer.concat(list, length);
            list.length = 0;
          } else {
            // read just some of it.
            if (n < list[0].length) {
              // just take a part of the first list item.
              // slice is the same for buffers and strings.
              var buf = list[0];
              ret = buf.slice(0, n);
              list[0] = buf.slice(n);
            } else if (n === list[0].length) {
              // first list is a perfect match
              ret = list.shift();
            } else {
              // complex case.
              // we have enough to cover it, but it spans past the first buffer.
              if (stringMode) ret = '';else ret = new Buffer(n);

              var c = 0;
              for (var i = 0, l = list.length; i < l && c < n; i++) {
                var buf = list[0];
                var cpy = Math.min(n - c, buf.length);

                if (stringMode) ret += buf.slice(0, cpy);else buf.copy(ret, c, 0, cpy);

                if (cpy < buf.length) list[0] = buf.slice(cpy);else list.shift();

                c += cpy;
              }
            }
          }

          return ret;
        }

        function endReadable(stream) {
          var state = stream._readableState;

          // If we get here before consuming all the bytes, then that is a
          // bug in node.  Should never happen.
          if (state.length > 0) throw new Error('endReadable called on non-empty stream');

          if (!state.endEmitted) {
            state.ended = true;
            processNextTick(endReadableNT, state, stream);
          }
        }

        function endReadableNT(state, stream) {
          // Check that we didn't get one last unshift.
          if (!state.endEmitted && state.length === 0) {
            state.endEmitted = true;
            stream.readable = false;
            stream.emit('end');
          }
        }

        function forEach(xs, f) {
          for (var i = 0, l = xs.length; i < l; i++) {
            f(xs[i], i);
          }
        }

        function indexOf(xs, x) {
          for (var i = 0, l = xs.length; i < l; i++) {
            if (xs[i] === x) return i;
          }
          return -1;
        }
      }).call(this, require('_process'));
    }, { "./_stream_duplex": 42, "_process": 40, "buffer": 31, "core-util-is": 33, "events": 34, "inherits": 36, "isarray": 38, "process-nextick-args": 39, "string_decoder/": 52, "util": 30 }], 45: [function (require, module, exports) {
      // a transform stream is a readable/writable stream where you do
      // something with the data.  Sometimes it's called a "filter",
      // but that's not a great name for it, since that implies a thing where
      // some bits pass through, and others are simply ignored.  (That would
      // be a valid example of a transform, of course.)
      //
      // While the output is causally related to the input, it's not a
      // necessarily symmetric or synchronous transformation.  For example,
      // a zlib stream might take multiple plain-text writes(), and then
      // emit a single compressed chunk some time in the future.
      //
      // Here's how this works:
      //
      // The Transform stream has all the aspects of the readable and writable
      // stream classes.  When you write(chunk), that calls _write(chunk,cb)
      // internally, and returns false if there's a lot of pending writes
      // buffered up.  When you call read(), that calls _read(n) until
      // there's enough pending readable data buffered up.
      //
      // In a transform stream, the written data is placed in a buffer.  When
      // _read(n) is called, it transforms the queued up data, calling the
      // buffered _write cb's as it consumes chunks.  If consuming a single
      // written chunk would result in multiple output chunks, then the first
      // outputted bit calls the readcb, and subsequent chunks just go into
      // the read buffer, and will cause it to emit 'readable' if necessary.
      //
      // This way, back-pressure is actually determined by the reading side,
      // since _read has to be called to start processing a new chunk.  However,
      // a pathological inflate type of transform can cause excessive buffering
      // here.  For example, imagine a stream where every byte of input is
      // interpreted as an integer from 0-255, and then results in that many
      // bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
      // 1kb of data being output.  In this case, you could write a very small
      // amount of input, and end up with a very large amount of output.  In
      // such a pathological inflating mechanism, there'd be no way to tell
      // the system to stop doing the transform.  A single 4MB write could
      // cause the system to run out of memory.
      //
      // However, even in such a pathological case, only a single written chunk
      // would be consumed, and then the rest would wait (un-transformed) until
      // the results of the previous transformed chunk were consumed.

      module.exports = Transform;

      var Duplex = require('./_stream_duplex');

      /*<replacement>*/
      var util = require('core-util-is');
      util.inherits = require('inherits');
      /*</replacement>*/

      util.inherits(Transform, Duplex);

      function TransformState(stream) {
        this.afterTransform = function (er, data) {
          return afterTransform(stream, er, data);
        };

        this.needTransform = false;
        this.transforming = false;
        this.writecb = null;
        this.writechunk = null;
      }

      function afterTransform(stream, er, data) {
        var ts = stream._transformState;
        ts.transforming = false;

        var cb = ts.writecb;

        if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

        ts.writechunk = null;
        ts.writecb = null;

        if (data !== null && data !== undefined) stream.push(data);

        if (cb) cb(er);

        var rs = stream._readableState;
        rs.reading = false;
        if (rs.needReadable || rs.length < rs.highWaterMark) {
          stream._read(rs.highWaterMark);
        }
      }

      function Transform(options) {
        if (!(this instanceof Transform)) return new Transform(options);

        Duplex.call(this, options);

        this._transformState = new TransformState(this);

        // when the writable side finishes, then flush out anything remaining.
        var stream = this;

        // start out asking for a readable event once data is transformed.
        this._readableState.needReadable = true;

        // we have implemented the _read method, and done the other things
        // that Readable wants before the first _read call, so unset the
        // sync guard flag.
        this._readableState.sync = false;

        if (options) {
          if (typeof options.transform === 'function') this._transform = options.transform;

          if (typeof options.flush === 'function') this._flush = options.flush;
        }

        this.once('prefinish', function () {
          if (typeof this._flush === 'function') this._flush(function (er) {
            done(stream, er);
          });else done(stream);
        });
      }

      Transform.prototype.push = function (chunk, encoding) {
        this._transformState.needTransform = false;
        return Duplex.prototype.push.call(this, chunk, encoding);
      };

      // This is the part where you do stuff!
      // override this function in implementation classes.
      // 'chunk' is an input chunk.
      //
      // Call `push(newChunk)` to pass along transformed output
      // to the readable side.  You may call 'push' zero or more times.
      //
      // Call `cb(err)` when you are done with this chunk.  If you pass
      // an error, then that'll put the hurt on the whole operation.  If you
      // never call cb(), then you'll never get another chunk.
      Transform.prototype._transform = function (chunk, encoding, cb) {
        throw new Error('not implemented');
      };

      Transform.prototype._write = function (chunk, encoding, cb) {
        var ts = this._transformState;
        ts.writecb = cb;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;
        if (!ts.transforming) {
          var rs = this._readableState;
          if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }
      };

      // Doesn't matter what the args are here.
      // _transform does all the work.
      // That we got here means that the readable side wants more data.
      Transform.prototype._read = function (n) {
        var ts = this._transformState;

        if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
          ts.transforming = true;
          this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
        } else {
          // mark that we need a transform, so that any data that comes in
          // will get processed, now that we've asked for it.
          ts.needTransform = true;
        }
      };

      function done(stream, er) {
        if (er) return stream.emit('error', er);

        // if there's nothing in the write buffer, then that means
        // that nothing more will ever be provided
        var ws = stream._writableState;
        var ts = stream._transformState;

        if (ws.length) throw new Error('calling transform done when ws.length != 0');

        if (ts.transforming) throw new Error('calling transform done when still transforming');

        return stream.push(null);
      }
    }, { "./_stream_duplex": 42, "core-util-is": 33, "inherits": 36 }], 46: [function (require, module, exports) {
      // A bit simpler than readable streams.
      // Implement an async ._write(chunk, encoding, cb), and it'll handle all
      // the drain event emission and buffering.

      module.exports = Writable;

      /*<replacement>*/
      var processNextTick = require('process-nextick-args');
      /*</replacement>*/

      /*<replacement>*/
      var Buffer = require('buffer').Buffer;
      /*</replacement>*/

      Writable.WritableState = WritableState;

      /*<replacement>*/
      var util = require('core-util-is');
      util.inherits = require('inherits');
      /*</replacement>*/

      /*<replacement>*/
      var internalUtil = {
        deprecate: require('util-deprecate')
      };
      /*</replacement>*/

      /*<replacement>*/
      var Stream;
      (function () {
        try {
          Stream = require('st' + 'ream');
        } catch (_) {} finally {
          if (!Stream) Stream = require('events').EventEmitter;
        }
      })();
      /*</replacement>*/

      var Buffer = require('buffer').Buffer;

      util.inherits(Writable, Stream);

      function nop() {}

      function WriteReq(chunk, encoding, cb) {
        this.chunk = chunk;
        this.encoding = encoding;
        this.callback = cb;
        this.next = null;
      }

      var Duplex;
      function WritableState(options, stream) {
        Duplex = Duplex || require('./_stream_duplex');

        options = options || {};

        // object stream flag to indicate whether or not this stream
        // contains buffers or objects.
        this.objectMode = !!options.objectMode;

        if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

        // the point at which write() starts returning false
        // Note: 0 is a valid value, means that we always return false if
        // the entire buffer is not flushed immediately on write()
        var hwm = options.highWaterMark;
        var defaultHwm = this.objectMode ? 16 : 16 * 1024;
        this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

        // cast to ints.
        this.highWaterMark = ~ ~this.highWaterMark;

        this.needDrain = false;
        // at the start of calling end()
        this.ending = false;
        // when end() has been called, and returned
        this.ended = false;
        // when 'finish' is emitted
        this.finished = false;

        // should we decode strings into buffers before passing to _write?
        // this is here so that some node-core streams can optimize string
        // handling at a lower level.
        var noDecode = options.decodeStrings === false;
        this.decodeStrings = !noDecode;

        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = options.defaultEncoding || 'utf8';

        // not an actual buffer we keep track of, but a measurement
        // of how much we're waiting to get pushed to some underlying
        // socket or file.
        this.length = 0;

        // a flag to see when we're in the middle of a write.
        this.writing = false;

        // when true all writes will be buffered until .uncork() call
        this.corked = 0;

        // a flag to be able to tell if the onwrite cb is called immediately,
        // or on a later tick.  We set this to true at first, because any
        // actions that shouldn't happen until "later" should generally also
        // not happen before the first write call.
        this.sync = true;

        // a flag to know if we're processing previously buffered items, which
        // may call the _write() callback in the same tick, so that we don't
        // end up in an overlapped onwrite situation.
        this.bufferProcessing = false;

        // the callback that's passed to _write(chunk,cb)
        this.onwrite = function (er) {
          onwrite(stream, er);
        };

        // the callback that the user supplies to write(chunk,encoding,cb)
        this.writecb = null;

        // the amount that is being written when _write is called.
        this.writelen = 0;

        this.bufferedRequest = null;
        this.lastBufferedRequest = null;

        // number of pending user-supplied write callbacks
        // this must be 0 before 'finish' can be emitted
        this.pendingcb = 0;

        // emit prefinish if the only thing we're waiting for is _write cbs
        // This is relevant for synchronous Transform streams
        this.prefinished = false;

        // True if the error was already emitted and should not be thrown again
        this.errorEmitted = false;
      }

      WritableState.prototype.getBuffer = function writableStateGetBuffer() {
        var current = this.bufferedRequest;
        var out = [];
        while (current) {
          out.push(current);
          current = current.next;
        }
        return out;
      };

      (function () {
        try {
          Object.defineProperty(WritableState.prototype, 'buffer', {
            get: internalUtil.deprecate(function () {
              return this.getBuffer();
            }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
          });
        } catch (_) {}
      })();

      var Duplex;
      function Writable(options) {
        Duplex = Duplex || require('./_stream_duplex');

        // Writable ctor is applied to Duplexes, though they're not
        // instanceof Writable, they're instanceof Readable.
        if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

        this._writableState = new WritableState(options, this);

        // legacy.
        this.writable = true;

        if (options) {
          if (typeof options.write === 'function') this._write = options.write;

          if (typeof options.writev === 'function') this._writev = options.writev;
        }

        Stream.call(this);
      }

      // Otherwise people can pipe Writable streams, which is just wrong.
      Writable.prototype.pipe = function () {
        this.emit('error', new Error('Cannot pipe. Not readable.'));
      };

      function writeAfterEnd(stream, cb) {
        var er = new Error('write after end');
        // TODO: defer error events consistently everywhere, not just the cb
        stream.emit('error', er);
        processNextTick(cb, er);
      }

      // If we get something that is not a buffer, string, null, or undefined,
      // and we're not in objectMode, then that's an error.
      // Otherwise stream chunks are all considered to be of length=1, and the
      // watermarks determine how many objects to keep in the buffer, rather than
      // how many bytes or characters.
      function validChunk(stream, state, chunk, cb) {
        var valid = true;

        if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
          var er = new TypeError('Invalid non-string/buffer chunk');
          stream.emit('error', er);
          processNextTick(cb, er);
          valid = false;
        }
        return valid;
      }

      Writable.prototype.write = function (chunk, encoding, cb) {
        var state = this._writableState;
        var ret = false;

        if (typeof encoding === 'function') {
          cb = encoding;
          encoding = null;
        }

        if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

        if (typeof cb !== 'function') cb = nop;

        if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
          state.pendingcb++;
          ret = writeOrBuffer(this, state, chunk, encoding, cb);
        }

        return ret;
      };

      Writable.prototype.cork = function () {
        var state = this._writableState;

        state.corked++;
      };

      Writable.prototype.uncork = function () {
        var state = this._writableState;

        if (state.corked) {
          state.corked--;

          if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
        }
      };

      Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
        // node::ParseEncoding() requires lower case.
        if (typeof encoding === 'string') encoding = encoding.toLowerCase();
        if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
        this._writableState.defaultEncoding = encoding;
      };

      function decodeChunk(state, chunk, encoding) {
        if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
          chunk = new Buffer(chunk, encoding);
        }
        return chunk;
      }

      // if we're already writing something, then just put this
      // in the queue, and wait our turn.  Otherwise, call _write
      // If we return false, then we need a drain event, so set that flag.
      function writeOrBuffer(stream, state, chunk, encoding, cb) {
        chunk = decodeChunk(state, chunk, encoding);

        if (Buffer.isBuffer(chunk)) encoding = 'buffer';
        var len = state.objectMode ? 1 : chunk.length;

        state.length += len;

        var ret = state.length < state.highWaterMark;
        // we must ensure that previous needDrain will not be reset to false.
        if (!ret) state.needDrain = true;

        if (state.writing || state.corked) {
          var last = state.lastBufferedRequest;
          state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
          if (last) {
            last.next = state.lastBufferedRequest;
          } else {
            state.bufferedRequest = state.lastBufferedRequest;
          }
        } else {
          doWrite(stream, state, false, len, chunk, encoding, cb);
        }

        return ret;
      }

      function doWrite(stream, state, writev, len, chunk, encoding, cb) {
        state.writelen = len;
        state.writecb = cb;
        state.writing = true;
        state.sync = true;
        if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
        state.sync = false;
      }

      function onwriteError(stream, state, sync, er, cb) {
        --state.pendingcb;
        if (sync) processNextTick(cb, er);else cb(er);

        stream._writableState.errorEmitted = true;
        stream.emit('error', er);
      }

      function onwriteStateUpdate(state) {
        state.writing = false;
        state.writecb = null;
        state.length -= state.writelen;
        state.writelen = 0;
      }

      function onwrite(stream, er) {
        var state = stream._writableState;
        var sync = state.sync;
        var cb = state.writecb;

        onwriteStateUpdate(state);

        if (er) onwriteError(stream, state, sync, er, cb);else {
          // Check if we're actually ready to finish, but don't emit yet
          var finished = needFinish(state);

          if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
            clearBuffer(stream, state);
          }

          if (sync) {
            processNextTick(afterWrite, stream, state, finished, cb);
          } else {
            afterWrite(stream, state, finished, cb);
          }
        }
      }

      function afterWrite(stream, state, finished, cb) {
        if (!finished) onwriteDrain(stream, state);
        state.pendingcb--;
        cb();
        finishMaybe(stream, state);
      }

      // Must force callback to be called on nextTick, so that we don't
      // emit 'drain' before the write() consumer gets the 'false' return
      // value, and has a chance to attach a 'drain' listener.
      function onwriteDrain(stream, state) {
        if (state.length === 0 && state.needDrain) {
          state.needDrain = false;
          stream.emit('drain');
        }
      }

      // if there's something in the buffer waiting, then process it
      function clearBuffer(stream, state) {
        state.bufferProcessing = true;
        var entry = state.bufferedRequest;

        if (stream._writev && entry && entry.next) {
          // Fast case, write everything using _writev()
          var buffer = [];
          var cbs = [];
          while (entry) {
            cbs.push(entry.callback);
            buffer.push(entry);
            entry = entry.next;
          }

          // count the one we are adding, as well.
          // TODO(isaacs) clean this up
          state.pendingcb++;
          state.lastBufferedRequest = null;
          doWrite(stream, state, true, state.length, buffer, '', function (err) {
            for (var i = 0; i < cbs.length; i++) {
              state.pendingcb--;
              cbs[i](err);
            }
          });

          // Clear buffer
        } else {
            // Slow case, write chunks one-by-one
            while (entry) {
              var chunk = entry.chunk;
              var encoding = entry.encoding;
              var cb = entry.callback;
              var len = state.objectMode ? 1 : chunk.length;

              doWrite(stream, state, false, len, chunk, encoding, cb);
              entry = entry.next;
              // if we didn't call the onwrite immediately, then
              // it means that we need to wait until it does.
              // also, that means that the chunk and cb are currently
              // being processed, so move the buffer counter past them.
              if (state.writing) {
                break;
              }
            }

            if (entry === null) state.lastBufferedRequest = null;
          }
        state.bufferedRequest = entry;
        state.bufferProcessing = false;
      }

      Writable.prototype._write = function (chunk, encoding, cb) {
        cb(new Error('not implemented'));
      };

      Writable.prototype._writev = null;

      Writable.prototype.end = function (chunk, encoding, cb) {
        var state = this._writableState;

        if (typeof chunk === 'function') {
          cb = chunk;
          chunk = null;
          encoding = null;
        } else if (typeof encoding === 'function') {
          cb = encoding;
          encoding = null;
        }

        if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

        // .end() fully uncorks
        if (state.corked) {
          state.corked = 1;
          this.uncork();
        }

        // ignore unnecessary end() calls.
        if (!state.ending && !state.finished) endWritable(this, state, cb);
      };

      function needFinish(state) {
        return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
      }

      function prefinish(stream, state) {
        if (!state.prefinished) {
          state.prefinished = true;
          stream.emit('prefinish');
        }
      }

      function finishMaybe(stream, state) {
        var need = needFinish(state);
        if (need) {
          if (state.pendingcb === 0) {
            prefinish(stream, state);
            state.finished = true;
            stream.emit('finish');
          } else {
            prefinish(stream, state);
          }
        }
        return need;
      }

      function endWritable(stream, state, cb) {
        state.ending = true;
        finishMaybe(stream, state);
        if (cb) {
          if (state.finished) processNextTick(cb);else stream.once('finish', cb);
        }
        state.ended = true;
      }
    }, { "./_stream_duplex": 42, "buffer": 31, "core-util-is": 33, "events": 34, "inherits": 36, "process-nextick-args": 39, "util-deprecate": 53 }], 47: [function (require, module, exports) {
      module.exports = require("./lib/_stream_passthrough.js");
    }, { "./lib/_stream_passthrough.js": 43 }], 48: [function (require, module, exports) {
      var Stream = function () {
        try {
          return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
        } catch (_) {}
      }();
      exports = module.exports = require('./lib/_stream_readable.js');
      exports.Stream = Stream || exports;
      exports.Readable = exports;
      exports.Writable = require('./lib/_stream_writable.js');
      exports.Duplex = require('./lib/_stream_duplex.js');
      exports.Transform = require('./lib/_stream_transform.js');
      exports.PassThrough = require('./lib/_stream_passthrough.js');
    }, { "./lib/_stream_duplex.js": 42, "./lib/_stream_passthrough.js": 43, "./lib/_stream_readable.js": 44, "./lib/_stream_transform.js": 45, "./lib/_stream_writable.js": 46 }], 49: [function (require, module, exports) {
      module.exports = require("./lib/_stream_transform.js");
    }, { "./lib/_stream_transform.js": 45 }], 50: [function (require, module, exports) {
      module.exports = require("./lib/_stream_writable.js");
    }, { "./lib/_stream_writable.js": 46 }], 51: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      module.exports = Stream;

      var EE = require('events').EventEmitter;
      var inherits = require('inherits');

      inherits(Stream, EE);
      Stream.Readable = require('readable-stream/readable.js');
      Stream.Writable = require('readable-stream/writable.js');
      Stream.Duplex = require('readable-stream/duplex.js');
      Stream.Transform = require('readable-stream/transform.js');
      Stream.PassThrough = require('readable-stream/passthrough.js');

      // Backwards-compat with node 0.4.x
      Stream.Stream = Stream;

      // old-style streams.  Note that the pipe method (the only relevant
      // part of this class) is overridden in the Readable class.

      function Stream() {
        EE.call(this);
      }

      Stream.prototype.pipe = function (dest, options) {
        var source = this;

        function ondata(chunk) {
          if (dest.writable) {
            if (false === dest.write(chunk) && source.pause) {
              source.pause();
            }
          }
        }

        source.on('data', ondata);

        function ondrain() {
          if (source.readable && source.resume) {
            source.resume();
          }
        }

        dest.on('drain', ondrain);

        // If the 'end' option is not supplied, dest.end() will be called when
        // source gets the 'end' or 'close' events.  Only dest.end() once.
        if (!dest._isStdio && (!options || options.end !== false)) {
          source.on('end', onend);
          source.on('close', onclose);
        }

        var didOnEnd = false;
        function onend() {
          if (didOnEnd) return;
          didOnEnd = true;

          dest.end();
        }

        function onclose() {
          if (didOnEnd) return;
          didOnEnd = true;

          if (typeof dest.destroy === 'function') dest.destroy();
        }

        // don't leave dangling pipes when there are errors.
        function onerror(er) {
          cleanup();
          if (EE.listenerCount(this, 'error') === 0) {
            throw er; // Unhandled stream error in pipe.
          }
        }

        source.on('error', onerror);
        dest.on('error', onerror);

        // remove all the event listeners that were added.
        function cleanup() {
          source.removeListener('data', ondata);
          dest.removeListener('drain', ondrain);

          source.removeListener('end', onend);
          source.removeListener('close', onclose);

          source.removeListener('error', onerror);
          dest.removeListener('error', onerror);

          source.removeListener('end', cleanup);
          source.removeListener('close', cleanup);

          dest.removeListener('close', cleanup);
        }

        source.on('end', cleanup);
        source.on('close', cleanup);

        dest.on('close', cleanup);

        dest.emit('pipe', source);

        // Allow for unix-like usage: A.pipe(B).pipe(C)
        return dest;
      };
    }, { "events": 34, "inherits": 36, "readable-stream/duplex.js": 41, "readable-stream/passthrough.js": 47, "readable-stream/readable.js": 48, "readable-stream/transform.js": 49, "readable-stream/writable.js": 50 }], 52: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      var Buffer = require('buffer').Buffer;

      var isBufferEncoding = Buffer.isEncoding || function (encoding) {
        switch (encoding && encoding.toLowerCase()) {
          case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
            return true;
          default:
            return false;
        }
      };

      function assertEncoding(encoding) {
        if (encoding && !isBufferEncoding(encoding)) {
          throw new Error('Unknown encoding: ' + encoding);
        }
      }

      // StringDecoder provides an interface for efficiently splitting a series of
      // buffers into a series of JS strings without breaking apart multi-byte
      // characters. CESU-8 is handled as part of the UTF-8 encoding.
      //
      // @TODO Handling all encodings inside a single object makes it very difficult
      // to reason about this code, so it should be split up in the future.
      // @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
      // points as used by CESU-8.
      var StringDecoder = exports.StringDecoder = function (encoding) {
        this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
        assertEncoding(encoding);
        switch (this.encoding) {
          case 'utf8':
            // CESU-8 represents each of Surrogate Pair by 3-bytes
            this.surrogateSize = 3;
            break;
          case 'ucs2':
          case 'utf16le':
            // UTF-16 represents each of Surrogate Pair by 2-bytes
            this.surrogateSize = 2;
            this.detectIncompleteChar = utf16DetectIncompleteChar;
            break;
          case 'base64':
            // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
            this.surrogateSize = 3;
            this.detectIncompleteChar = base64DetectIncompleteChar;
            break;
          default:
            this.write = passThroughWrite;
            return;
        }

        // Enough space to store all bytes of a single character. UTF-8 needs 4
        // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
        this.charBuffer = new Buffer(6);
        // Number of bytes received for the current incomplete multi-byte character.
        this.charReceived = 0;
        // Number of bytes expected for the current incomplete multi-byte character.
        this.charLength = 0;
      };

      // write decodes the given buffer and returns it as JS string that is
      // guaranteed to not contain any partial multi-byte characters. Any partial
      // character found at the end of the buffer is buffered up, and will be
      // returned when calling write again with the remaining bytes.
      //
      // Note: Converting a Buffer containing an orphan surrogate to a String
      // currently works, but converting a String to a Buffer (via `new Buffer`, or
      // Buffer#write) will replace incomplete surrogates with the unicode
      // replacement character. See https://codereview.chromium.org/121173009/ .
      StringDecoder.prototype.write = function (buffer) {
        var charStr = '';
        // if our last write ended with an incomplete multibyte character
        while (this.charLength) {
          // determine how many remaining bytes this buffer has to offer for this char
          var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length;

          // add the new bytes to the char buffer
          buffer.copy(this.charBuffer, this.charReceived, 0, available);
          this.charReceived += available;

          if (this.charReceived < this.charLength) {
            // still not enough chars in this buffer? wait for more ...
            return '';
          }

          // remove bytes belonging to the current character from the buffer
          buffer = buffer.slice(available, buffer.length);

          // get the character that was split
          charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

          // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
          var charCode = charStr.charCodeAt(charStr.length - 1);
          if (charCode >= 0xD800 && charCode <= 0xDBFF) {
            this.charLength += this.surrogateSize;
            charStr = '';
            continue;
          }
          this.charReceived = this.charLength = 0;

          // if there are no more bytes in this buffer, just emit our char
          if (buffer.length === 0) {
            return charStr;
          }
          break;
        }

        // determine and set charLength / charReceived
        this.detectIncompleteChar(buffer);

        var end = buffer.length;
        if (this.charLength) {
          // buffer the incomplete character bytes we got
          buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
          end -= this.charReceived;
        }

        charStr += buffer.toString(this.encoding, 0, end);

        var end = charStr.length - 1;
        var charCode = charStr.charCodeAt(end);
        // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
        if (charCode >= 0xD800 && charCode <= 0xDBFF) {
          var size = this.surrogateSize;
          this.charLength += size;
          this.charReceived += size;
          this.charBuffer.copy(this.charBuffer, size, 0, size);
          buffer.copy(this.charBuffer, 0, 0, size);
          return charStr.substring(0, end);
        }

        // or just emit the charStr
        return charStr;
      };

      // detectIncompleteChar determines if there is an incomplete UTF-8 character at
      // the end of the given buffer. If so, it sets this.charLength to the byte
      // length that character, and sets this.charReceived to the number of bytes
      // that are available for this character.
      StringDecoder.prototype.detectIncompleteChar = function (buffer) {
        // determine how many bytes we have to check at the end of this buffer
        var i = buffer.length >= 3 ? 3 : buffer.length;

        // Figure out if one of the last i bytes of our buffer announces an
        // incomplete char.
        for (; i > 0; i--) {
          var c = buffer[buffer.length - i];

          // See http://en.wikipedia.org/wiki/UTF-8#Description

          // 110XXXXX
          if (i == 1 && c >> 5 == 0x06) {
            this.charLength = 2;
            break;
          }

          // 1110XXXX
          if (i <= 2 && c >> 4 == 0x0E) {
            this.charLength = 3;
            break;
          }

          // 11110XXX
          if (i <= 3 && c >> 3 == 0x1E) {
            this.charLength = 4;
            break;
          }
        }
        this.charReceived = i;
      };

      StringDecoder.prototype.end = function (buffer) {
        var res = '';
        if (buffer && buffer.length) res = this.write(buffer);

        if (this.charReceived) {
          var cr = this.charReceived;
          var buf = this.charBuffer;
          var enc = this.encoding;
          res += buf.slice(0, cr).toString(enc);
        }

        return res;
      };

      function passThroughWrite(buffer) {
        return buffer.toString(this.encoding);
      }

      function utf16DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 2;
        this.charLength = this.charReceived ? 2 : 0;
      }

      function base64DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 3;
        this.charLength = this.charReceived ? 3 : 0;
      }
    }, { "buffer": 31 }], 53: [function (require, module, exports) {
      (function (global) {

        /**
         * Module exports.
         */

        module.exports = deprecate;

        /**
         * Mark that a method should not be used.
         * Returns a modified function which warns once by default.
         *
         * If `localStorage.noDeprecation = true` is set, then it is a no-op.
         *
         * If `localStorage.throwDeprecation = true` is set, then deprecated functions
         * will throw an Error when invoked.
         *
         * If `localStorage.traceDeprecation = true` is set, then deprecated functions
         * will invoke `console.trace()` instead of `console.error()`.
         *
         * @param {Function} fn - the function to deprecate
         * @param {String} msg - the string to print to the console when `fn` is invoked
         * @returns {Function} a new "deprecated" version of `fn`
         * @api public
         */

        function deprecate(fn, msg) {
          if (config('noDeprecation')) {
            return fn;
          }

          var warned = false;
          function deprecated() {
            if (!warned) {
              if (config('throwDeprecation')) {
                throw new Error(msg);
              } else if (config('traceDeprecation')) {
                console.trace(msg);
              } else {
                console.warn(msg);
              }
              warned = true;
            }
            return fn.apply(this, arguments);
          }

          return deprecated;
        }

        /**
         * Checks `localStorage` for boolean values for the given `name`.
         *
         * @param {String} name
         * @returns {Boolean}
         * @api private
         */

        function config(name) {
          // accessing global.localStorage can trigger a DOMException in sandboxed iframes
          try {
            if (!global.localStorage) return false;
          } catch (_) {
            return false;
          }
          var val = global.localStorage[name];
          if (null == val) return false;
          return String(val).toLowerCase() === 'true';
        }
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {}], 54: [function (require, module, exports) {
      module.exports = function isBuffer(arg) {
        return arg && (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
      };
    }, {}], 55: [function (require, module, exports) {
      (function (process, global) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.

        var formatRegExp = /%[sdj%]/g;
        exports.format = function (f) {
          if (!isString(f)) {
            var objects = [];
            for (var i = 0; i < arguments.length; i++) {
              objects.push(inspect(arguments[i]));
            }
            return objects.join(' ');
          }

          var i = 1;
          var args = arguments;
          var len = args.length;
          var str = String(f).replace(formatRegExp, function (x) {
            if (x === '%%') return '%';
            if (i >= len) return x;
            switch (x) {
              case '%s':
                return String(args[i++]);
              case '%d':
                return Number(args[i++]);
              case '%j':
                try {
                  return JSON.stringify(args[i++]);
                } catch (_) {
                  return '[Circular]';
                }
              default:
                return x;
            }
          });
          for (var x = args[i]; i < len; x = args[++i]) {
            if (isNull(x) || !isObject(x)) {
              str += ' ' + x;
            } else {
              str += ' ' + inspect(x);
            }
          }
          return str;
        };

        // Mark that a method should not be used.
        // Returns a modified function which warns once by default.
        // If --no-deprecation is set, then it is a no-op.
        exports.deprecate = function (fn, msg) {
          // Allow for deprecating things in the process of starting up.
          if (isUndefined(global.process)) {
            return function () {
              return exports.deprecate(fn, msg).apply(this, arguments);
            };
          }

          if (process.noDeprecation === true) {
            return fn;
          }

          var warned = false;
          function deprecated() {
            if (!warned) {
              if (process.throwDeprecation) {
                throw new Error(msg);
              } else if (process.traceDeprecation) {
                console.trace(msg);
              } else {
                console.error(msg);
              }
              warned = true;
            }
            return fn.apply(this, arguments);
          }

          return deprecated;
        };

        var debugs = {};
        var debugEnviron;
        exports.debuglog = function (set) {
          if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
          set = set.toUpperCase();
          if (!debugs[set]) {
            if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
              var pid = process.pid;
              debugs[set] = function () {
                var msg = exports.format.apply(exports, arguments);
                console.error('%s %d: %s', set, pid, msg);
              };
            } else {
              debugs[set] = function () {};
            }
          }
          return debugs[set];
        };

        /**
         * Echos the value of a value. Trys to print the value out
         * in the best way possible given the different types.
         *
         * @param {Object} obj The object to print out.
         * @param {Object} opts Optional options object that alters the output.
         */
        /* legacy: obj, showHidden, depth, colors*/
        function inspect(obj, opts) {
          // default options
          var ctx = {
            seen: [],
            stylize: stylizeNoColor
          };
          // legacy...
          if (arguments.length >= 3) ctx.depth = arguments[2];
          if (arguments.length >= 4) ctx.colors = arguments[3];
          if (isBoolean(opts)) {
            // legacy...
            ctx.showHidden = opts;
          } else if (opts) {
            // got an "options" object
            exports._extend(ctx, opts);
          }
          // set default options
          if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
          if (isUndefined(ctx.depth)) ctx.depth = 2;
          if (isUndefined(ctx.colors)) ctx.colors = false;
          if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
          if (ctx.colors) ctx.stylize = stylizeWithColor;
          return formatValue(ctx, obj, ctx.depth);
        }
        exports.inspect = inspect;

        // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
        inspect.colors = {
          'bold': [1, 22],
          'italic': [3, 23],
          'underline': [4, 24],
          'inverse': [7, 27],
          'white': [37, 39],
          'grey': [90, 39],
          'black': [30, 39],
          'blue': [34, 39],
          'cyan': [36, 39],
          'green': [32, 39],
          'magenta': [35, 39],
          'red': [31, 39],
          'yellow': [33, 39]
        };

        // Don't use 'blue' not visible on cmd.exe
        inspect.styles = {
          'special': 'cyan',
          'number': 'yellow',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red'
        };

        function stylizeWithColor(str, styleType) {
          var style = inspect.styles[styleType];

          if (style) {
            return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
          } else {
            return str;
          }
        }

        function stylizeNoColor(str, styleType) {
          return str;
        }

        function arrayToHash(array) {
          var hash = {};

          array.forEach(function (val, idx) {
            hash[val] = true;
          });

          return hash;
        }

        function formatValue(ctx, value, recurseTimes) {
          // Provide a hook for user-specified inspect functions.
          // Check that value is an object with an inspect function on it
          if (ctx.customInspect && value && isFunction(value.inspect) &&
          // Filter out the util module, it's inspect function is special
          value.inspect !== exports.inspect &&
          // Also filter out any prototype objects using the circular check.
          !(value.constructor && value.constructor.prototype === value)) {
            var ret = value.inspect(recurseTimes, ctx);
            if (!isString(ret)) {
              ret = formatValue(ctx, ret, recurseTimes);
            }
            return ret;
          }

          // Primitive types cannot have properties
          var primitive = formatPrimitive(ctx, value);
          if (primitive) {
            return primitive;
          }

          // Look up the keys of the object.
          var keys = Object.keys(value);
          var visibleKeys = arrayToHash(keys);

          if (ctx.showHidden) {
            keys = Object.getOwnPropertyNames(value);
          }

          // IE doesn't make error fields non-enumerable
          // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
          if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
            return formatError(value);
          }

          // Some type of object without properties can be shortcutted.
          if (keys.length === 0) {
            if (isFunction(value)) {
              var name = value.name ? ': ' + value.name : '';
              return ctx.stylize('[Function' + name + ']', 'special');
            }
            if (isRegExp(value)) {
              return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
            }
            if (isDate(value)) {
              return ctx.stylize(Date.prototype.toString.call(value), 'date');
            }
            if (isError(value)) {
              return formatError(value);
            }
          }

          var base = '',
              array = false,
              braces = ['{', '}'];

          // Make Array say that they are Array
          if (isArray(value)) {
            array = true;
            braces = ['[', ']'];
          }

          // Make functions say that they are functions
          if (isFunction(value)) {
            var n = value.name ? ': ' + value.name : '';
            base = ' [Function' + n + ']';
          }

          // Make RegExps say that they are RegExps
          if (isRegExp(value)) {
            base = ' ' + RegExp.prototype.toString.call(value);
          }

          // Make dates with properties first say the date
          if (isDate(value)) {
            base = ' ' + Date.prototype.toUTCString.call(value);
          }

          // Make error with message first say the error
          if (isError(value)) {
            base = ' ' + formatError(value);
          }

          if (keys.length === 0 && (!array || value.length == 0)) {
            return braces[0] + base + braces[1];
          }

          if (recurseTimes < 0) {
            if (isRegExp(value)) {
              return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
            } else {
              return ctx.stylize('[Object]', 'special');
            }
          }

          ctx.seen.push(value);

          var output;
          if (array) {
            output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
          } else {
            output = keys.map(function (key) {
              return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
            });
          }

          ctx.seen.pop();

          return reduceToSingleString(output, base, braces);
        }

        function formatPrimitive(ctx, value) {
          if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
          if (isString(value)) {
            var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
            return ctx.stylize(simple, 'string');
          }
          if (isNumber(value)) return ctx.stylize('' + value, 'number');
          if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
          // For some reason typeof null is "object", so special case here.
          if (isNull(value)) return ctx.stylize('null', 'null');
        }

        function formatError(value) {
          return '[' + Error.prototype.toString.call(value) + ']';
        }

        function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
          var output = [];
          for (var i = 0, l = value.length; i < l; ++i) {
            if (hasOwnProperty(value, String(i))) {
              output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
            } else {
              output.push('');
            }
          }
          keys.forEach(function (key) {
            if (!key.match(/^\d+$/)) {
              output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
            }
          });
          return output;
        }

        function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
          var name, str, desc;
          desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
          if (desc.get) {
            if (desc.set) {
              str = ctx.stylize('[Getter/Setter]', 'special');
            } else {
              str = ctx.stylize('[Getter]', 'special');
            }
          } else {
            if (desc.set) {
              str = ctx.stylize('[Setter]', 'special');
            }
          }
          if (!hasOwnProperty(visibleKeys, key)) {
            name = '[' + key + ']';
          }
          if (!str) {
            if (ctx.seen.indexOf(desc.value) < 0) {
              if (isNull(recurseTimes)) {
                str = formatValue(ctx, desc.value, null);
              } else {
                str = formatValue(ctx, desc.value, recurseTimes - 1);
              }
              if (str.indexOf('\n') > -1) {
                if (array) {
                  str = str.split('\n').map(function (line) {
                    return '  ' + line;
                  }).join('\n').substr(2);
                } else {
                  str = '\n' + str.split('\n').map(function (line) {
                    return '   ' + line;
                  }).join('\n');
                }
              }
            } else {
              str = ctx.stylize('[Circular]', 'special');
            }
          }
          if (isUndefined(name)) {
            if (array && key.match(/^\d+$/)) {
              return str;
            }
            name = JSON.stringify('' + key);
            if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
              name = name.substr(1, name.length - 2);
              name = ctx.stylize(name, 'name');
            } else {
              name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
              name = ctx.stylize(name, 'string');
            }
          }

          return name + ': ' + str;
        }

        function reduceToSingleString(output, base, braces) {
          var numLinesEst = 0;
          var length = output.reduce(function (prev, cur) {
            numLinesEst++;
            if (cur.indexOf('\n') >= 0) numLinesEst++;
            return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
          }, 0);

          if (length > 60) {
            return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
          }

          return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
        }

        // NOTE: These type checking functions intentionally don't use `instanceof`
        // because it is fragile and can be easily faked with `Object.create()`.
        function isArray(ar) {
          return Array.isArray(ar);
        }
        exports.isArray = isArray;

        function isBoolean(arg) {
          return typeof arg === 'boolean';
        }
        exports.isBoolean = isBoolean;

        function isNull(arg) {
          return arg === null;
        }
        exports.isNull = isNull;

        function isNullOrUndefined(arg) {
          return arg == null;
        }
        exports.isNullOrUndefined = isNullOrUndefined;

        function isNumber(arg) {
          return typeof arg === 'number';
        }
        exports.isNumber = isNumber;

        function isString(arg) {
          return typeof arg === 'string';
        }
        exports.isString = isString;

        function isSymbol(arg) {
          return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol';
        }
        exports.isSymbol = isSymbol;

        function isUndefined(arg) {
          return arg === void 0;
        }
        exports.isUndefined = isUndefined;

        function isRegExp(re) {
          return isObject(re) && objectToString(re) === '[object RegExp]';
        }
        exports.isRegExp = isRegExp;

        function isObject(arg) {
          return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg !== null;
        }
        exports.isObject = isObject;

        function isDate(d) {
          return isObject(d) && objectToString(d) === '[object Date]';
        }
        exports.isDate = isDate;

        function isError(e) {
          return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
        }
        exports.isError = isError;

        function isFunction(arg) {
          return typeof arg === 'function';
        }
        exports.isFunction = isFunction;

        function isPrimitive(arg) {
          return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol' || // ES6 symbol
          typeof arg === 'undefined';
        }
        exports.isPrimitive = isPrimitive;

        exports.isBuffer = require('./support/isBuffer');

        function objectToString(o) {
          return Object.prototype.toString.call(o);
        }

        function pad(n) {
          return n < 10 ? '0' + n.toString(10) : n.toString(10);
        }

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // 26 Feb 16:19:34
        function timestamp() {
          var d = new Date();
          var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
          return [d.getDate(), months[d.getMonth()], time].join(' ');
        }

        // log is just a thin wrapper to console.log that prepends a timestamp
        exports.log = function () {
          console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
        };

        /**
         * Inherit the prototype methods from one constructor into another.
         *
         * The Function.prototype.inherits from lang.js rewritten as a standalone
         * function (not on Function.prototype). NOTE: If this file is to be loaded
         * during bootstrapping this function needs to be rewritten using some native
         * functions as prototype setup using normal JavaScript does not work as
         * expected during bootstrapping (see mirror.js in r114903).
         *
         * @param {function} ctor Constructor function which needs to inherit the
         *     prototype.
         * @param {function} superCtor Constructor function to inherit prototype from.
         */
        exports.inherits = require('inherits');

        exports._extend = function (origin, add) {
          // Don't do anything if add isn't an object
          if (!add || !isObject(add)) return origin;

          var keys = Object.keys(add);
          var i = keys.length;
          while (i--) {
            origin[keys[i]] = add[keys[i]];
          }
          return origin;
        };

        function hasOwnProperty(obj, prop) {
          return Object.prototype.hasOwnProperty.call(obj, prop);
        }
      }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, { "./support/isBuffer": 54, "_process": 40, "inherits": 36 }], "htmlparser2": [function (require, module, exports) {
      var Parser = require("./Parser.js"),
          DomHandler = require("domhandler");

      function defineProp(name, value) {
        delete module.exports[name];
        module.exports[name] = value;
        return value;
      }

      module.exports = {
        Parser: Parser,
        Tokenizer: require("./Tokenizer.js"),
        ElementType: require("domelementtype"),
        DomHandler: DomHandler,
        get FeedHandler() {
          return defineProp("FeedHandler", require("./FeedHandler.js"));
        },
        get Stream() {
          return defineProp("Stream", require("./Stream.js"));
        },
        get WritableStream() {
          return defineProp("WritableStream", require("./WritableStream.js"));
        },
        get ProxyHandler() {
          return defineProp("ProxyHandler", require("./ProxyHandler.js"));
        },
        get DomUtils() {
          return defineProp("DomUtils", require("domutils"));
        },
        get CollectingHandler() {
          return defineProp("CollectingHandler", require("./CollectingHandler.js"));
        },
        // For legacy support
        DefaultHandler: DomHandler,
        get RssHandler() {
          return defineProp("RssHandler", this.FeedHandler);
        },
        //helper methods
        parseDOM: function parseDOM(data, options) {
          var handler = new DomHandler(options);
          new Parser(handler, options).end(data);
          return handler.dom;
        },
        parseFeed: function parseFeed(feed, options) {
          var handler = new module.exports.FeedHandler(options);
          new Parser(handler, options).end(feed);
          return handler.dom;
        },
        createDomStream: function createDomStream(cb, options, elementCb) {
          var handler = new DomHandler(cb, options, elementCb);
          return new Parser(handler, options);
        },
        // List of all events that the parser emits
        EVENTS: { /* Format: eventname: number of arguments */
          attribute: 2,
          cdatastart: 0,
          cdataend: 0,
          text: 1,
          processinginstruction: 2,
          comment: 1,
          commentend: 0,
          closetag: 1,
          opentag: 2,
          opentagname: 1,
          error: 1,
          end: 0
        }
      };
    }, { "./CollectingHandler.js": 22, "./FeedHandler.js": 23, "./Parser.js": 24, "./ProxyHandler.js": 25, "./Stream.js": 26, "./Tokenizer.js": 27, "./WritableStream.js": 28, "domelementtype": 3, "domhandler": 4, "domutils": 7 }] }, {}, [])("htmlparser2");
});
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('templating/DOMParser', ['templating/htmlparser2'], factory);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('htmlparser2'));
  } else {
    // Browser globals (root is window)
    root.Templating = root.Templating || {};
    root.Templating.DOMParser = factory(root.htmlparser, root.Templating.utils);
  }
})(undefined, function (htmlparser) {
  'use strict';

  var DomUtils = htmlparser.DomUtils;

  /**
   *
   * @param html
   * @constructor
   */

  var DOMParser = function () {
    function DOMParser(html) {
      _classCallCheck(this, DOMParser);

      var handler = new htmlparser.DomHandler();
      var parser = new htmlparser.Parser(handler);
      parser.write(html);
      this.dom = handler.dom;
    }

    _createClass(DOMParser, [{
      key: 'setAttributeValue',
      value: function setAttributeValue(el, name, value) {
        el.attribs = el.attribs || {};
        if (value === undefined) {
          delete el.attribs[name];
        } else {
          el.attribs[name] = value;
        }
      }
    }, {
      key: 'createElement',
      value: function createElement(tagName) {
        return {
          type: 'tag',
          name: tagName,
          attribs: {},
          children: []
        };
      }
    }, {
      key: 'getElementByTagName',
      value: function getElementByTagName(tagName, elements) {
        return DomUtils.findOne(function (el) {
          return el.name == tagName;
        }, elements);
      }
    }, {
      key: 'getElementByPrefix',
      value: function getElementByPrefix(prefix, elements) {
        return DomUtils.findOne(function (el) {
          return el.name.split('-')[0] == prefix;
        }, elements);
      }
    }, {
      key: 'getChildrenElements',
      value: function getChildrenElements(element) {
        return DomUtils.filter(function (el) {
          return el.type === 'tag';
        }, DomUtils.getChildren(element), false);
      }
    }, {
      key: 'removeComments',
      value: function removeComments(element) {
        var _this = this;

        element = element || this.dom[0];
        if (element.type === 'comment') {
          DomUtils.removeElement(element);
        }
        var children = DomUtils.getChildren(element);
        if (children && children.length > 0) {
          children.forEach(function (el) {
            _this.removeComments(el);
          });
        }
      }
    }, {
      key: 'applyClass',
      value: function applyClass(templateId, element) {
        var _this2 = this;

        element = element || this.dom[0];
        if (element.type === 'tag') {
          this.setAttributeValue(element, 'class', (templateId + ' ' + (this.getAttributeValue(element, 'class') || '')).trim());
        }
        var children = DomUtils.getChildren(element);
        if (children && children.length > 0) {
          children.forEach(function (el) {
            _this2.applyClass(templateId, el);
          });
        }
      }
    }, {
      key: 'findOneChild',
      value: function findOneChild(element) {
        return DomUtils.findOneChild(function (el) {
          return el.type === 'tag';
        }, element ? element : this.dom);
      }
    }, {
      key: 'isText',
      value: function isText(el) {
        return el.type === 'text';
      }
    }]);

    return DOMParser;
  }();

  Object.assign(DOMParser.prototype, {
    DomUtils: DomUtils,
    getOuterHTML: DomUtils.getOuterHTML,
    getInnerHTML: DomUtils.getInnerHTML,
    getChildren: DomUtils.getChildren,
    replaceElement: DomUtils.replaceElement,
    appendChild: DomUtils.appendChild,
    getAttributeValue: DomUtils.getAttributeValue,
    removeElement: DomUtils.removeElement
  });

  return DOMParser;
});
/**
 * Created by guntars on 22/01/2016.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('templating/DOMContext', factory);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  }
})(undefined, function () {
  'use strict';

  function applyAttr(dataset, subKeys, attrib) {
    var attr = subKeys.length > 2 ? _defineProperty({}, subKeys[2], attrib) : attrib;
    if (subKeys.length > 2) {
      dataset[subKeys[1]] = dataset[subKeys[1]] || {};
      Object.assign(dataset[subKeys[1]], attr);
    } else {
      dataset[subKeys[1]] = attr;
    }
  }

  function setDataFromAttributes(attributes) {
    //TODO: rename dataset tu camel case
    var dataset = {},
        tplSet = {},
        attribs = {};

    Object.keys(attributes).forEach(function (key) {
      var subKeys = key.split('-'),
          attrib = attributes[key];
      if (['data', 'tp'].indexOf(subKeys[0]) !== -1 && subKeys.length > 1) {

        if (subKeys[0] === 'data') {
          applyAttr(dataset, subKeys, attrib);
        } else {
          applyAttr(tplSet, subKeys, attrib);
        }
      } else {
        attribs[key] = attrib;
      }
    });
    return {
      dataset: dataset, tplSet: tplSet, attribs: attribs
    };
  }

  return function DOMContext(compiler, element) {
    var domParser = compiler._domParser,
        data = setDataFromAttributes(element.attribs);
    data.name = element.name.split('-')[1] || data.tplSet.name;
    data.type = data.tplSet.type || element.name.split('-')[0];

    return {
      setTag: function setTag(coderName) {
        data.tag = element.name.split('-')[0] !== coderName ? element.name : data.tplSet.tag || 'div';
      },
      outerTemplate: function outerTemplate() {
        var children = domParser.getChildren(element),
            holder = domParser.createElement(data.tag);

        if (children && children.length > 0) {
          children.forEach(function (child) {
            domParser.appendChild(holder, child);
          });
        }
        return domParser.getOuterHTML(holder);
      },
      setPlaceholder: function setPlaceholder(id, noTag) {
        if (noTag) {
          domParser.removeElement(element);
        } else {
          var placeholder = domParser.createElement(data.tag);
          domParser.setAttributeValue(placeholder, 'id', id);
          //domParser.setAttributeValue(placeholder, 'style', 'display:none');
          domParser.replaceElement(element, placeholder);
        }
      },
      getInnerHTML: function getInnerHTML() {
        return domParser.getInnerHTML(element);
      },
      getChildrenElements: function getChildrenElements() {
        return domParser.getChildrenElements(element);
      },
      removeChildren: function removeChildren() {
        var children = element.children;
        if (children.length > 0) {
          children.forEach(function (child) {
            domParser.removeElement(child);
          }.bind(this));
        }
      },

      get type() {
        return data.type;
      },
      get tag() {
        return data.tag;
      },
      get templateId() {
        return compiler.templateId;
      },
      get url() {
        return compiler.url;
      },
      get data() {
        return data;
      },
      getAttributeValue: function getAttributeValue(name) {
        return domParser.getAttributeValue(element, name);
      },
      setAttributeValue: function setAttributeValue(name, value) {
        return domParser.setAttributeValue(element, name, value);
      }
    };
  };
});
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('templating/Coder', ['./DOMParser', './DOMContext'], factory);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('./DomParser'), require('./DOMContext'));
  }
})(undefined, function (DOMParser, DOMContext) {
  'use strict';

  var templId = 0,
      _coders = [],
      tagId = 0;

  /**
   *
   * @constructor
   * @param dOMParser
   */

  var Coder = function () {
    _createClass(Coder, null, [{
      key: 'addCoder',
      value: function addCoder(coder) {
        if (_coders.indexOf(coder) === -1) {
          _coders.push(coder);
        }
      }
    }]);

    function Coder(content) {
      _classCallCheck(this, Coder);

      this.templateId = 'tid_' + new Date().valueOf() + templId;
      var domParser = new DOMParser(content);
      domParser.removeComments();
      domParser.applyClass(this.templateId);
      this._domParser = domParser;
      this._rootEl = domParser.findOneChild();
    }

    _createClass(Coder, [{
      key: 'getOuterHTML',
      value: function getOuterHTML() {
        return this._domParser.getOuterHTML(this._rootEl);
      }
    }, {
      key: '_compile',
      value: function _compile() {
        return {
          children: this._parseChildren(this._rootEl).context,
          template: this.getOuterHTML(),
          templateId: this.templateId
        };
      }
    }, {
      key: '_parseChildren',
      value: function _parseChildren(el) {
        var _this3 = this;

        var nodeContext = this._prepareChild(el),
            context = [],
            childEl = nodeContext.getChildrenElements();
        if (childEl && childEl.length > 0) {
          childEl.forEach(function (child) {
            var children = _this3._parseChildren(child);
            if (children.parsed) {
              context.push(children.parsed);
            }
            if (!children.parsed || !children.parsed.tagName) {
              context = [].concat(_toConsumableArray(context), _toConsumableArray(children.context));
            }
          });
        }

        var parsed = this._applyCoder(nodeContext);
        if (parsed && parsed.tagName) {
          parsed.children = context;
        }
        return { context: context, parsed: parsed };
      }
    }, {
      key: '_applyCoder',
      value: function _applyCoder(nodeContext) {
        var parsed = false,
            data = nodeContext.data;
        _coders.forEach(function (coder) {
          if (nodeContext.type === coder.tagName && !parsed) {
            var id = 'e' + tagId++;

            nodeContext.setTag(coder.tagName);
            nodeContext.setPlaceholder(id, coder.noTag);

            parsed = {
              id: id,
              tagName: coder.tagName,
              data: coder.code(nodeContext, data),
              template: nodeContext.outerTemplate()
            };
          }
        });

        if (!parsed) {
          var name = data.name;
          if (name !== undefined) {
            var id = 'e' + tagId++;
            nodeContext.setAttributeValue('id', id);
            nodeContext.setAttributeValue('tp-name', undefined);
            parsed = {
              id: id,
              data: data
            };
          }
        }

        return parsed;
      }
    }, {
      key: '_prepareChild',
      value: function _prepareChild(element) {
        return DOMContext(this, element);
      }
    }, {
      key: 'run',
      value: function run(url) {
        this.url = url;
        templId++;
        return this._compile();
      }
    }, {
      key: 'getText',
      value: function getText() {
        return JSON.stringify(this.run());
      }
    }]);

    return Coder;
  }();

  return Coder;
});
/**
 * Created by guntars on 02/02/2016.
 */
define('templating/utils/List', [], function () {
  'use strict';

  var List = function () {
    function List(items) {
      _classCallCheck(this, List);

      this._map = new Map(items);
      this._indexes = [].concat(_toConsumableArray(this._map.keys()));
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
        var _this4 = this;

        return this._indexes.map(function (key) {
          return [key, _this4._map.get(key)];
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
          for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
            args[_key2 - 2] = arguments[_key2];
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
      key: 'getFirst',
      value: function getFirst() {
        return this.getValueByIndex(0);
      }
    }, {
      key: 'getLast',
      value: function getLast() {
        return this.getValueByIndex(this._indexes.length - 1);
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
      key: 'delete',
      value: function _delete(key) {
        this._map.delete(key);
        this._indexes.splice(this._indexes.indexOf(key), 1);
      }
    }, {
      key: 'deleteByIndex',
      value: function deleteByIndex(index) {
        var key = this._indexes.splice(index, 1)[0];
        this._map.delete(key);
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
/**
 * Created by guntars on 10/10/2014.
 */
//## templating/dom Class for dom manipulation
define('templating/dom', [], function () {
  'use strict';

  function isObject(obj) {
    var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
    return type === 'function' || type === 'object' && !!obj;
  }

  function createPlaceholder(tag) {
    var placeholder = document.createElement(tag || 'div');
    placeholder.setAttribute('style', 'display:none;');
    return placeholder;
  }

  // ## widget/dom.Element
  //     @method Element
  //     @param {Object} node

  var Element = function () {
    function Element(el, node) {
      _classCallCheck(this, Element);

      this.el = el;
      this._events = [];
      //this._node = node;
      this.name = node.name || node.data.name;
      var data = this.data = node.data;
      if (data) {
        if (data.bind) {
          this.bind = data.bind;
        }
        /* if (data.dataset) {
         this.dataset = data.dataset;
         }*/
      }
    }

    _createClass(Element, [{
      key: 'clone',
      value: function clone() {
        return this.run.apply(this, arguments);
      }
    }, {
      key: 'text',

      // Shortcut to - `dom.text`
      value: function text(_text) {
        dom.text(this, _text);
      }
    }, {
      key: 'detach',
      value: function detach() {
        dom.detach(this);
      }
    }, {
      key: 'attach',
      value: function attach() {
        dom.attach(this);
      }
    }, {
      key: 'changePosition',

      // Shortcut to - `dom.changePosition`
      value: function changePosition(index) {
        dom.changePosition(this, index);
      }

      // Shortcut to - `dom.setAttribute`

    }, {
      key: 'setAttribute',
      value: function setAttribute(prop, value) {
        dom.setAttribute(this, prop, value);
      }
    }, {
      key: 'getAttribute',

      // Shortcut to - `dom.getAttribute`
      value: function getAttribute(prop) {
        return dom.getAttribute(this, prop);
      }
    }, {
      key: 'removeAttribute',

      // Shortcut to - `dom.removeAttribute`
      value: function removeAttribute(prop) {
        dom.removeAttribute(this, prop);
      }
    }, {
      key: 'setStyle',

      // Shortcut to - `dom.setStyle`
      value: function setStyle(prop, value) {
        dom.setStyle(this, prop, value);
      }
    }, {
      key: 'getStyle',

      // Shortcut to - `dom.getStyle`
      value: function getStyle(prop) {
        return dom.getStyle(this, prop);
      }

      // Shortcut to - `dom.removeStyle`

    }, {
      key: 'removeStyle',
      value: function removeStyle(prop) {
        dom.removeStyle(this, prop);
      }
    }, {
      key: 'addClass',

      // Shortcut to - `dom.addClass`
      value: function addClass(className) {
        dom.addClass(this, className);
      }
    }, {
      key: 'hasClass',

      // Shortcut to - `dom.hasClass`
      value: function hasClass(className) {
        return dom.hasClass(this, className);
      }
    }, {
      key: 'removeClass',

      // Shortcut to - `dom.removeClass`
      value: function removeClass(className) {
        dom.removeClass(this, className);
      }
    }, {
      key: 'val',

      // Shortcut to - `dom.val`
      value: function val(_val) {
        return dom.val(this, _val);
      }
    }, {
      key: 'on',

      // Shortcut to - `dom.on`
      value: function on(event, cb, context) {
        var args = Array.prototype.slice.call(arguments, 0);
        return dom.on.apply(false, [this].concat(args));
      }
    }, {
      key: 'onDOMAttached',

      // Shortcut to - `dom.onDOMAttached`
      value: function onDOMAttached() {
        return dom.onDOMAttached(this);
      }
    }, {
      key: 'remove',

      // Shortcut to - `dom.remove`
      value: function remove() {
        dom.remove(this);
      }
    }]);

    return Element;
  }();

  var dom = {
    //Removing element from DOM
    //
    //      @method detach
    //      @param {dom.Element}

    detach: function detach(node) {
      if (node.placeholder instanceof HTMLElement === false) {
        node.placeholder = createPlaceholder(node.data.tag || node.el.tagName);
      }
      if (node && node.el && node.el.parentNode) {
        node.el.parentNode.replaceChild(node.placeholder, node.el);
      }
    },

    //Adding element back to DOM
    //
    //      @method attach
    //      @param {dom.Element}
    attach: function attach(node) {
      if (node && node.el && node.placeholder && node.placeholder.parentNode) {
        node.placeholder.parentNode.replaceChild(node.el, node.placeholder);
      }
    },

    // Changing position in nodeList
    //
    //      @method changePosition
    //      @param {dom.Element}
    //      @param {Int} index
    changePosition: function changePosition(el, index) {

      var HTMLElement = el.el;
      if (HTMLElement && HTMLElement.parentNode) {

        var parentNode = HTMLElement.parentNode,
            elGroup = el.elGroup,
            size = elGroup.size,
            target = elGroup.getKeyByIndex(index) || elGroup.getLast();

        if (target !== HTMLElement) {
          if (size - 1 >= index) {
            parentNode.insertBefore(HTMLElement, target);
          } else if (target.nextSibling !== null) {
            parentNode.insertBefore(HTMLElement, target.nextSibling);
          } else {
            parentNode.appendChild(HTMLElement);
          }

          el.elGroup.changeIndex(HTMLElement, index);
        }
      }
    },

    // Adding text in to node
    //
    //      @method text
    //      @param {dom.Element}
    //      @param {String} text
    text: function text(node, _text2) {
      if (node && node.el) {
        node.el.innerHTML = _text2;
      }
    },

    // Setting Attribute in to node
    //
    //      @method setAttribute
    //      @prop {dom.Element} node
    //      @prop {String||Object} prop
    //      @prop {String} value
    setAttribute: function setAttribute(node, prop, value) {
      if (node && node.el) {
        if (isObject(prop)) {
          Object.keys(prop).forEach(function (key) {
            node.el.setAttribute(key, prop[key]);
          });
        } else {
          node.el.setAttribute(prop, value);
        }
      }
    },

    // Getting Attribute in to node
    //
    //      @method getAttribute
    //      @prop {dom.Element} node
    //      @prop {String||Object} prop
    //      @return {String} value
    getAttribute: function getAttribute(node, prop) {
      if (node && node.el) {
        return node.el.getAttribute(prop);
      } else {
        return undefined;
      }
    },

    // Removing Attribute from node
    //
    //      @method removeAttribute
    //      @prop {dom.Element} node
    //      @prop {String} prop
    removeAttribute: function removeAttribute(node, prop) {
      if (node && node.el) {
        node.el.removeAttribute(prop);
      }
    },

    // Setting css style in to node
    //
    //      @method setStyle
    //      @prop {dom.Element} node
    //      @prop {String||Object} prop
    //      @prop {String} value
    setStyle: function setStyle(node, prop, value) {
      if (node && node.el) {
        if (isObject(prop)) {
          Object.keys(prop).forEach(function (key) {
            node.el.style[key] = prop[key];
          });
        } else {
          node.el.style[prop] = value;
        }
      }
    },

    // Getting css style from node
    //
    //      @method getStyle
    //      @prop {dom.Element} node
    //      @prop {String} prop
    //      @return {String} value
    getStyle: function getStyle(node, prop) {
      if (node && node.el) {
        if (node.el !== undefined && node.el.style !== undefined) {
          return node.el.style[prop];
        } else {
          return undefined;
        }
      }
    },

    // Removing css style from node
    //
    //      @method removeAttribute
    //      @prop {dom.Element} node
    //      @prop {String} prop
    removeStyle: function removeStyle(node, prop) {
      if (node && node.el) {
        node.el.style[prop] = '';
      }
    },

    // Adding class in to node
    //
    //      @method addClass
    //      @param {dom.Element} node
    //      @param {String} className
    addClass: function addClass(node, className) {
      if (node && node.el) {
        node.el.classList.add(className);
      }
    },

    // checking if className exists in node
    //
    //      @method hasClass
    //      @param {dom.Element} node
    //      @param {String} className
    //      @return boolean
    hasClass: function hasClass(node, className) {
      if (node && node.el) {
        return node.el.classList.contains(className);
      } else {
        return false;
      }
    },

    // Remove class from node
    //
    //      @method removeClass
    //      @param {dom.Element} node
    //      @param {string} className
    removeClass: function removeClass(node, className) {
      if (node && node.el) {
        node.el.classList.remove(className);
      }
    },

    // Setting, Getting value to input element
    //
    //      @method val
    //      @param {dom.Element} node
    //      @param? {String} val
    //      @return {String}
    val: function val(node, _val2) {
      if (node && node.el) {
        var el = node.el;
        if (_val2 !== undefined) {
          el.value = _val2;
        } else {
          return el.value;
        }
      }
    },

    // Adding DOM Event in to Element
    //
    //      @method on
    //      @param {dom.Element} element
    //      @param {String} ev
    //      @param {Function} cb
    //      @param {Object} context
    //      @return {Object} { remove() }
    on: function on(element, ev, cb, context) {
      for (var _len3 = arguments.length, args = Array(_len3 > 4 ? _len3 - 4 : 0), _key3 = 4; _key3 < _len3; _key3++) {
        args[_key3 - 4] = arguments[_key3];
      }

      var _this5 = this;

      var el = element.el,
          events = ev.split(' '),
          fn = function fn(e) {
        cb.apply(context || _this5, [e, element].concat(args));
      };

      events.forEach(function (event) {
        el.addEventListener(event, fn);
      });
      var evt = {
        remove: function remove() {
          events.forEach(function (event) {
            return el.removeEventListener(event, fn);
          });
          var evts = element._events;
          evts.splice(evts.indexOf(evt), 1);
        }
      };
      element._events.push(evt);
      return evt;
    },

    // Remove Dom Element from Dom
    //
    //      @method remove
    //      @param {dom.Element}
    remove: function remove(el) {
      while (el._events.length > 0) {
        el._events.shift().remove();
      }
      if (el.elGroup !== undefined) {
        el.elGroup.delete(el.el);
      }
      if (el.el !== undefined) {
        if (el.el.remove) {
          el.el.remove();
        } else if (el.el.parentNode) {
          el.el.parentNode.removeChild(el.el);
        }
        delete el.el;
      }
    },

    // executes when element attached to Dom
    //
    //      @method onDOMAttached
    //      @param {dom.Element}
    //      @param {function} cb
    //      @param {function} context
    onDOMAttached: function onDOMAttached(el) {
      var _this6 = this;

      var handlers = [],
          attached = false,
          _step = undefined;

      if (el.el !== undefined) {
        _step = function step() {
          if (attached) {
            while (handlers.length > 0) {
              handlers.shift()();
            }
          } else {
            window.requestAnimationFrame(_step);
            if (document.body.contains(el.el)) {
              attached = true;
            }
          }
        };
      }
      return {
        then: function then(cb, context) {
          handlers.push(cb.bind(context || _this6));
          window.requestAnimationFrame(_step);
        }
      };
    },

    // Element
    Element: Element
  };

  return dom;
});
/**
 * Created by guntars on 22/01/2016.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('templating/DomFragment', factory);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  }
})(undefined, function () {
  'use strict';

  var DomFragment = function () {
    function DomFragment(_node, placeholder, childNodes, elGroup, index, obj) {
      _classCallCheck(this, DomFragment);

      Object.assign(this, {
        _node: _node,
        placeholder: placeholder,
        childNodes: childNodes,
        elGroup: elGroup,
        index: index,
        obj: obj
      });
      return this.render();
    }

    _createClass(DomFragment, [{
      key: 'applyAttributes',
      value: function applyAttributes(el) {
        var attributes = this._node.data.attribs;
        Object.keys(attributes).forEach(function (key) {
          el.setAttribute(key, attributes[key]);
        });
      }
    }, {
      key: 'applyFragment',
      value: function applyFragment(el) {
        var node = this._node;
        var plFragment = node.template();
        if (plFragment !== undefined) {
          while (plFragment.childNodes.length > 0) {
            el.appendChild(plFragment.childNodes[0]);
          }
        }
      }
    }, {
      key: 'appendToBody',
      value: function appendToBody(el) {
        var elGroup = this.elGroup,
            placeholder = this.placeholder,
            size = elGroup.size;

        if (size > 0) {
          var index = this.index === undefined || this.index > size - 1 ? size - 1 : this.index - 1,
              target = elGroup.keys()[index !== -1 ? index : 0],
              parentNode = target.parentNode;

          if (index === -1) {
            parentNode.insertBefore(el, target);
          } else if (target.nextSibling !== null) {
            parentNode.insertBefore(el, target.nextSibling);
          } else {
            parentNode.appendChild(el);
          }
        } else {
          var parentNode = placeholder.parentNode;
          if (parentNode) {
            parentNode.replaceChild(el, placeholder);
          }
        }
      }
    }, {
      key: 'render',
      value: function render() {
        var placeholder = this.placeholder,
            node = this._node,
            keep = !placeholder.id && this.elGroup.size === 0,
            instance = node.tmpEl(keep ? placeholder : false, this.obj, this.childNodes, node),
            el = instance.el;

        if (!keep && !node.replace) {
          this.applyAttributes(el);
        } else if (!node.replace) {
          el.innerHTML = '';
        }

        if (!node.replace) {
          this.applyFragment(el);
        }

        this.appendToBody(el);

        /* if (this.childNodes && this.childNodes.runAll && node.parse) {
         this.childNodes.runAll();
         }*/

        return instance;
      }
    }]);

    return DomFragment;
  }();

  return DomFragment;
});
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    // AMD. Register as an anonymous module.
    define('templating/Decoder', ['./utils/List', './dom', './DomFragment'], factory);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('./utils/List'), require('./dom'), require('./DomFragment'));
  }
})(undefined, function (List, dom, DomFragment) {
  'use strict';

  var _decoders = {};

  function isObject(obj) {
    return obj === Object(obj);
  }

  function isArray(obj) {
    return Array.isArray ? Array.isArray(obj) : toString.call(obj) === '[object Array]';
  }

  /**
   *
   * @constructor
   * @param root
   */

  var Decoder = function () {
    _createClass(Decoder, null, [{
      key: 'addDecoder',
      value: function addDecoder(decoder) {
        if (_decoders[decoder.tagName] === undefined) {
          _decoders[decoder.tagName] = decoder;
        }
      }
    }]);

    function Decoder(root) {
      _classCallCheck(this, Decoder);

      this._root = typeof root === 'string' ? JSON.parse(root) : root;
      if (root.children && root.children.length > 0) {
        this.children = this._parseElements(root.children);
      }
    }

    _createClass(Decoder, [{
      key: 'renderFragment',
      value: function renderFragment(template) {
        var el = document.createElement('template');
        el.innerHTML = template;
        return el.content !== undefined ? el.content.firstChild : el.firstChild;
      }
    }, {
      key: '_parseElements',
      value: function _parseElements(nodeList) {
        var _this7 = this;

        var context = {};
        nodeList.forEach(function (node) {
          var name = node.data.name;
          var tagName = node.tagName;
          if (tagName) {
            var decodedData = _decoders[tagName].decode(node);
            if (decodedData) {
              var nodeParams = {
                name: decodedData.name,
                data: decodedData.data,
                tmpEl: decodedData.tmpEl,
                parse: decodedData.parse,
                replace: decodedData.replace,
                id: node.id,
                template: function template() {
                  return _this7.renderFragment(node.template, node.data.tag);
                },
                noAttach: _decoders[tagName].noAttach || node.data.tplSet.noattach
              };
              if (node.children && node.children.length > 0) {
                nodeParams.children = _this7._parseElements(node.children);
              }
              context[name] = nodeParams;
            }
          } else if (name) {
            context[name] = {
              id: node.id,
              data: node.data,
              name: name
            };
          }
        });
        return context;
      }
    }, {
      key: 'renderTemplate',
      value: function renderTemplate(childNodes, obj, fragment) {
        var _this8 = this;

        var resp = {},
            _runAll = [];
        Object.keys(childNodes).forEach(function (name) {
          var child = childNodes[name],
              children = child.children,
              elGroup = new List();
          if (child.template) {
            (function () {
              var run = function run(force, index) {
                var template = fragment();
                if (force instanceof HTMLElement === true) {
                  template = force;
                }

                var childNodes = undefined,
                    data = template !== force && (isObject(force) || isArray(force)) ? force : obj;
                if (!child.noAttach || force) {
                  var placeholder = template.querySelector('#' + child.id) || template;

                  if (children) {
                    childNodes = _this8.renderTemplate(children, data, function () {
                      return template;
                    });
                  }
                  var element = new DomFragment(child, placeholder, childNodes, elGroup, index, data);

                  template = element.el;

                  if (childNodes && childNodes.runAll && child.parse) {
                    childNodes.runAll();
                  }

                  if (childNodes && !element.children) {
                    element.children = childNodes;
                  }
                  element.elGroup = elGroup;
                  element.run = run;
                  elGroup.set(element.el, element, index);
                  return element;
                }
              };
              _runAll.push(run);
              resp[name] = {
                data: child.data,
                run: run,
                elGroup: elGroup
              };
            })();
          } else {
            var element = new dom.Element(fragment().querySelector('#' + child.id), child);
            element.removeAttribute('id');
            element.elGroup = elGroup;
            elGroup.set(element.el, element);
            resp[name] = element;
          }
        });
        var setProp = function setProp(obj, name, fn) {
          Object.defineProperty(obj, name, {
            enumerable: false,
            value: fn
          });
        };

        var runAll = function runAll(el) {
          _runAll.forEach(function (run) {
            return run(el);
          });
          return resp;
        };

        setProp(resp, 'runAll', runAll);

        return resp;
      }
    }, {
      key: 'render',
      value: function render(obj) {
        var fragment = this.renderFragment(this._root.template);
        return {
          fragment: fragment,
          children: this.renderTemplate(this.children, obj || {}, function () {
            return fragment;
          }).runAll(),
          templateId: this._root.templateId
        };
      }
    }]);

    return Decoder;
  }();

  return Decoder;
});
//# sourceMappingURL=parser.js.map

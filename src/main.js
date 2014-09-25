define(['module'], function (module) {

    var template;
    var buildMap = {};
    var srcMap = {};
    var idToSrc = {};
    var masterConfig = (module.config && module.config()) || {};
    var fs;

    template = {
        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext".
         */
        parseName: function (name) {
            var modName, ext, temp,
                index = name.indexOf('.'),
                isRelative = name.indexOf('./') === 0 ||
                    name.indexOf('../') === 0;

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
        },

        traverse: function (o, func) {
            for (var i in o) {
                func.apply(this, [i, o[i]]);
                if (o[i] !== null && typeof(o[i]) == "object") {
                    template.traverse(o[i], func);
                }
            }
        },

        finishLoad: function (name, content, onLoad, req) {

            function handler(DOMParser, Coder) {
                var domParser = new DOMParser(content);
                var coder = new Coder(domParser);

                var jsObject = coder.run();
                var map = {};
                var src;

                template.traverse(jsObject, function (key, value) {
                    if (key == 'data' && value.src) {
                        map[value.src] = map[value.src] || [];
                        map[value.src].push(value);
                    }
                });

                srcMap[name] = map;

                var sources = Object.keys(map);
                req(sources, function () {
                    if (masterConfig.isBuild) {
                        idToSrc[name] = {};

                        for (src in map) {
                            var id = Math.random();
                            map[src].forEach(function (value) {
                                value.src = id;
                            });
                            idToSrc[name][id] = src;
                        }

                        buildMap[name] = jsObject;
                    } else {
                        for (src in map) {
                            var obj = arguments[sources.indexOf(src)];
                            map[src].forEach(function (value) {
                                value.src = obj;
                            });
                        }
                    }

                    onLoad(jsObject);
                });
            }

            var paths = {
                DOMParser: 'DOMParser',
                Coder: 'Coder'
            };

            if (masterConfig.isBuild) {
                var DOMParser = require.nodeRequire(require.toUrl(paths.DOMParser));
                var Coder = require.nodeRequire(require.toUrl(paths.Coder));
                masterConfig.templateCoders.forEach(function (coder) {
                    DOMParser.addCoder(require.nodeRequire(require.toUrl(coder)));
                });
                handler(DOMParser, Coder);
            } else {
                require([paths.DOMParser, paths.Coder].concat(masterConfig.templateCoders), handler);
            }
        },

        load: function (name, req, onLoad, config) {

            masterConfig.isBuild = config && config.isBuild;
            if (config) {
                masterConfig.templateCoders = config.templateCoders || [];
                masterConfig.templateDecoders = config.templateDecoders || [];
            }

            //Name has format: some.module.filext
            var parsed = template.parseName(name);
            var nonStripName = parsed.moduleName + (parsed.ext ? '.' + parsed.ext : '');
            var url = req.toUrl(nonStripName);

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the template
            template.get(url, function (content) {
                req(masterConfig.templateDecoders, function () {
                    template.finishLoad(name, content, onLoad, req);
                });
            }, function (err) {
                if (onLoad.error) {
                    onLoad.error(err);
                }
            });
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = JSON.stringify(buildMap[moduleName]);

                var map = idToSrc[moduleName];
                var ids = Object.keys(map);
                var sources = [];
                ids.forEach(function (id, i) {
                    content = content.replace(id, 'arguments[' + i + ']');
                    sources.push(map[id]);
                });
                var dependencies = sources.concat(masterConfig.templateDecoders);

                write.asModule(pluginName + '!' + moduleName,
                        "define(" + JSON.stringify(dependencies) + ", function () { return " +
                        content +
                        ";});\n");
            }
        }

    };

    if (masterConfig.env === 'node' || (!masterConfig.env && typeof process !== 'undefined' &&
        process.versions && !!process.versions.node && !process.versions['node-webkit'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        template.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file.indexOf('\uFEFF') === 0) {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || !masterConfig.env) {
        template.get = function (url, callback, errback, headers) {
            var xhr = new XMLHttpRequest();
            var header;

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
                var status, err;
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

    return template;

});
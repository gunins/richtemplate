define(['module'], function (module) {
    'use strict';

    var template;
    var buildMap = {};
    var srcMap = {};
    var idToSrc = {};
    var masterConfig = (module.config && module.config()) || {};
    var loadDependencies;

    function traverse(o, func) {
        for (var i in o) {
            func.apply(this, [i, o[i]]);
            if (o[i] !== null && typeof(o[i]) == "object") {
                traverse(o[i], func);
            }
        }
    }

    function sourceMap(jsObject) {
        var map = {}
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
            ext:        ext
        };
    }

    function finishLoad(Coder, content, name, onLoad, req) {
        var coder = new Coder(content),
            jsObject = buildMap[name] = coder.run(req.toUrl('./')),
            map = srcMap[name] = sourceMap(jsObject),
            sources = Object.keys(map);

        req(sources, function (...args) {
            if (masterConfig.isBuild) {
                idToSrc[name] = {};
                sources.forEach((src)=> {
                    var id = Math.random();
                    map[src].forEach((value)=> {
                        value.src = id;
                    });

                    idToSrc[name][id] = src;
                });

            } else {
                sources.forEach((src, index)=> {
                    var obj = args[index];
                    map[src].forEach(function (value) {
                        value.src = obj;
                    });
                });
            }
            onLoad(jsObject);
        });
    }

    if (masterConfig.env === 'node' || (!masterConfig.env && typeof process !== 'undefined' &&
        process.versions && !!process.versions.node && !process.versions['node-webkit'])) {
        //Using special require.nodeRequire, something added by r.js.
        let fs = require.nodeRequire('fs');

        loadDependencies = function (url, callback, errback) {
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
        loadDependencies = function (url, callback, errback, headers) {
            let xhr = new XMLHttpRequest(),
                header;
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

    return {
        load (name, req, onLoad, config) {
            masterConfig.isBuild = config && config.isBuild;
            if (config) {
                masterConfig.templateCoders = config.templateCoders || [];
                masterConfig.templateDecoders = config.templateDecoders || [];
            }

            //Name has format: some.module.filext
            let paths = {
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
                    let Coder = require.nodeRequire(require.toUrl(paths.Coder));
                    masterConfig.templateCoders.forEach(function (coder) {
                        Coder.addCoder(require.nodeRequire(require.toUrl(coder)));
                    });
                    finishLoad(Coder, content, name, onLoad, req);
                } else {
                    req([paths.Coder, ...masterConfig.templateCoders, ...masterConfig.templateDecoders], function (Coder) {
                        finishLoad(Coder, content, name, onLoad, req);
                    });
                }
            }, function (err) {
                if (onLoad.error) {
                    onLoad.error(err);
                }
            });
        },

        write (pluginName, moduleName, write) {

            if (buildMap.hasOwnProperty(moduleName)) {
                let content = JSON.stringify(buildMap[moduleName]),
                    map = idToSrc[moduleName],
                    ids = Object.keys(map),
                    sources = [];
                ids.forEach(function (id, i) {
                    let re = new RegExp(id, 'g');
                    content = content.replace(re, 'arguments[' + i + ']');
                    sources.push(map[id]);
                });

                let dependencies = sources.concat(masterConfig.templateDecoders);

                write.asModule(pluginName + '!' + moduleName,
                    "define(" + JSON.stringify(dependencies) + ", function () { return " +
                    content +
                    ";});\n");
            }
        }

    };

});
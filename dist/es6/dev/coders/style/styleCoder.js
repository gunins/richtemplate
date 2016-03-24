(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('coders/style/styleCoder',['templating/Coder', 'templating/less'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../../templating/Coder'), require('less'));
    }
}(this, function(Coder, less) {
    'use strict';
    function applyId(content, id) {
        let classNames = getClassNames(content);
        classNames.forEach((item)=> {
            if (item.trim().length > 0) {
                let names = item.split(',');
                names.forEach((name, index)=> {
                    let bracket = false;
                    if (name.indexOf('{') !== -1) {
                        name = name.replace('{', '');
                        bracket = true;
                    }
                    let replace = name.trim().split(' ').map(chunk=> setName(chunk.trim(), id)).join(' ');
                    names[index] = '\n' + replace + ((bracket) ? ' {' : '');
                });
                content = content.replace(item, names.join(',')).trim() + '\n';
            }
        });
        return content;
    }

    function setName(name, id) {
        let replace = '';
        if (['/*', '', '*/', '>', '+', '*', '~', '>*'].indexOf(name) === -1) {

            if (name.indexOf(':') !== -1) {
                let parts = name.split(':');
                replace = parts.shift() + '.' + id + ':' + parts.join(':');

            } else {
                replace = name + '.' + id;
            }
        } else if (['*', '>*'].indexOf(name) !== -1) {
            replace = name.replace('*', '.' + id);
        } else {
            replace = name;
        }

        return replace;
    }

    function getClassNames(content) {
        return content.match(/[^}]*(?=)*(\{|$)/g);
    }

    function getMedia(content) {
        return content.match(/(@media[^{]+\{[\s\S]+?}\s*})/g);
    }

    function getCSSFromMedia(content) {
        let regexp = /(?:@media[^{]+\{)([\s\S]+?})(?:\s*)}/g.exec(content);

        return (regexp && regexp[1]) ? regexp[1] : regexp;
    }

    function getFrames(content) {
        return content.match(/(@(-(.+)-)?keyframes[^{]+\{[\s\S]+?}\s*})/g);
    }

    function getframeName(content) {
        return (/@(?:-(?:.+)-)?keyframes[^{](\w+)/g).exec(content)[1];
    }

    function removeItems(content, items) {
        items.forEach((item)=> content = content.replace(item, ''));
        return content;
    }

    function parseMedia(media, id) {
        media.forEach((item, index)=> {
            let cssFromMedia = getCSSFromMedia(item);
            media[index] = item.replace(cssFromMedia, '\n' + applyId(cssFromMedia, id));

        });
        return '\n' + media.join('\n');
    }

    function applyFrameNames(frameNames, content, id) {
        frameNames.forEach((name)=> {
            let regExp = new RegExp('(animation:(?:.+)?' + name + '(?:.+)?;)', 'g'),
                match = content.match(regExp);
            if (match && match.length > 0) {
                match.forEach((inner)=> {
                    let text = inner.replace('animation:', ':');
                    text = 'animation' + text.replace(name, name + '_' + id);
                    content = content.replace(inner, text);
                })
            }
        });
        return content;
    }

    function parseFrames(frames, id, frameNames) {
        frames.forEach((frame, index)=> {
            let frameName = getframeName(frame);
            frames[index] = frame.replace(frameName, frameName + '_' + id);
            if (frameNames.indexOf(frameName) === -1) {
                frameNames.push(frameName);
            }

        });
        return '\n' + frames.join('\n');
    }

    function parseCSS(content, id) {
        let frameNames = [],
            parsedFrames,
            frames = getFrames(content);

        if (frames && frames.length > 0) {
            content = removeItems(content, frames);
            parsedFrames = parseFrames(frames, id, frameNames);

        }
        let media = getMedia(content);
        if (media && media.length > 0) {
            content = removeItems(content, media);
        }
        content = applyId(content, id);

        if (media && media.length > 0) {
            content += parseMedia(media, id);
        }

        if (frames && frames.length > 0) {
            content = applyFrameNames(frameNames, content, id) + parsedFrames;
        }

        return content;
    }

    // media queries /@media[^{]+\{([\s\S]+?})\s*}/g
    // get frames   /(@(?:-webkit-|-moz-)?keyframes[^{]+\{[\s\S]+?}\s*})/g
    //get frame name /@(?:-webkit-|-moz-)?keyframes[^{](\w+)/g
    let styleCoder = {
        tagName: 'style',
        noTag:   true,
        code:    function(nodeContext, data) {
            let content = nodeContext.getInnerHTML(),
                templateId = nodeContext.templateId,
                currentUrl,
                importUrl = '@import-url: "' + nodeContext.url + '";',
                style = data.style || '';
            nodeContext.removeChildren();

            if (typeof exports === 'object') {
                let dirName = __dirname.split('/'),
                    curUrl = nodeContext.url.split('/'),
                    root = [];
                curUrl.forEach((url, index)=> {
                    if (url !== dirName[index]) {
                        root.push(url);
                    }
                });

                currentUrl = '@current-url: "' + root.join('/') + '";';

            } else {
                currentUrl = '@current-url: "' + nodeContext.url + '";';
            }

            less.render(importUrl + currentUrl + content, {
                syncImport:   true,
                relativeUrls: true
            }, (e, output)=> {
                //console.log('css', output.css);

                let innerStyle = parseCSS(output.css, templateId);
                if (typeof exports === 'object') {
                    let CleanCSS = require('clean-css');
                    style += new CleanCSS().minify(innerStyle).styles;
                } else {
                    style += innerStyle;
                }
            });
            return {style}
        }
    };

    if (Coder) {
        Coder.addCoder(styleCoder);
    }

    return styleCoder;

}));

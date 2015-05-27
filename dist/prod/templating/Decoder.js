!function(e,t){"function"==typeof define&&define.amd?define("templating/utils",[],t):"object"==typeof exports?module.exports=t():(e.Templating=e.Templating||{},e.Templating.utils=t())}(this,function(){return{merge:function(e,t){Object.keys(t).forEach(function(n){e[n]=t[n]})}}}),function(e,t){"function"==typeof define&&define.amd?define("coders/component/CpDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"cp",decode:function(e,t){var n=e.data;n.attribs={};var i={name:n.name,tmpEl:function(e,o,a){return i.data.instance=new n.src(n.dataset,t,o,a),n.instance.el},data:n||{}};return void 0!==n.dataset.bind&&(i.bind=n.dataset.bind),i}};return e&&e.addDecoder(t),t});;!function(e,n){"function"==typeof define&&define.amd?define("coders/placeholders/plDecoder",["templating/Decoder"],n):"object"==typeof exports?module.exports=n(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=n(e.Templating.Decoder))}(this,function(e){var n={tagName:"pl",decode:function(e,n){var t=e.data;return{name:t.name,tmpEl:function(e){return e||document.createElement(t.tag)},parse:function(e,t){n&&Object.keys(n).forEach(function(o){n[o].run(e,!1,!1,t)})},data:t}}};return e&&e.addDecoder(n),n});;!function(e,t){"function"==typeof define&&define.amd?define("coders/databind/bdDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"bd",noAttach:!0,decode:function(e){var t=this.data=e.data,n={name:t.name,tmpEl:function(){return document.createElement(t.tag)},data:t,bind:t.dataset.bind||t.name};return n}};return e&&e.addDecoder(t),t});;!function(e,t){"function"==typeof define&&define.amd?define("coders/router/RouterDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"rt",noAttach:!0,decode:function(e,t){var n=e.data,o={name:n.name,tmpEl:function(e){return e||document.createElement(n.tag)},parse:function(e){t&&Object.keys(t).forEach(function(n){t[n].run(e)})},data:n||{},route:n.route};return o}};return e&&e.addDecoder(t),t});;!function(e,t){"function"==typeof define&&define.amd?define("coders/style/styleDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"style",decode:function(e){if(void 0===e.data.styleAttached){e.data.styleAttached=!0;var t=document.createElement("style");t.innerHTML=e.data.style,document.head.appendChild(t)}}};return e&&e.addDecoder(t),t});;!function(e,t){"function"==typeof define&&define.amd?define("templating/Decoder",["templating/utils"],t):"object"==typeof exports?module.exports=t(require("./utils")):(e.Templating=e.Templating||{},e.Templating.Decoder=t(e.Templating.utils))}(this,function(e){function t(e,t){var n;n="li"===t?"ul":"td"===t||"th"===t?"tr":"tr"===t?"tbody":"div";var r=document.createElement(n),i=document.createDocumentFragment();return r.innerHTML=e,i.appendChild(r.firstChild),i.firstChild}function n(e,n,r,i,a){var d=this._node,o=d.tmpEl(n?e:!1,i,this),l=d.data.attribs,c=t(d.template,d.data.tag);if(n||Object.keys(l).forEach(function(e){o.setAttribute(e,l[e])}),void 0!==c)for(;c.childNodes.length>0;)o.appendChild(c.childNodes[0]);if(r)r?(d.setParent(r),null!==d.parent&&d.parent.appendChild(o)):r&&void 0!==a&&(d.setParent(r),null!==d.parent&&(d.parent.appendChild(o),d.parent.insertBefore(o,d.parent.childNodes[a])));else{var u=e.parentNode;d.setParent(u),(null!==d.parent||void 0!==d.parent)&&d.parent.replaceChild(o,e)}return this._node.el=o,void 0!==d.parse&&d.parse(o,i),o}function r(t,r,i){var a=t.tagName,d=this,l={id:t.id,template:t.template,noAttach:o[a].noAttach||t.data.tplSet.noattach,applyAttach:function(){delete this._node.noAttach},setParent:function(e){this._node.parent=e}.bind(d),getParent:function(){return this._node.parent}.bind(d),getInstance:function(){return this}.bind(d),run:function(e,t,r,a,o){if(a&&(i=a),void 0===this._node.noAttach){var l=e.querySelector("#"+this._node.id)||e;if(l)return n.call(d,l,t,r,i,o)}}};r&&(l.children=r),d._node=d._node||{},e.merge(d._node,l),d.data=d._node.data,d.getInstance=function(){return this._node.getInstance.apply(this,arguments)}.bind(this),d.run=function(){return this._node.run.apply(this,arguments)}.bind(this),d.applyAttach=function(){return this._node.applyAttach.apply(this,arguments)}.bind(this)}function i(e,t){t||(t={});var n=!1,a=!1;return e.children.forEach(function(e){var d=e.data.name,l=t[d]?t[d]:t,c={};e.children&&e.children.length>0&&(a=i.call(this,e,l));var u=e.tagName;if(u){var h=o[u].decode(e,a);h&&(c._node=h,r.call(c,e,a,l)),void 0!==d&&(n=n||{},n[d]=c)}else d&&(n=n||{},c._node={id:e.id,data:e.data},n[d]=c);a=!1}.bind(this)),n}function a(e,t,n){e&&Object.keys(e).forEach(function(r){void 0!==e[r]._node.run&&e[r]._node.run.call(e[r],t,!1,!1,n),void 0===e[r]._node.el&&void 0===e[r]._node.template&&(e[r]._node.el=t.querySelector("#"+e[r]._node.id),e[r]._node.el.removeAttribute("id"))})}function d(e){this._root="string"==typeof e?JSON.parse(e):e}var o={};return e.merge(d,{addDecoder:function(e){void 0===o[e.tagName]&&(o[e.tagName]=e)}}),e.merge(d.prototype,{addDecoder:d.addDecoder,_renderFragment:function(e,n){n=n||{};var r={},d=t(e.template);return e.children&&e.children.length>0&&(r=i.call(this,e,n)),a(r,d,n),{fragment:d,children:r,templateId:e.templateId}},render:function(e){var t=this._renderFragment(this._root,e);return t}}),d});
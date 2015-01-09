!function(e,t){"function"==typeof define&&define.amd?define("templating/utils",[],t):"object"==typeof exports?module.exports=t():(e.Templating=e.Templating||{},e.Templating.utils=t())}(this,function(){return{merge:function(e,t){Object.keys(t).forEach(function(n){e[n]=t[n]})}}}),function(e,t){"function"==typeof define&&define.amd?define("coders/component/CpDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"cp",decode:function(e,t){var n=e.data;n.attribs={};var i={name:n.name,tmpEl:function(e,o){return i.data.instance=new n.src(n.dataset,t,o),n.instance.el},data:n||{}};return void 0!==n.dataset.bind&&(i.bind=n.dataset.bind),i}};return e&&e.addDecoder(t),t});;!function(e,n){"function"==typeof define&&define.amd?define("coders/placeholders/plDecoder",["templating/Decoder"],n):"object"==typeof exports?module.exports=n(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=n(e.Templating.Decoder))}(this,function(e){var n={tagName:"pl",decode:function(e,n){var t=e.data;return{name:t.name,tmpEl:function(e){return e||document.createElement(t.tag)},parse:function(e){n&&Object.keys(n).forEach(function(t){n[t].run(e)})},data:t}}};return e&&e.addDecoder(n),n});;!function(e,t){"function"==typeof define&&define.amd?define("coders/databind/bdDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"bd",noAttach:!0,decode:function(e){var t=this.data=e.data,n={name:t.name,tmpEl:function(){return document.createElement(t.tag)},data:t,bind:t.dataset.bind||t.name};return n}};return e&&e.addDecoder(t),t});;!function(e,t){"function"==typeof define&&define.amd?define("coders/router/RouterDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"rt",noAttach:!0,decode:function(e,t){var n=e.data,o={name:n.name,tmpEl:function(e){return e||document.createElement(n.tag)},parse:function(e){t&&Object.keys(t).forEach(function(n){t[n].run(e)})},data:n||{},route:n.route};return o}};return e&&e.addDecoder(t),t});;!function(e,t){"function"==typeof define&&define.amd?define("coders/style/styleDecoder",["templating/Decoder"],t):"object"==typeof exports?module.exports=t(require("./Decoder")):(e.Templating=e.Templating||{},e.Templating.componentDecoder=t(e.Templating.Decoder))}(this,function(e){var t={tagName:"style",decode:function(e){if(void 0===e.data.styleAttached){e.data.styleAttached=!0;var t=document.createElement("style");t.innerHTML=e.data.style,document.head.appendChild(t)}}};return e&&e.addDecoder(t),t});;!function(t,e){"function"==typeof define&&define.amd?define("templating/Decoder",["templating/utils"],e):"object"==typeof exports?module.exports=e(require("./utils")):(t.Templating=t.Templating||{},t.Templating.Decoder=e(t.Templating.utils))}(this,function(t){function e(t,e){var n;n="li"===e?"ul":"td"===e||"th"===e?"tr":"tr"===e?"tbody":"div";var i=document.createElement(n),r=document.createDocumentFragment();return i.innerHTML=t,r.appendChild(i.firstChild),r.firstChild}function n(t,n,i,r){var a=this.tmpEl(n?t:!1,r),d=(this.name,this.data.attribs),o=e(this.template,this.data.tag);if(Object.keys(d).forEach(function(t){a.setAttribute(t,d[t])}),void 0!==o)for(;o.childNodes.length>0;)a.appendChild(o.childNodes[0]);if(i)this.setParent(i),null!==this.parent&&this.parent.appendChild(a);else{var h=t.parentNode;console.log(h),this.setParent(h),(null!==this.parent||void 0!==this.parent)&&this.parent.replaceChild(a,t)}return this.el=a,void 0!==this.parse&&this.parse(a),a}function i(e,i,r){var a=e.tagName;t.merge(this,{id:e.id,template:e.template,noAttach:o[a].noAttach||e.data.tplSet.noattach,applyAttach:function(){delete this.noAttach},setParent:function(t){this.parent=t}.bind(this),getParent:function(){return this.parent}.bind(this),run:function(t,e,i,a){if(void 0===this.noAttach){var d=t.querySelector("#"+this.id)||t;if(d)return n.call(this,d,e,i,a||r)}}}),i&&(this.children=i)}function r(t,e){e||(e={});var n=!1,d=!1;return t.children.forEach(function(t){if(t.children&&t.children.length>0){var h=e[t.data.name]?e[t.data.name]:e;d=r.call(this,t,h)}var l=t.tagName;if(l){var c=o[l].decode(t,d,a);if(c){var s=c.name;void 0!==s&&(n=n||{},n[s]=c,i.call(n[s],t,d,e[s]||e))}}d=!1}.bind(this)),n}function a(t,e){Object.keys(t).forEach(function(n){t[n].run(e)})}function d(t){this._root="string"==typeof t?JSON.parse(t):t}var o={};return t.merge(d,{addDecoder:function(t){void 0===o[t.tagName]&&(o[t.tagName]=t)}}),t.merge(d.prototype,{addDecoder:d.addDecoder,_renderFragment:function(t,n){var i={},d=e(t.template);return t.children&&t.children.length>0&&(i=r.call(this,t,n||{})),a(i,d),{fragment:d,children:i,templateId:t.templateId}},render:function(t){var e=this._renderFragment(this._root,t);return e}}),d});
/**
* © Copyright [2015] Hewlett-Packard Development Company, L.P.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var HTMLtoJSX = require('htmltojsx');
var jsdom = require('jsdom').jsdom;
var defaultView = jsdom().defaultView;

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

function createElement(tag) {
  return defaultView.document.createElement(tag);
}

var ATTRIBUTE_MAPPING = {
	'classname': 'className',
	'activestyle': 'activeStyle',
	'htmlfor': 'htmlFor'
};

var TagToReactRouter = function() {

  return {
    reset: function() {
      this.output = '';

      this.routerLink = false;
    },

    parse: function(element) {

      this.reset();

      var wrapper = createElement('div');
      wrapper.innerHTML = element;

      var jsxDiv = wrapper.children[0];

      this.visit(jsxDiv);

      return this.output;
    },

    traverse: function(element) {
      for (var i = 0, count = element.childNodes.length; i < count; i++) {
        this.visit(element.childNodes[i]);
      }
    },

    visit: function(element) {
      this.begin(element);
      this.traverse(element);
      this.end(element);
    },

    handleText: function(element) {
      var text = element.textContent;
      if (this.routerLink) {
        text = text.replace("[", '{').replace(/]/g, '}');
      }

      var tempEl = createElement('div');
      tempEl.textContent = text;
      
      this.output += tempEl.innerHTML;
    },

    beginNode: function(node) {

      var tagName = this.routerLink ? 'Link' : node.tagName.toLowerCase();
      var attributes = [];
      for (var i = 0, count = node.attributes.length; i < count; i++) {
        var value = node.attributes[i].value;
        if (value.indexOf('[') !== 0) {
          value = '"' + value + '"';
        } else {
        	value = '{' + value.replace(/\[/g, '{').replace(/\]/g,'}') + '}';
        }

        var name = node.attributes[i].name;
        if (this.routerLink) {
          name = name.replace(/data-/g, '');
        }

        for (var key in ATTRIBUTE_MAPPING) {
        	if (ATTRIBUTE_MAPPING.hasOwnProperty(key)) {
        		name = name.replace(key, ATTRIBUTE_MAPPING[key]);
        	}
        }
        attributes.push(name + '=' + value);
      }

      this.output += '<' + tagName;
      if (attributes.length > 0) {
        this.output += ' ' + attributes.join(' ');
      }
      if (node.firstChild) {
        this.output += '>';
      }
    },

    begin: function(node) {
      switch (node.nodeType) {
        case 1:
          if (node.tagName === 'A' && node.getAttribute('data-to')) {
            this.routerLink = true;
          }
          this.beginNode(node);
          break;

        case 3:
          this.handleText(node);
          break;
      }
    },

    end: function(node) {
      if (node.nodeType === 1) {
        var tagName = this.routerLink ? 'Link' : node.tagName.toLowerCase();
        this.routerLink = false;
        if (node.firstChild) {
          this.output += '</' + tagName + '>';
        } else {
          this.output += ' />';
        }
      }
    }
  };
};

function createReactComponent(content) {
  var converter = new HTMLtoJSX({
    createClass: false
  });
  
  var output = new TagToReactRouter().parse(converter.convert(content));
  return output;
}

module.exports = function(content) {
  var output = createReactComponent(content) + ';';
  return 'var React = require("react");\nmodule.exports = ' + output;
};

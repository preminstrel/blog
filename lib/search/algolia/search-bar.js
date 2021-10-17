// Helper
  Number.prototype.number_with_delimiter = function(delimiter) {
    var number = this + '', delimiter = delimiter || ',';
    var split = number.split('.');
    split[0] = split[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter);
    return split.join('.');
  };
  
  // strip HTML tags + keep <em>, <p>, <b>, <i>, <u>, <strong>
  function stripTags(v) {
    return $('<textarea />').text(v).html()
      .replace(/&lt;(\/)?(em|p|b|i|u|strong)&gt;/g, '<$1$2>');
  }
  
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  function escapeHTML (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }
  
  //helper attribute multiple (ie: categories)
  function objToString(obj) {
    var str = '';
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        str += str === '' ? '' : ' - ';
        str += obj[p];
      }
    }
    return str;
  }
  
  // return attribute or highlighted attribute
  function getAttributeValue(attr_string, hit){
    var v = getStringAttributeFromObject(attr_string, hit._highlightResult);
    return v ? v : getStringAttributeFromObject(attr_string, hit);
  }
  
  // handle attribute from tree
  function getStringAttributeFromObject(attr_string, hit) {
    var attr_array = attr_string.split(".");
    var attr = hit;
    $.each(attr_array, function(i) {
      attr = attr && attr[attr_array[i]];
    });
    if (!attr) {
      return false;
    }
    if (attr.value) {
      // we're on a highlighted form
      return attr.value;
    }
    if (Object.prototype.toString.call(attr) === '[object Array]') {
      var str = [];
      $.each(attr, function(i, e) {
        if (e && typeof e === 'string') {
          str.push(e);
        } else if (e && e.value) {
          str.push(e.value);
        } else if (e) {
          str.push(objToString(e));
        }
      });
      return str.join(', ');
    }
    if (typeof attr === 'object') {
      attr = objToString(attr);
    }
    return '' + attr;
  }
  
  // attribute to skip every time
  var skip = [
    'objectID',
    '_highlightResult'
  ];
  
  // attribute to skip at the end since it can be multi-attribute
  var attributeToSkip = [];
  if ('title' !== ''){
    attributeToSkip.push('title');
  }
  if ('tags' !== ''){
    attributeToSkip.push('tags');
  };
  if ('content' !== ''){
    attributeToSkip.push('');
  };
  
  // retrieve all keys and remove skipped ones
  function retrieveAllAttributes(hit){
    var i = 0;
    var allkeys = [];
    iterate(hit, '' , allkeys);
    for (var attr in attributeToSkip){
      var s = allkeys.indexOf(attributeToSkip[attr]);
      if(s != -1) {
        allkeys.splice(s, 1);
      }
    }
    return allkeys;
  }
  
  // recursively find keys in object
  function iterate(obj, stack , allkeys) {
    var dot = stack === '' ? '' : '.';
    for (var property in obj) {
      if ( obj.hasOwnProperty(property) && skip.indexOf(property) === -1 ) {
        if (typeof obj[property] === "object") {
          if (Object.prototype.toString.call(obj[property]) === '[object Array]') {
            allkeys.push(stack + dot + property);
          } else {
            iterate(obj[property], stack + dot + property, allkeys);
          }
        } else {
          allkeys.push(stack + dot + property);
        }
      }
    }
  }
  
  function urlMatch(url) {
    var urlRegex = new RegExp(
      "^" +
        // protocol identifier
        "(?:(?:https?|ftp)://)" +
        // user:pass authentication
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:" +
          // IP address exclusion
          // private & local networks
          "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
          "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
          "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
          // IP address dotted notation octets
          // excludes loopback network 0.0.0.0
          // excludes reserved space >= 224.0.0.0
          // excludes network & broacast addresses
          // (first & last IP address of each class)
          "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
          "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
          "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
        "|" +
          // host name
          "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
          // domain name
          "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
          // TLD identifier
          "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
          // TLD may end with dot
          "\\.?" +
        ")" +
        // port number
        "(?::\\d{2,5})?" +
        // resource path
        "(?:[/?#]\\S*)?" +
      "$", "i"
    );
  
    return !!String(url).match(urlRegex);
  }
  
  $(function() {
    var algolia = algoliasearch(lagoliaAppID, lagoliaSearchKey);
    var index = algolia.initIndex(lagoliaIndex);
  
    $("#inputfield input").autocomplete(null, {
      source: index.ttAdapter({ hitsPerPage: 5 }),
      displayKey: 'title',
      debug: true,
      templates: {
        suggestion: function(item) {
          
          return '<div class="autocomplete-suggestion" ' +
                            'data-term="" ' +
                            'data-title="' + item.title + '" ' +
                            'title="' + item.title + '" ' +
                            'data-uri="'+ item.uri + '" ' +
                            'data-context="' + item.context + '">' +
                            '» ' + item.title +
                            '<div class="context">' +
                            (item.context || '') +'</div>' +
                            '</div>';
          return res;
        }
      }
    }).on('autocomplete:selected', function(event, suggestion, dataset) {
      if (stripTags('uri') !== '') {
        var url = getStringAttributeFromObject('uri', suggestion);
  
        if (urlMatch(url)) {
          location.href = url;
        }
      }
    });
  });
(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Kin.Messages.SentView = (function() {
    __extends(SentView, Kin.Messages.InboxView);
    function SentView() {
      SentView.__super__.constructor.apply(this, arguments);
    }
    return SentView;
  })();
}).call(this);
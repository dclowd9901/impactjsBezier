ig.module(
  'plugins.bezier.edit-bezier'
)
.requires(
  'weltmeister.edit-map'
)
.defines(function(){ "use strict";
  
wm.EditBezier = wm.EditMap.extend({
  bezier: true,

  getSaveData: function() {
    var saveData = this.parent();
    saveData.bezier = this.bezier;
    return saveData;
  },
});

});
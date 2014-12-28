ig.module('plugins.bezier.path')
.requires(
  'plugins.bezier.utils'
)
.defines( function(){
  var bezierUtils;

  BezierPath = ig.Class.extend({
    groups: null,
    totalLength: null,
    stepsLength: null,
    visualSteps: 50,
    visualPlot : [],
    curvePixel: null,
    offset: { x: 0, y: 0 },

    init: function( name, data, offset ){

      bezierUtils = new BezierUtils();

      this.name = name;

      this.offset = offset || this.offset;

      this.totalLength = data.totalLength;
      this.groups = data.bezierList;
      this.stepsLength = bezierUtils.getTotalStepsLength( this.groups );

      this.visualPlot = this.createVisualPlot( this.groups );
    },

    createVisualPlot: function (groups) {
      var self = this,
          visualPlot = [];

      _.forEach(groups, function (group) {
        var sub;

        for (var i = 0; i < group.length - 1; i++) {
          sub = bezierUtils.getCurveSubsection(group, i);

          if (self.offset.x) {
            sub.p1.x -= self.offset.x;
            sub.h1.x -= self.offset.x;
            sub.h2.x -= self.offset.x;
            sub.p2.x -= self.offset.x;
          }

          if (self.offset.y) {
            sub.p1.y -= self.offset.y;
            sub.h1.y -= self.offset.y;
            sub.h2.y -= self.offset.y;
            sub.p2.y -= self.offset.y;
          }

          for (var j = 0; j <= 1; j+= 1/self.visualSteps) {
            visualPlot.push(bezierUtils.bezierCurvePoint(sub.p1, sub.h1, sub.h2, sub.p2, j ));
          }
        }
      });

      return visualPlot;
    }
  });
});
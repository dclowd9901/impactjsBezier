ig.lib = '/lib/';

ig.module('plugins.bezier.test.utils-test')
.requires('plugins.bezier.utils')
.defines( function(){

  var bezierUtils = new BezierUtils();

  test( 'getArcTan', function(){
    ok( Math.PI/2 === bezierUtils.getArcTan({ x: 0, y: 0 }, { x: 0, y: 2 }), '90 deg should equal pi/2' );    
    ok( Math.PI === bezierUtils.getArcTan({ x: 0, y: 0 }, { x: -2, y: 0 }), '180 deg should equal pi' );
    ok( -Math.PI/2 === bezierUtils.getArcTan({ x: 0, y: 0 }, { x: 0, y: -2 }), '270 deg should equal pi/-2' );        
    ok( 0 === bezierUtils.getArcTan({ x: 0, y: 0 }, { x: 2, y: 0 }), '360 deg should equal 0' );
  });

  test( 'pointInRelationToOrigin', function(){
    var p1     = {x: 2, y: 2},
        p2     = {x: 3, y: 3},
        expRes = {x: 1, y: 5},
        actRes = bezierUtils.pointInRelationToOrigin( p1, p2 );

    ok( expRes.x === actRes.x, 'x returns correct');
    ok( expRes.y === actRes.y, 'y returns correct');    
  });

  test( 'distanceBetweenPoints', function(){
    var p1 = {x: 0, y: 0},
        p2 = {x: 3, y: -4};

    ok( bezierUtils.distanceBetweenPoints( p1, p2 ) === 5, '3^2 + 4^2 = sqrt(5^2)' );
  });

  test( 'bezierCurvePoint', function(){
    var p1 = {x: 0,   y: 0},
        h1 = {x: -10, y: 0},
        h2 = {x: -10, y: -10},
        p2 = {x: 0,   y: -10}
        step = 0.5;

        ok( _.isEqual( bezierUtils.bezierCurvePoint( p1, h1, h2, p2, step ), {x: -7.5, y: -5}  ) );
  });

  test( 'estimateCurveLength', function(){
    var bezier = {
          p1 : {x: 0,   y: 0},
          h1 : {x: -10, y: 0},
          h2 : {x: -10, y: -10},
          p2 : {x: 0,   y: -10}
        },
        accuracy = 100,
        start    = 0,
        end      = 1;

        ok( bezierUtils.estimateCurveLength( bezier, accuracy, start, end ) === 19.702199646983793 );
  });
});
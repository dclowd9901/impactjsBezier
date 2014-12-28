Impact.js Bezier
================

A library to create, edit and utilize bezier curves in your games.

Installation
------------
In your `lib` directory, create a new folder (if it doesn't already exist)

    mkdir plugins
    cd plugins
    git clone git://github.com/dclowd9901/impactjsBezier.git bezier

This will clone the library to your game.

To get the tools in your editor, go to your `weltmeister.html` file (usually in your base impact.js directory alongside index.html), then add these two lines to your `<head>` area:

    <script src="lib/plugins/bezier/lodash.js" type="text/javascript" charset="utf-8"></script>
    <script src="lib/plugins/bezier/weltmeister.js" type="text/javascript" charset="utf-8"></script>

Usage
-----

Assuming everything went well above, go to your weltmeister editor, and when you add a new layer, there should be a new option called "Is Bezier Layer". When chosen, this option will allow you to draw bezier curves anywhere in the canvas area.

I based the tooling on Adobe's Illustrator and Photoshop as much as possible.

#### New bezier group:

Make sure no current bezier points are selected and click anywhere in the drawing area. If a bezier point is selected, and you want to create an entirely new group, press Escape to unselect all.

#### Add to another bezier group.

Select a point from that group and click. The new point will be drawn in between the last point you clicked and the one after it.

#### Delete a point:

Click the point you want to delete and press the Delete or Backspace key. This goes for any selected point.

#### Move a point:

Click the point you want to move and drag it to the place you want to (kinda duh here).

#### Adjust curve of a point:

Click the point whose curve you want to adjust, and pull one of the handles. As a rule, if a point has two neighboring points, it will have two handles, otherwise, it will have only one.

This will also simultaneously adjust the opposite handle.

#### Adjust only one side of the curve:

Press and hold `ALT` (or `Option` on Mac) and click and drag the point. This will not affect the opposite handle's position.

#### Adjust handle by incremental steps:

Press and hold 'N' (for "nearest") and drag handle. This will move it in 45 Degree increments. You can adjust the increments in the config file.

Known issues
------------

Even after unselecting a layer as a bezier layer, I don't think it resets it. I have to fix this behavior.
There are memory leaks. Sorry in advance.
I'm storing the cached curve information, and I normally wouldn't. 





Legal
-----
The MIT License (MIT)

Copyright (c) <year> <copyright holders>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
